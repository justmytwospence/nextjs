import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type {
  DetailedSegmentEffort,
  SummarySegment,
} from "@/lib/strava/schemas/strava";
import { convertKeysToCamelCase } from "../utils";

export async function upsertSegment(
  segment: SummarySegment,
  userId: string
): Promise<void> {
  baseLogger.info(`Upserting segment ${segment.name}`);

  const segmentData = convertKeysToCamelCase<SummarySegment>(segment);

  const { athleteSegmentStats, ...inputData } = segmentData;

  try {
    await prisma.segment.upsert({
      where: {
        id_userId: {
          id: inputData.id,
          userId,
        },
      },
      create: {
        ...inputData,
        userId,
      },
      update: {
        ...inputData,
        userId,
      },
    });
  } catch (error) {
    baseLogger.error(`Failed to upsert segment ${segment.name}: ${error}`);
    throw error;
  }
}

export async function upsertSegmentEffort(
  segmentEffort: DetailedSegmentEffort,
  userId: string
): Promise<void> {
  baseLogger.info(`Upserting segment effort ${segmentEffort.name}`);

  const segmentEffortData =
    convertKeysToCamelCase<DetailedSegmentEffort>(segmentEffort);

  const {
    athlete,
    segment,
    activity,
    activityId, // use activity.id
    ...inputData
  } = segmentEffortData;

  try {
    await prisma.segmentEffort.upsert({
      where: {
        id: inputData.id,
      },
      create: {
        ...inputData,
        segmentId: segment?.id,
        activityId: activity?.id,
        userId
      },
      update: {
        ...inputData,
        segmentId: segment?.id,
        activityId: activity?.id,
        userId
      },
    });
  } catch (error) {
    baseLogger.error(
      `Failed to upsert segment effort ${segmentEffort.name}: ${error}`
    );
    throw error;
  }
}
