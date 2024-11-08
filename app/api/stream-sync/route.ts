import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { baseLogger } from "@/lib/logger";
import { enrichUserRoute, upsertUserActivity, upsertUserRoute } from "@/lib/db";
import { fetchActivities, fetchDetailedActivity, fetchRouteGeoJson, fetchRoutes } from "@/lib/strava-api";
import { HttpError } from "@/lib/errors";

type Message =
  | { type: "start", message: string, n: number }
  | { type: "update", message: string }
  | { type: "fail", route: string, error: string }
  | { type: "complete" }

export async function GET(request: Request) {
  const session = await auth();
  if (!session) {
    return new NextResponse(null, { status: 401 })
  };

  const { searchParams } = new URL(request.url);
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  async function send(message: Message) {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
    } catch (error) {
      baseLogger.error(`Failed to write to stream: ${error}`);
      throw error;
    }
  }

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
        syncRoutes(session.user.id, searchParams, send).finally(() => writer.close());
        break;
      case "activities":
        syncActivities(session.user.id, searchParams, send).finally(() => writer.close());
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
  send: (message: Message) => Promise<void>
) {
  try {
    const pageSize = parseInt(searchParams.get("page_size") || "2");
    const page = parseInt(searchParams.get("page") || "1");

    // Fetch all routes first
    const allRoutes = await fetchRoutes(userId, pageSize, page);
    if (!allRoutes || allRoutes.length === 0) {
      await send({ type: "complete" });
      return;
    }

    baseLogger.info(`Syncing ${allRoutes.length} routes fetched from Strava`);
    await send({
      type: "start",
      message: `Syncing ${allRoutes.length} routes fetched from Strava`,
      n: allRoutes.length
    });

    for (const route of allRoutes) {
      try {
        await send({
          type: "update",
          message: `Syncing route ${route.name}...`
        });

        await upsertUserRoute(userId, route);
        const geoJson = await fetchRouteGeoJson(userId, route.id_str);
        await enrichUserRoute(userId, route.id_str, geoJson);
      } catch (error) {
        if (error instanceof HttpError && error.status === 429) {
          baseLogger.warn("Rate limited by Strava, waiting 15 seconds...");
          await new Promise(resolve => setTimeout(resolve, 15 * 1000));
          continue;
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await send({
          type: "fail",
          route: route.name,
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
  send: (message: Message) => Promise<void>
) {
  const pageSize = parseInt(searchParams.get("page_size") || "2");
  const page = parseInt(searchParams.get("page") || "1");

  try {
    const activities = await fetchActivities(userId, pageSize, page);
    await send({
      type: "start",
      message: `Syncing ${activities.length} activities fetched from Strava...`,
      n: activities.length
    });

    for (const summaryActivity of activities) {
      try {
        await send({
          type: "update",
          message: `Syncing activity ${summaryActivity.name}...`,
        });
        const activity = await fetchDetailedActivity(userId, summaryActivity.id);
        await upsertUserActivity(userId, activity);
      } catch (error) {
        if (error instanceof HttpError && error.status === 429) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await send({
          type: "fail",
          route: summaryActivity.name,
          error: `Failed to sync route ${summaryActivity.name}: ${errorMessage}`,
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