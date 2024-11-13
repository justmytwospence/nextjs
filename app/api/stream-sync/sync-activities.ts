
import { upsertDetailedActivity, upsertSegment, upsertSegmentEffort, upsertSummaryActivity } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { fetchActivities, fetchDetailedActivity } from "@/lib/strava";
import { SummaryActivity } from "@/lib/strava/schemas/strava";
import { streamManager } from "./stream-utils";

export async function syncActivities(
  userId: string,
  searchParams: URLSearchParams,
) {
  try {
    const perPage = parseInt(searchParams.get("per_page") || "2");
    const page = parseInt(searchParams.get("page") || "1");

    const summaryActivities = await fetchActivities(userId, perPage, page)

    if (!summaryActivities || summaryActivities.length === 0) {
      await streamManager.send({ type: "complete" });
      return;
    }

    baseLogger.info(`Found ${summaryActivities.length} activities from Strava`);
    await streamManager.send({
      type: "update_total",
      message: `Found ${summaryActivities.length} activities from Strava...`,
      n: summaryActivities.length,
    });

    const filteredActivities = summaryActivities.filter(async (summaryActivity: SummaryActivity) => {
      const existingActivity = await upsertSummaryActivity(userId, summaryActivity);
      if (existingActivity?.polyline) {
        baseLogger.info(`Activity ${summaryActivity.name} already exists in detailed form, skipping...`); await streamManager.send({
          type: "update_current",
          message: `Found ${summaryActivities.length} activities from Strava, already synced ${existingActivity.name} `
        });
        return false;
      }
      return true;
    });

    baseLogger.info(`Syncing ${filteredActivities.length} new activities`);
    await streamManager.send({
      type: "update_total",
      message: `Syncing ${filteredActivities.length} activities from Strava...`,
      n: filteredActivities.length,
    });


    for (const summaryActivity of filteredActivities) {
      try {
        await streamManager.send({
          type: "update_current",
          message: `Syncing activity ${summaryActivity.name}...`,
        });

        const detailedActivity = await fetchDetailedActivity(userId, summaryActivity.id);

        await upsertDetailedActivity(userId, detailedActivity);

        // store segment efforts and detailed segments if the activity has them
        if (detailedActivity.segment_efforts) {
          for (const segmentEffort of detailedActivity.segment_efforts) {
            if (segmentEffort.segment) {
              // Not 100% sure that all segment efforts have a segment
              upsertSegment(segmentEffort?.segment, userId);
              upsertSegmentEffort(segmentEffort);
            }
          }
        }

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        baseLogger.error(`Failed to sync activity ${summaryActivity.name}: ${errorMessage}`);
        await streamManager.send({
          type: "update_failed",
          name: summaryActivity.name,
          error: `Failed to sync activity ${summaryActivity.name}: ${errorMessage}`,
        });
      }
    }
    await streamManager.send({ type: "complete" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    baseLogger.error(`Sync failed: ${errorMessage}`);
    throw error;
  }
}