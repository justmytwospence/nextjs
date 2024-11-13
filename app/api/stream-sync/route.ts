import { auth } from "@/auth";
import { enrichUserRoute, upsertDetailedActivity, upsertSegment, upsertSegmentEffort, upsertSummaryActivity, upsertUserRoute } from "@/lib/db";
import { HttpError } from "@/lib/errors";
import { baseLogger } from "@/lib/logger";
import { fetchActivities, fetchDetailedActivity, fetchDetailedSegment, fetchRouteGeoJson, fetchRoutes } from "@/lib/strava";
import { DetailedActivity, Route, SummaryActivity } from "@/lib/strava/schemas/strava";
import { NextResponse } from "next/server";

type Message =
  | { type: "update_total", message: string, n: number }
  | { type: "update_current", message: string }
  | { type: "update_failed", name: string, error: string }
  | { type: "update_message", message: string }
  | { type: "complete", error?: string }

let writer: WritableStreamDefaultWriter<any>;
const encoder = new TextEncoder();

async function send(message: Message) {
  try {
    await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
  } catch (error) {
    baseLogger.error(`Failed to write to stream: ${error}`);
    throw error;
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new NextResponse(null, { status: 401 })
  };

  const { searchParams } = new URL(request.url);
  const stream = new TransformStream();
  writer = stream.writable.getWriter();

  // Start the response immediately
  const response = new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });

  // Sync in the background
  try {
    switch (searchParams.get("type")) {
      case "routes":
        syncRoutes(session.user.id, searchParams).finally(() => writer.close());
        break;
      case "activities":
        syncActivities(session.user.id, searchParams).finally(() => writer.close());
        break;
      case "all":
        syncRoutes(session.user.id, searchParams);
        syncActivities(session.user.id, searchParams);
        writer.close()
        break;

      default:
        throw new Error("Invalid type");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw new Error(`Failed to sync: ${errorMessage}`);
  }
  return response;
}

async function syncRoutes(
  userId: string,
  searchParams: URLSearchParams,
) {
  try {
    const perPage = parseInt(searchParams.get("per_page") || "1000");
    const page = parseInt(searchParams.get("page") || "1");

    // Direct API call now handles retries
    const routes = await fetchRoutes(userId, perPage, page);

    if (!routes || routes.length === 0) {
      await send({ type: "complete" });
      return;
    }

    baseLogger.info(`Found ${routes.length} routes from Strava`);
    await send({
      type: "update_total",
      message: `Found ${routes.length} activities from Strava...`,
      n: routes.length,
    });

    const filteredRoutes = routes.filter(async (route: Route) => {
      const existingRoute = await upsertUserRoute(userId, route);
      if (existingRoute.polyline) {
        baseLogger.info(`Route ${route.name} already exists in detailed form, skipping...`);
        await send({
          type: "update_current",
          message: `Found ${routes.length} activities from Strava, already synced ${route.name} `
        });
        return false;
      }
      return true;
    });

    baseLogger.info(`Syncing ${filteredRoutes.length} new routes`);
    await send({
      type: "update_total",
      message: `Syncing ${filteredRoutes.length} activities from Strava...`,
      n: routes.length
    });

    for (const route of filteredRoutes) {
      try {
        await send({
          type: "update_current",
          message: `Syncing route ${route.name}...`
        });

        const geoJson = await fetchRouteGeoJson(userId, route.id_str);
        await enrichUserRoute(userId, route.id_str, geoJson);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await send({
          type: "update_failed",
          name: route.name,
          error: `Failed to sync route ${route.name}: ${errorMessage}`,
        });
      }
    }
    await send({ type: "complete" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    baseLogger.error(`Sync failed: ${errorMessage}`);
    throw error;
  }
}

async function syncActivities(
  userId: string,
  searchParams: URLSearchParams,
) {
  try {
    const perPage = parseInt(searchParams.get("per_page") || "2");
    const page = parseInt(searchParams.get("page") || "1");

    // Direct API call now handles retries
    const summaryActivities = await fetchActivities(userId, perPage, page);

    if (!summaryActivities || summaryActivities.length === 0) {
      await send({ type: "complete" });
      return;
    }

    baseLogger.info(`Found ${summaryActivities.length} activities from Strava`);
    await send({
      type: "update_total",
      message: `Found ${summaryActivities.length} activities from Strava...`,
      n: summaryActivities.length,
    });

    const filteredActivities = summaryActivities.filter(async (summaryActivity: SummaryActivity) => {
      const existingActivity = await upsertSummaryActivity(userId, summaryActivity);
      if (existingActivity?.polyline) {
        baseLogger.info(`Activity ${summaryActivity.name} already exists in detailed form, skipping...`); await send({
          type: "update_current",
          message: `Found ${summaryActivities.length} activities from Strava, already synced ${existingActivity.name} `
        });
        return false;
      }
      return true;
    });

    baseLogger.info(`Syncing ${filteredActivities.length} new activities`);
    await send({
      type: "update_total",
      message: `Syncing ${filteredActivities.length} activities from Strava...`,
      n: filteredActivities.length,
    });


    for (const summaryActivity of filteredActivities) {
      try {
        await send({
          type: "update_current",
          message: `Syncing activity ${summaryActivity.name}...`,
        });

        const detailedActivity = await fetchDetailedActivity(userId, summaryActivity.id);

        await upsertDetailedActivity(userId, detailedActivity);

        // store segment efforts and detailed segments if the activity has them
        if (detailedActivity.segment_efforts) {
          for (const segmentEffort of detailedActivity.segment_efforts) {
            if (segmentEffort.segment) {
              // Not 100% sure that all segment efforts have a segment
              upsertSegment(segmentEffort?.segment, userId);
              upsertSegmentEffort(segmentEffort);
            }
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        baseLogger.error(`Failed to sync activity ${summaryActivity.name}: ${errorMessage}`);
        await send({
          type: "update_failed",
          name: summaryActivity.name,
          error: `Failed to sync activity ${summaryActivity.name}: ${errorMessage}`,
        });
      }
    }
    await send({ type: "complete" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    baseLogger.error(`Sync failed: ${errorMessage}`);
    throw error;
  }
}