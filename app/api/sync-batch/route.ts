import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { createSessionLogger } from '@/lib/logger';
import { enrichUserActivity, enrichUserRoute, upsertUserActivity, upsertUserRoute } from '@/lib/db';
import { fetchActivities, fetchDetailedActivity, fetchRouteGeoJson, fetchRoutes } from '@/lib/strava-api';
import { Session } from "next-auth";

type Message =
  | { type: 'start', message: string, n: number }
  | { type: 'update', message: string }
  | { type: 'fail', route: string, error: string }
  | { type: 'complete' }
  | { type: 'error', error: string };

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

  // Sync in the background
  syncBatch(session, searchParams, send).finally(() => writer.close());

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function syncBatch(session: Session, searchParams: URLSearchParams, send) {
  const sessionLogger = createSessionLogger(session);

  const perPage = parseInt(searchParams.get('page_size') || '2');
  const page = parseInt(searchParams.get('page') || '1');

  try {
    // Sync activities
    const summaryActivities = await fetchActivities(session, perPage, page);
    await send({
      type: 'start',
      message: `Syncing ${summaryActivities.length} fetched from Strava...`,
      n: summaryActivities.length
    });
    for (const summaryActivity of summaryActivities) {
      await send({
        type: 'update',
        message: `Syncing activity ${summaryActivity.name}...`,
      });
      await upsertUserActivity(session, summaryActivity);
      const detailedActivity = await fetchDetailedActivity(session, summaryActivity.id);
      await enrichUserActivity(session, detailedActivity);
    }

    // Sync routes
    const routes = await fetchRoutes(session, perPage, page);
    await send({
      type: 'start',
      message: `Syncing ${routes.length} routes fetched from Strava`,
      n: routes.length
    });
    for (const route of routes) {
      try {
        await send({
          type: 'update',
          message: `Syncing route ${route.name}...`
        });
        await upsertUserRoute(session, route);
        const routeJson = await fetchRouteGeoJson(session, route.id_str);
        await enrichUserRoute(session, route.id_str, routeJson);
        await send({ message: `Successfully synced route ${route.name}` });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await send({
          type: 'fail',
          message: `Failed to sync route ${route.name}: ${errorMessage}`,
          route: route.name,
        });
      }
    }
    await send({ type: 'complete' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    sessionLogger.error(`Sync failed: ${errorMessage}`);
    await send({
      type: 'error',
      error: errorMessage,
    });
  }
}