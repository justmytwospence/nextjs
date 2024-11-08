import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { baseLogger } from "@/lib/logger";
import { enrichUserRoute, upsertUserActivity, upsertUserRoute } from "@/lib/db";
import { fetchActivities, fetchDetailedActivity, fetchRouteGeoJson, fetchRoutes } from "@/lib/strava-api";
import { HttpError } from "@/lib/errors";

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

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  const MAX_RETRIES = 5;
  const BASE_DELAY = 15000; // 15 seconds

  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 429 || retryCount >= MAX_RETRIES) {
      throw error;
    }

    const delay = BASE_DELAY * Math.pow(2, retryCount);
    baseLogger.warn(`Rate limited by Strava, waiting ${delay / 1000} seconds before retry ${retryCount + 1}...`);
    await send({
      type: "update_message",
      message: `Rate limited by Strava, waiting ${delay / 1000} seconds before retry ${retryCount + 1}...`
    })
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retryCount + 1);
  }
}

type Message =
  | { type: "update_total", message: string, n: number }
  | { type: "update_current", message: string }
  | { type: "update_failed", route: string, error: string }
  | { type: "update_message", message: string }
  | { type: "complete" }

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

    // Fetch all routes first with backoff
    const routes = await retryWithBackoff(async () => {
      return fetchRoutes(userId, perPage, page)
    });

    if (!routes || routes.length === 0) {
      await send({ type: "complete" });
      return;
    }

    for (const route of routes) {
      const existingRoute = await upsertUserRoute(userId, route);
      if (existingRoute && existingRoute.polyline) {
        baseLogger.info(`Route ${route.name} already enriched, removing from list to enrich...`);
        routes.splice(routes.indexOf(route), 1);
      }
    }

    baseLogger.info(`Syncing ${routes.length} routes fetched from Strava`);
    await send({
      type: "update_total",
      message: `Syncing ${routes.length} routes fetched from Strava`,
      n: routes.length
    });

    for (const route of routes) {
      try {
        await send({
          type: "update_current",
          message: `Syncing route ${route.name}...`
        });

        await retryWithBackoff(async () => {
          const geoJson = await fetchRouteGeoJson(userId, route.id_str);
          await enrichUserRoute(userId, route.id_str, geoJson);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await send({
          type: "update_failed",
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
) {
  const perPage = parseInt(searchParams.get("per_page") || "2");
  const page = parseInt(searchParams.get("page") || "1");

  try {
    const summaryActivities = await retryWithBackoff(async () => {
      return fetchActivities(userId, perPage, page)
    });

    if (!summaryActivities || summaryActivities.length === 0) {
      await send({ type: "complete" });
      return;
    }

    for (const summaryActivity of summaryActivities) {
      const existingActivity = await upsertUserActivity(userId, summaryActivity);
      if (existingActivity && existingActivity.polyline) {
        baseLogger.info(`Activity ${summaryActivity.name} already exists in detailed form, skipping...`);
        summaryActivities.splice(summaryActivities.indexOf(summaryActivity), 1);
      }
    }

    baseLogger.info(`Syncing ${summaryActivities.length} activities fetched from Strava`);
    await send({
      type: "update_total",
      message: `Syncing ${summaryActivities.length} activities fetched from Strava...`,
      n: summaryActivities.length
    });

    for (const summaryActivity of summaryActivities) {
      try {
        await send({
          type: "update_current",
          message: `Syncing activity ${summaryActivity.name}...`,
        });

        await retryWithBackoff(async () => {
          const detailedActivity = await fetchDetailedActivity(userId, summaryActivity.id);
          await upsertUserActivity(userId, detailedActivity);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        baseLogger.error(`Failed to sync activity ${summaryActivity.name}: ${errorMessage}`);
        await send({
          type: "update_failed",
          route: summaryActivity.name,
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