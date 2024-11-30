"use server";

import { auth } from "@/auth";
import { upsertRoute } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { fetchRoutes } from "@/lib/strava";
import pLimit from "p-limit";

type SyncRoutesMessage = {
  type: "info" | "success" | "error" | "warning";
  message: string;
};

export default async function syncRoutes(): Promise<
  AsyncGenerator<SyncRoutesMessage>
> {
  async function* generator(): AsyncGenerator<SyncRoutesMessage> {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      baseLogger.info("Syncing routes");

      let currentPage = 1;
      const limit = pLimit(5);
      let syncedCount = 0;

      while (true) {
        const { routes, unrecognizedKeys } = await fetchRoutes(
          session.user.id,
          currentPage
        );

        if (unrecognizedKeys.size > 0) {
          yield {
            type: "warning",
            message: `Unrecognized keys: ${Array.from(unrecognizedKeys).join(
              ", "
            )}`,
          };
        }

        if (!routes?.length) break;

        baseLogger.info(
          `Syncing page ${currentPage} with ${routes.length} routes`
        );
        yield {
          type: "info",
          message: `Syncing page ${currentPage} with ${routes.length} routes`,
        };

        await Promise.all(
          routes.map((route) =>
            limit(async () => {
              try {
                await upsertRoute(session.user.id, route);
                syncedCount++;
              } catch (error) {
                baseLogger.error(`Failed to sync route ${route.id}:`, error);
              }
            })
          )
        );

        currentPage++;
      }

      baseLogger.info(`Successfully synced ${syncedCount} routes`);
      yield {
        type: "success",
        message: `Successfully synced ${syncedCount} routes`,
      };
    } catch (error) {
      baseLogger.error("Failed to sync routes:", error);
      yield { type: "error", message: "Failed to sync routes" };
      throw error;
    }
  }

  return generator();
}
