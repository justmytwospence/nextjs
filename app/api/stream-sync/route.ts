import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { baseLogger } from "@/lib/logger";
import { enrichUserRoute, upsertSummaryActivity, upsertDetailedActivity, upsertUserRoute } from "@/lib/db";
import { fetchActivities, fetchDetailedActivity, fetchRouteGeoJson, fetchRoutes } from "@/lib/strava-api";
import { HttpError } from "@/lib/errors";
import { DetailedActivity, SummaryActivity } from "@/schemas/strava";

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
      baseLogger.error("Non rate-limit error or max retries exceeded, throwing error...");
      throw error;
    }

    if (!error.rateLimit) {
      baseLogger.error("Rate limit exceeded, but no rate limit headers found");
      throw error;
    }

    baseLogger.info(`Rate limit headers: ${JSON.stringify(error.rateLimit, null, 2)}`);

    if (error.rateLimit?.long?.readUsage > error.rateLimit?.long?.readLimit) {
      baseLogger.error("Daily rate limit exceeded, please try again tomorrow");
      await send({
        type: "complete",
        error: "Daily rate limit exceeded, please try again tomorrow"
      });
      throw error;
    }

    const delay = BASE_DELAY * Math.pow(2, retryCount);
    const shortTermUsage = error.rateLimit?.short?.readUsage || 0;
    const shortTermLimit = error.rateLimit?.short?.readLimit || 0;
    baseLogger.warn(`Rate limited by Strava, waiting ${delay / 1000} seconds before retry ${retryCount + 1}... Short term usage: ${shortTermUsage}/${shortTermLimit}`);
    await send({
      type: "update_message",
      message: `Rate limited by Strava ${shortTermUsage} / ${shortTermLimit} in the last 15 minues, waiting ${delay / 1000} seconds before retry ${retryCount + 1}...`,
    });
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retryCount + 1);
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

    // Fetch all routes first with backoff
    const routes = await retryWithBackoff(async () => {
      return fetchRoutes(userId, perPage, page)
    });

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

    for (const route of routes) {
      const existingRoute = await upsertUserRoute(userId, route);
      if (existingRoute && existingRoute.polyline) {
        baseLogger.info(`Activity ${existingRoute.name} already exists in detailed form, skipping...`);
        await send({
          type: "update_current",
          message: `Found ${routes.length} activities from Strava, already synced ${existingRoute.name} `
        })
        routes.splice(routes.indexOf(route), 1);
      }
    }

    baseLogger.info(`Syncing ${routes.length} new routes`);
    await send({
      type: "update_total",
      message: `Syncing ${routes.length} activities from Strava...`,
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

    const summaryActivities = await retryWithBackoff(async () => {
      return fetchActivities(userId, perPage, page)
    });

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
        baseLogger.info(`Activity ${summaryActivity.name} already exists in detailed form, skipping...`);
        await send({
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

        await retryWithBackoff(async () => {
          const detailedActivity = await fetchDetailedActivity(userId, summaryActivity.id);
          await upsertDetailedActivity(userId, detailedActivity);
        });
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