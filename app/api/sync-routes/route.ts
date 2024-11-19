import { upsertUserRoute } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { createSyncEndpoint, fetchRoutes } from "@/lib/strava";
import type { SyncContext } from "@/lib/strava";
import pLimit from "p-limit";

async function syncRoutes(userId: string, syncContext: SyncContext) {
  const { send } = syncContext;
  try {
    const currentPage = 1;
    const routes = []
    while (routes.length > 0) {
      const routes = await fetchRoutes(userId, currentPage);
      baseLogger.info(`Found ${routes.length} routes from Strava`);
      await send({
        type: "update_total",
        message: `Found ${routes.length} activities from Strava...`,
        n: routes.length,
      });

      const limit = pLimit(5);
      const upsertedRoutes = await Promise.all(
        routes.map((route) =>
          limit(async () => {
            upsertUserRoute(userId, route);
          })
        )
      )
    }

    await send({ type: "complete" });

  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await send({
      type: "complete",
      error: errorMessage,
    });
  }
}

export const GET = createSyncEndpoint(syncRoutes);
