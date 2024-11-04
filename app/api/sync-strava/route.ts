import { auth } from "@/auth";
import { fetchUserRoutes, fetchRouteGeoJson, fetchUserSegment } from "@/lib/strava";
import { enrichUserSegment, createUserSegment, enrichUserRoute, upsertUserRoute } from "@/lib/db";
import { NextResponse } from "next/server";
import { createSessionLogger } from '@/lib/logger';
import type { Session } from "next-auth";
import type { AthleteRoute, AthleteRouteSegment } from "@/schemas/strava";

export async function GET() {
  const session = await auth();
  if (!session) { return new NextResponse(null, { status: 401 }) };
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const send = async (message: string) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
  };

  // Start the sync process in the background
  syncRoutes(session, send).finally(() => writer.close());

  return new NextResponse(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function syncSegment(session: Session, segment: AthleteRouteSegment, send: (message: any) => Promise<void>) {
  const sessionLogger = createSessionLogger(session);
  try {
    createUserSegment(session, segment);
    const fullSegment = await fetchUserSegment(session, segment.id);
    enrichUserSegment(session, fullSegment);
  }
  catch (error) {
    const errorMessage = (error as Error).message || 'An unknown error occurred';
    sessionLogger.error(`Segment sync failed for ${segment.name}: ${errorMessage}`);
    await send({
      type: 'fail',
      route: segment.name,
      error: errorMessage
    });
  }
}

async function syncRoute(session: Session, route: AthleteRoute, send: (message: any) => Promise<void>) {
  const sessionLogger = createSessionLogger(session);
  try {
    upsertUserRoute(session, route);
    const routeJson = await fetchRouteGeoJson(session, route.id);
    enrichUserRoute(session, route.id_str, routeJson);
    await send({
      type: 'success',
      route: route.name
    });
  }
  catch (error) {
    const errorMessage = (error as Error).message || 'An unknown error occurred';
    sessionLogger.error(`Route sync failed for ${route.id_str}: ${errorMessage}`);
    await send({
      type: 'fail',
      route: route.name,
      error: errorMessage
    });
  }

  if (!route.segments) {
    sessionLogger.info(`Route ${route.name} has no segments`);
    return;
  }

  for (const segment of route.segments) {
    await send({
      type: 'segment',
      segment: segment.name
    });
    syncSegment(session, segment, send)
  }
}

async function syncRoutes(session: Session, send: (message: any) => Promise<void>) {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Starting route sync');
    await send({ type: 'start' });
    const routes = await fetchUserRoutes(session);
    sessionLogger.info(`Fetched ${routes.length} routes from Strava`);
    await send({
      type: 'fetch',
      nRoutes: routes.length
    });

    for (const route of routes) {
      await send({
        type: 'route',
        route: route.name
      });
      syncRoute(session, route, send);
    }

    sessionLogger.info('Route sync completed');
    await send({ type: 'complete' });

  } catch (error) {
    const errorMessage = (error as Error).message || 'An unknown error occurred';
    sessionLogger.error(`Route sync failed: ${errorMessage}`);
    await send({
      type: 'error',
      error: errorMessage
    });
  }
}
