"use server";

import { auth } from "@/auth";
import {
  querySegments,
  querySegmentCountsByType,
} from "@/lib/db/segments";
import type { Segment } from "@prisma/client";

export default async function fetchSegments(
  activityType = "all",
  page = 1,
  perPage = 24,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
): Promise<{
  segments: Segment[];
  segmentCountsTotal: number;
  segmentCountsByType: Record<string, number>;
}> {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  const segments = await querySegments(
    session.user.id,
    activityType === "all" ? undefined : activityType,
    page,
    perPage,
    sortBy,
    sortOrder
  );

  const segmentCountsByType = await querySegmentCountsByType(session.user.id);

  const segmentCountsTotal = Object.values(segmentCountsByType).reduce(
    (acc, count) => acc + count,
    0
  );

  return {
    segments,
    segmentCountsByType,
    segmentCountsTotal,
  };
}
