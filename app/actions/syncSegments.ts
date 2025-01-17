"use server";

import { auth } from "@/auth";
import { upsertDetailedActivity, upsertSegmentEffort } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { fetchDetailedActivity } from "@/lib/strava";
import pLimit from "p-limit";

type syncSegmentsMessage = {
  type: "info" | "success" | "warning" | "error";
  message: string;
};

export default async function syncActivities(
  activityIds: string[]
): Promise<AsyncGenerator<syncSegmentsMessage>> {
  async function* generator(): AsyncGenerator<syncSegmentsMessage> {
    try {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      baseLogger.info("Syncing segments");

      const limit = pLimit(5);
      await Promise.all(
        activityIds.map((activityId) =>
          limit(async () => {
            const { detailedActivity } = await fetchDetailedActivity(
              session,
              activityId
            );
            await upsertDetailedActivity(session.user.id, detailedActivity);
            if (!detailedActivity.segment_efforts) {
              return;
            }
            detailedActivity.segment_efforts.map(async (segmentEffort) => {
              if (segmentEffort.segment) {
                await upsertSegmentEffort(segmentEffort, session.user.id);
              }
            });
          })
        )
      );
    } catch (error) {
      baseLogger.error("Failed to sync activities:", error);
      yield { type: "error", message: "Failed to sync activities" };
      throw error;
    }
  }

  return generator();
}
