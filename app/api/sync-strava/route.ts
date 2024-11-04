import { auth } from "@/auth";
import { fetchUserRoutes } from "@/lib/strava";
import { upsertRoute } from "@/lib/db";
import { NextResponse } from "next/server";
import { createSessionLogger } from '@/lib/logger';
import type { Session } from "next-auth";

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

async function syncRoutes(session: Session, send: (message: any) => Promise<void>) {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Starting route sync');
    await send({ type: 'start' });

    const routes = await fetchUserRoutes(session);
    sessionLogger.info('Fetched routes from Strava', {
      routeCount: routes.length
    });

    await send({
      type: 'fetch',
      nRoutes: routes.length
    });

    for (const route of routes) {
      sessionLogger.debug('Processing route', {
        routeName: route.name,
        routeId: route.id_str
      });

      await send({
        type: 'upsert',
        route: route.name,
      });
      try {
        await upsertRoute(session, route);
        sessionLogger.info('Route sync successful', {
          routeName: route.name
        });
        await send({
          type: 'success',
          route: route.name
        });
      } catch (err) {
        const error = err as Error;
        sessionLogger.error('Route sync failed', {
          error: error.message,
          routeName: route.name
        });
        await send({
          type: 'fail',
          route: route.name,
          error: error.message
        });
      }
    }

    sessionLogger.info('Route sync completed');
    await send({
      type: 'complete',
    });

  } catch (err) {
    const error = err as Error;
    sessionLogger.error('Route sync failed with error', {
      error: error.message
    });
    await send({
      type: 'error',
      error: error.message
    });
  }
}
