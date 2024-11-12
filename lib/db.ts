"use server";

import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { convertKeysToCamelCase } from "@/lib/utils";
import type { DetailedActivity, DetailedSegment, DetailedSegmentEffort, Route, SummaryActivity, SummarySegment } from "@/schemas/strava";
import type { Account, Activity, MappableActivity, Mappable, UserRoute } from "@prisma/client";
import { Prisma } from "@prisma/client";

export async function queryUserAccount(
  userId: string,
  accountProvider: string
): Promise<Account> {
  try {
    baseLogger.info(`Querying ${accountProvider} account for user ${userId}`);
    const account = await prisma.account.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: accountProvider,
        }
      },
    })
    if (!account) {
      baseLogger.warn("No account found", { provider: accountProvider });
      throw new Error(`No ${accountProvider} account found for this user`);
    }
    baseLogger.info(`Found ${accountProvider} account for user ${userId} with access token ${account.access_token}`);
    return account;
  } catch {
    throw new Error(`No ${accountProvider} account found for this user`);
  };
};

export async function deleteUserAccount(
  userId: string,
  accountProvider: string
): Promise<void> {
  try {
    baseLogger.info(`Deleting ${accountProvider} account for user ${userId}`);
    await prisma.account.delete({
      where: {
        userId_provider: {
          userId,
          provider: accountProvider,
        }
      }
    });
    baseLogger.info(`Deleted ${accountProvider} account for user ${userId}`);
  } catch (error) {
    throw error;
  }
}

export async function deleteActivity(
  userId: string,
  activityId: string
): Promise<void> {
  try {
    baseLogger.info(`Deleting activity ${activityId}`);
    await prisma.activity.delete({
      where: {
        id_userId: {
          id: activityId,
          userId,
        }
      }
    });
    baseLogger.info(`Deleted activity ${activityId}`);
  } catch (error) {
    throw error;
  }
}

export async function queryUserRoutes(userId: string): Promise<UserRoute[]> {
  try {
    baseLogger.info(`Querying user routes for user ${userId}`);
    const routes = await prisma.userRoute.findMany({
      where: {
        userId,
        summaryPolyline: {
          not: Prisma.JsonNullValueFilter.JsonNull
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    baseLogger.info(`Found ${routes.length} routes`);
    return routes;
  } catch (error) {
    throw error;
  }
}

export async function queryMappables(userId: string): Promise<Mappable[]> {
  try {
    baseLogger.info(`Querying mappables for user ${userId}`);
    const [routes, activities] = await Promise.all([
      prisma.userRoute.findMany({
        where: {
          userId,
          OR: [
            { summaryPolyline: { not: Prisma.JsonNullValueFilter.JsonNull } },
            { polyline: { not: Prisma.JsonNullValueFilter.JsonNull } }
          ]
        },
      }),
      prisma.activity.findMany({
        where: {
          userId,
          movingTime: {
            gt: 0
          },
          OR: [
            { summaryPolyline: { not: Prisma.JsonNullValueFilter.JsonNull } },
            { polyline: { not: Prisma.JsonNullValueFilter.JsonNull } }
          ]
        },
      })
    ]);
    const mappables = [
      ...routes.map(route => ({ ...route, type: "route" })),
      ...activities.map(activity => ({ ...activity, type: "activity" }))
    ];
    baseLogger.info(`Found ${mappables.length} mappables`);
    return mappables;
  } catch (error) {
    throw error;
  }
}

export async function queryUserRoute(
  userId: string,
  routeId: string
): Promise<UserRoute | null> {
  try {
    baseLogger.info(`Querying user route for user ${userId} and route ${routeId}`);
    const route = await prisma.userRoute.findUnique({
      where: {
        id_userId: {
          id: routeId,
          userId,
        }
      }
    });
    baseLogger.info(`Found route ${routeId} to be ${route?.name}`);
    return route;
  } catch (error) {
    throw error;
  }
}

export async function upsertUserRoute(
  userId: string,
  route: Route
): Promise<UserRoute> {
  baseLogger.info(`Upserting route ${route.name}`);

  const routeData = convertKeysToCamelCase<Route>(route);

  const {
    id,
    idStr,
    map,
    segments,
    ...inputData
  } = routeData

  try {
    const route = await prisma.userRoute.upsert({
      where: {
        id: idStr,
      },
      create: {
        ...inputData,
        id: idStr,
        polyline: (map.polyline as unknown) as Prisma.InputJsonValue || undefined,
        summaryPolyline: (map.summaryPolyline as unknown) as Prisma.InputJsonValue,
        userId: userId,
      },
      update: {
        ...inputData,
        id: idStr,
        polyline: (map.polyline as unknown) as Prisma.InputJsonValue || undefined,
        summaryPolyline: (map.summaryPolyline as unknown) as Prisma.InputJsonValue,
        userId: userId,
      },
    });

    baseLogger.info(`Route ${route.name} upserted successfully`);
    return route
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function enrichUserRoute(
  userId: string,
  routeId: string,
  route: JSON
): Promise<UserRoute> {
  baseLogger.info(`Enriching route ${routeId}`);

  try {
    return await prisma.userRoute.update({
      where: {
        id: routeId,
        userId,
      },
      data: {
        polyline: (route as unknown) as Prisma.InputJsonValue
      }
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function upsertSummaryActivity(
  userId: string,
  activity: SummaryActivity
): Promise<Activity> {
  baseLogger.info(`Upserting activity ${activity.name}`);

  const activityData = convertKeysToCamelCase<SummaryActivity>(activity);

  const {
    map,
    ...inputData
  } = activityData

  try {
    const activity = await prisma.activity.upsert({
      where: {
        id: inputData.id,
      },
      create: {
        ...inputData,
        summaryPolyline: (map.summaryPolyline as unknown) as Prisma.InputJsonValue || undefined,
        userId: userId,
      },
      update: {
        ...inputData,
        summaryPolyline: (map.summaryPolyline as unknown) as Prisma.InputJsonValue || undefined,
        userId: userId,
      },
    });

    baseLogger.info(`Activity ${activity.name} upserted successfully`);
    return activity
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

  const {
    map,
    bestEfforts,
    segmentEfforts,
    ...inputData
  } = activityData

  try {
    const activity = await prisma.activity.upsert({
      where: {
        id: inputData.id,
      },
      create: {
        ...inputData,
        polyline: (map.polyline as unknown) as Prisma.InputJsonValue,
        summaryPolyline: (map.summary_polyline as unknown) as Prisma.InputJsonValue,
        userId: userId,
      },
      update: {
        ...inputData,
        polyline: (map.polyline as unknown) as Prisma.InputJsonValue,
        summaryPolyline: (map.summary_polyline as unknown) as Prisma.InputJsonValue,
        userId: userId,
      },
    });
    baseLogger.info(`Activity ${activity.name} upserted successfully`);
    return activity
  } catch (error) {
    baseLogger.error(`Failed to upsert activity ${activity.name}: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function queryMappableActivities(userId: string): Promise<MappableActivity[]> {
  try {
    baseLogger.info(`Querying user activities for user ${userId}`);
    const activities = await prisma.activity.findMany({
      where: {
        userId,
        movingTime: {
          gt: 0
        },
        summaryPolyline: {
          not: Prisma.JsonNullValueFilter.JsonNull
        }
      },
      orderBy: {
        startDateLocal: "desc"
      }
    });
    baseLogger.info(`Found ${activities.length} activities`);
    return activities as Mappable[];

  } catch (error) {
    throw error;
  }
}

export async function queryActivity(
  userId: string,
  activityId: string
): Promise<Activity | null> {
  try {
    baseLogger.info(`Querying user route for user ${userId} and route ${activityId}`);
    const activity = await prisma.activity.findUnique({
      where: {
        id_userId: {
          id: activityId,
          userId,
        }
      }
    });
    baseLogger.info(`Found route ${activityId} to be ${activity?.name}`);
    return activity;
  } catch (error) {
    throw error;
  }
}

export async function upsertSegment(
  segment: SummarySegment,
  userId: string,
): Promise<void> {
  baseLogger.info(`Upserting segment ${segment.name}`);

  const segmentData = convertKeysToCamelCase<SummarySegment>(segment);

  const {
    athleteSegmentStats,
    ...inputData
  } = segmentData

  try {
    await prisma.segment.upsert({
      where: {
        id_userId: {
          id: inputData.id,
          userId,
        }
      },
      create: {
        ...inputData,
        userId,
      },
      update: {
        ...inputData,
        userId,
      }
    });
  } catch (error) {
    baseLogger.error(`Failed to upsert segment ${segment.name}: ${error}`);
    throw error;
  }
}

export async function upsertSegmentEffort(
  segmentEffort: DetailedSegmentEffort,
): Promise<void> {
  baseLogger.info(`Upserting segment effort ${segmentEffort.name}`);

  const segmentEffortData = convertKeysToCamelCase<DetailedSegmentEffort>(segmentEffort);

  const {
    athlete,
    segment,
    activity,
    ...inputData
  } = segmentEffortData

  try {
    await prisma.segmentEffort.upsert({
      where: {
        id: inputData.id
      },
      create: {
        ...inputData,
        segmentId: segment?.id,
      },
      update: {
        ...inputData,
        segmentId: segment?.id,
      }
    });
  } catch (error) {
    baseLogger.error(`Failed to upsert segment effort ${segmentEffort.name}: ${error}`);
    throw error;
  }
}
