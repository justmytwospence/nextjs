import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type {
  DetailedActivity,
  SummaryActivity,
} from "@/lib/strava/schemas/strava";
import { convertKeysToCamelCase } from "@/lib/utils";
import type { Activity, MappableActivity } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { LineString } from "geojson";

export async function deleteActivity(
  userId: string,
  activityId: string
): Promise<void> {
    baseLogger.info(`Deleting activity ${activityId}`);
    await prisma.activity.delete({
      where: {
        id_userId: {
          id: activityId,
          userId,
        },
      },
    });
    baseLogger.info(`Deleted activity ${activityId}`);
}

export async function queryMappableActivities(
  userId: string
): Promise<MappableActivity[]> {
    baseLogger.info(`Querying user activities for user ${userId}`);
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        movingTime: {
          gt: 0,
        },
        summaryPolyline: {
          not: Prisma.JsonNullValueFilter.JsonNull,
        },
      },
      orderBy: {
        startDateLocal: "desc",
      },
    });
    baseLogger.info(`Found ${activities.length} activities`);
    return activities as MappableActivity[];
}

export async function queryActivity(
  userId: string,
  activityId: string
): Promise<Activity | null> {
    baseLogger.info(
      `Querying user route for user ${userId} and route ${activityId}`
    );
    const activity = await prisma.activity.findUnique({
      where: {
        id_userId: {
          id: activityId,
          userId,
        },
      },
    });
    baseLogger.info(`Found route ${activityId} to be ${activity?.name}`);
    return activity;
}

export async function upsertSummaryActivity(
  userId: string,
  activity: SummaryActivity
): Promise<Activity> {
  baseLogger.info(`Upserting activity ${activity.name}`);

  const activityData = convertKeysToCamelCase<SummaryActivity>(activity);

  const { map, ...inputData } = activityData;

  try {
    const activity = await prisma.activity.upsert({
      where: {
        id_userId: {
          id: inputData.id,
          userId,
        },
      },
      create: {
        ...inputData,
        summaryPolyline: map.summaryPolyline ?? undefined,
        userId: userId,
      },
      update: {
        ...inputData,
        summaryPolyline: map.summaryPolyline ?? undefined,
        userId: userId,
      },
    });

    baseLogger.info(`Summary activity ${activity.name} upserted successfully`);
    return activity;
  } catch (error) {
    baseLogger.error(`Failed to upsert activity ${activity.name}: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function upsertDetailedActivity(
  userId: string,
  activity: DetailedActivity
): Promise<Activity> {
  baseLogger.info(`Upserting activity ${activity.name}`);

  const activityData = convertKeysToCamelCase<DetailedActivity>(activity);

  const { map, bestEfforts, segmentEfforts, ...inputData } = activityData;

  try {
    const activity = await prisma.activity.upsert({
      where: {
        id_userId: {
          id: inputData.id,
          userId,
        },
      },
      create: {
        ...inputData,
        polyline: map.polyline ?? undefined,
        summaryPolyline: map.summaryPolyline ?? undefined,
        userId: userId,
      },
      update:  {
        ...inputData,
        polyline: map.polyline ?? undefined,
        summaryPolyline: map.summaryPolyline ?? undefined,
        userId: userId,
    }});
    baseLogger.info(`Activity ${activity.name} upserted successfully`);
    return activity;
  } catch (error) {
    baseLogger.error(`Failed to upsert activity ${activity.name}: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
