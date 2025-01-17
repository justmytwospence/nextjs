"use server";

import { auth } from "@/auth";
import { enrichActivity, queryActivity } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { fetchActivityStreams } from "@/lib/strava";
import { isEnrichedActivity, isMappableActivity } from "@/types/transformers";
import type { EnrichedActivity } from "@prisma/client";

export async function fetchActivity(
  activityId: string
): Promise<EnrichedActivity> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const activity = await queryActivity(session.user.id, activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  if (!isMappableActivity(activity)) {
    throw new Error("Activity is not mappable");
  }

  if (!isEnrichedActivity(activity)) {
    baseLogger.info(
      `Activity ${activityId} is missing polyline, fetching detailed activity`
    );

    const { activityStreams } = await fetchActivityStreams(
      session,
      activityId
    );
    const enrichedActivity = await enrichActivity(activityId, activityStreams);
    return enrichedActivity;

  }

  return activity;
}
