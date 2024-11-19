import { upsertSummaryActivity } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import type { SyncContext } from "@/lib/strava";
import { createSyncEndpoint, fetchActivities, fetchRoutes } from "@/lib/strava";
import pLimit from "p-limit";

async function syncActivities(userId: string, syncContext: SyncContext) {
  const { send } = syncContext;
  try {
    const currentPage = 1;
    const summaryActivities = [];

    while (summaryActivities.length > 0) {
      const summaryActivities = await fetchActivities(userId, currentPage);
      baseLogger.info(`Found ${summaryActivities.length} activities from Strava`);
      await send({
        type: "update_total",
        message: `Found ${summaryActivities.length} activities from Strava...`,
        n: summaryActivities.length,
      });

      const activities = await Promise.all(
        summaryActivities.map(async (summaryActivity) => {
          const existingActivity = await upsertSummaryActivity(userId, summaryActivity);
          if (existingActivity?.polyline) {
            baseLogger.info(
              `Activity ${summaryActivity.name} already exists in detailed form, skipping...`
            );
            await send({
              type: "update_current",
              message: `Found ${summaryActivities.length} activities from Strava, already synced ${existingActivity.name}`,
            });
            return null;
          }
          return summaryActivity;
        })
      )
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await send({
      type: "complete",
      error: errorMessage,
    });
  }
}

export const GET = createSyncEndpoint(syncActivities);