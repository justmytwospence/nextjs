"use server";

import { auth } from "@/auth";
import { upsertSummaryActivity } from "@/lib/db";
import { fetchActivities } from "@/lib/strava";
import pLimit from "p-limit";

export default async function syncActivities(page: number) {
  const session = await auth();
  const activities = await fetchActivities(session?.user.id, page);
  const limit = pLimit(5);
  await Promise.all(
    activities.map((activity) =>
      limit(async () => upsertSummaryActivity(session?.user.id, activity)))
  );
  return activities.length > 0;
}
