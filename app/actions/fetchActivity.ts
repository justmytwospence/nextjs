"use server";

import { auth } from "@/auth";
import { queryActivity, upsertDetailedActivity } from "@/lib/db";
import { fetchDetailedActivity } from "@/lib/strava";
import type { Activity } from "@prisma/client";

export async function fetchActivity(
  activityId: string
): Promise<Activity> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const activity = await queryActivity(session.user.id, activityId);

  if (!activity) {
    throw new Error("Activity not found");
  }

  if (!activity.polyline && activity.summaryPolyline) {
    const detailedActivity = await fetchDetailedActivity(session.user.id,activityId);
    return upsertDetailedActivity(session.user.id, detailedActivity);
  }

  return activity;
}
