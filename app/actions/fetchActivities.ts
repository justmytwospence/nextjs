"use server";

import { auth } from "@/auth";
import { queryActivityCountsByType, queryMappableActivities, queryRouteCountsByType, queryRoutes } from "@/lib/db";
import type { MappableActivity } from "@prisma/client";

export default async function fetchActivities(
  type = "all",
  page = 1,
  perPage = 24
): Promise<{ activities: MappableActivity[],  activityCountsTotal: number, activityCountsByType: Record<string, number> }> {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  const activities = await queryMappableActivities(session.user.id, page, perPage, type === "all" ? undefined : type);
  const activityCountsByType = await queryActivityCountsByType(session.user.id);
  const activityCountsTotal = Object.values(activityCountsByType).reduce((acc, count) => acc + count, 0);

  return {
    activities,
    activityCountsByType,
    activityCountsTotal,
  };
}