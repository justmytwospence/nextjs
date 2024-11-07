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
  | { type: "error", error: string };

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
    await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
  }

  switch (searchParams.get("type")) {
    case "routes":
      await syncRoutes(session.user.id, searchParams, send);
      break;
    case "activities":
      await syncActivities(session.user.id, searchParams, send);
      break;
    default:
      await send({ type: "error", error: "Invalid sync type" });
      writer.close();
      return;
  }

  return new NextResponse(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

async function syncRoutes(userId: string, searchParams: URLSearchParams, send) {
  const perPage = parseInt(searchParams.get("page_size") || "2");
  const page = parseInt(searchParams.get("page") || "1");

  try {
    const routes = await fetchRoutes(userId, perPage, page);
    await send({
      type: "start",
      message: `Syncing ${routes.length} routes fetched from Strava`,
      n: routes.length
    });
    for (const route of routes) {
      try {
        await send({
          type: "update",
          message: `Syncing route ${route.name}...`
        });
        await upsertUserRoute(userId, route);
        const routeJson = await fetchRouteGeoJson(userId, route.id_str);
        await enrichUserRoute(userId, route.id_str, routeJson);
        await send({ message: `Successfully synced route ${route.name}` });
      } catch (error) {
        if (error instanceof HttpError && error.status === 429) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await send({
          type: "fail",
          message: `Failed to sync route ${route.name}: ${errorMessage}`,
          route: route.name,
        });
      }
    }
    await send({ type: "complete" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    baseLogger.error(`Sync failed: ${errorMessage}`);
    await send({
      type: "error",
      error: errorMessage,
    });
  }
}

async function syncActivities(userId: string, searchParams: URLSearchParams, send) {
  const perPage = parseInt(searchParams.get("page_size") || "2");
  const page = parseInt(searchParams.get("page") || "1");

  try {
    const summaryActivities = await fetchActivities(userId, perPage, page);
    await send({
      type: "start",
      message: `Syncing ${summaryActivities.length} activities fetched from Strava...`,
      n: summaryActivities.length
    });
    for (const summaryActivity of summaryActivities) {
      try {
        await send({
          type: "update",
          message: `Syncing activity ${summaryActivity.name}...`,
        });
        const detailedActivity = await fetchDetailedActivity(userId, summaryActivity.id);
        await upsertUserActivity(userId, detailedActivity);
      } catch (error) {
        if (error instanceof HttpError && error.status === 429) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await send({
          type: "fail",
          message: `Failed to sync route ${summaryActivity.name}: ${errorMessage}`,
          route: summaryActivity.name,
        });
      }
      await send({ type: "complete" });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    baseLogger.error(`Sync failed: ${errorMessage}`);
    await send({
      type: "error",
      error: errorMessage,
    });
  }
}