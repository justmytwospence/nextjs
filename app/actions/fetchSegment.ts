"use server";

import { auth } from "@/auth";
import { enrichSegment, querySegment } from "@/lib/db/segments";
import { fetchDetailedSegment, fetchSegmentStreams } from "@/lib/strava";
import { isEnrichedSegment } from "@/types/transformers";
import type { EnrichedSegment, Segment } from "@prisma/client";

export default async function fetchSegment(
  segmentId: string
): Promise<EnrichedSegment> {
  const session = await auth();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const segment = await querySegment(segmentId);

  if (!segment) {
    throw new Error("Route not found");
  }

  if (!isEnrichedSegment(segment)) {
    const { detailedSegment } = await fetchDetailedSegment(
      session.access_token,
      segment.id
    );
    const { segmentStreams } = await fetchSegmentStreams(
      session.access_token,
      segment.id
    );
    const enrichedSegment = await enrichSegment(
      session.user.id,
      segment.id,
      detailedSegment,
      segmentStreams
    );
    return enrichedSegment;
  }

  return segment as EnrichedSegment;
}
