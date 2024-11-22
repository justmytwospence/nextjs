"use server";

import { auth } from "@/auth";
import { upsertSummaryActivity } from "@/lib/db";
import { fetchActivities } from "@/lib/strava";
import pLimit from "p-limit";

async function syncRoutes() {
  const session = await auth();
  let currentPage = 1;
  let activities = await fetchActivities(session?.user.id, currentPage);
  while (activities.length > 0) {
    const limit = pLimit(5);
    await Promise.all(
      activities.map((activity) =>
        limit(async () => upsertSummaryActivity(session?.user.id, activity)))
    )
    currentPage++
    activities = await fetchActivities(session?.user.id, currentPage);
  }
}
