import { auth } from "@/auth";
import { fetchUserRoutes } from "@/lib/strava";
import { upsertRoute } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
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

async function syncRoutes(session, send) {
  try {
    await send({ type: 'start' });

    const routes = await fetchUserRoutes(session);
    console.log(routes)

    await send({
      type: 'fetch',
      nRoutes: routes.length
    });

    await Promise.all(routes.map(async (route) => {
      await send({
        type: 'upsert',
        route: route.name,
      });
      try {
        await upsertRoute(session, route);
        await send({
          type: 'success',
          route: route.name
        })
      } catch (error) {
        await send({
          type: 'fail',
          route: route.name,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }));

    await send({
      type: 'complete',
    });

  } catch (error) {
    console.error("My Error");
    await send({
      type: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
