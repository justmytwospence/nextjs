"use server";

import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { DetailedActivity, Route, SummaryActivity } from "@/schemas/strava";
import polyline from "@mapbox/polyline";
import type { Account, UserActivity, UserRoute } from "@prisma/client";
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

export async function queryUserRoutes(userId: string): Promise<UserRoute[]> {
  try {
    baseLogger.info(`Querying user routes for user ${userId}`);
    const routes = await prisma.userRoute.findMany({
      where: { userId },
    });
    baseLogger.info(`Found ${routes.length} routes`);
    return routes;
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
): Promise<void> {
  baseLogger.info(`Upserting route ${route.name}`);

  const data = {
    createdAt: new Date(route.created_at),
    // description: route.description,
    distance: route.distance,
    elevationGain: route.elevation_gain,
    estimatedMovingTime: route.estimated_moving_time,
    id: route.id_str,
    name: route.name,
    private: route.private,
    starred: Boolean(route.starred),
    subType: route.sub_type,
    summaryPolyline: polyline.toGeoJSON(route.map.summary_polyline),
    timestamp: new Date(route.timestamp),
    type: route.type,
    updatedAt: new Date(route.updated_at),
    userId: userId
  }

  try {
    await prisma.userRoute.upsert({
      where: {
        id: route.id_str
      },
      create: data,
      update: data,
    });

    baseLogger.info(`Route ${route.name} upserted successfully`);
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
): Promise<void> {
  baseLogger.info(`Enriching route ${routeId}`);

  try {
    await prisma.userRoute.update({
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

export async function upsertUserActivity(
  userId: string,
  activity: SummaryActivity | DetailedActivity
): Promise<void> {
  baseLogger.info(`Upserting activity ${activity.name}`);

  const data = {
    // Base fields that exist in both types

    id: activity.id.toString(),
    userId,
    achievementCount: activity.achievement_count ?? 0,
    athleteCount: activity.athlete_count ?? 0,
    averageSpeed: activity.average_speed,
    averageWatts: activity.average_watts,
    commentCount: activity.comment_count ?? 0,
    commute: activity.commute ?? false,
    deviceWatts: activity.device_watts,
    distance: activity.distance,
    elapsedTime: activity.elapsed_time,
    elevationHigh: activity.elev_high,
    elevationLow: activity.elev_low,
    flagged: activity.flagged ?? false,
    gearId: activity.gear_id,
    hasKudoed: activity.has_kudoed ?? false,
    hideFromHome: activity.hide_from_home ?? false,
    kilojoules: activity.kilojoules,
    kudosCount: activity.kudos_count ?? 0,
    manual: activity.manual ?? false,
    maxSpeed: activity.max_speed,
    maxWatts: activity.max_watts,
    movingTime: activity.moving_time,
    name: activity.name,
    photoCount: activity.photo_count ?? 0,
    private: activity.private ?? false,
    sportType: activity.sport_type,
    startDate: new Date(activity.start_date),
    startDateLocal: new Date(activity.start_date_local),
    timezone: activity.timezone,
    totalElevationGain: activity.total_elevation_gain,
    totalPhotoCount: activity.total_photo_count ?? 0,
    trainer: activity.trainer ?? false,
    type: activity.type,
    uploadId: activity.upload_id?.toString() ?? "",
    weightedAverageWatts: activity.weighted_average_watts,
    workoutType: activity.workout_type,
    summaryPolyline: activity.map.summary_polyline ? polyline.toGeoJSON(activity.map.summary_polyline) : null,

    // DetailedActivity specific fields - will be undefined if not present

    polyline: activity.map.summary_polyline ? polyline.toGeoJSON(activity.map.polyline) : null,
    calories: "calories" in activity ? activity.calories : undefined,
    description: "description" in activity ? activity.description : undefined,
    deviceName: "device_name" in activity ? activity.device_name : undefined,
    embedToken: "embed_token" in activity ? activity.embed_token : undefined,
    photos: "photos" in activity ? (activity.photos as Prisma.InputJsonValue) : undefined,
  };

  try {
    await prisma.userActivity.upsert({
      where: {
        id_userId: {
          id: activity.id.toString(),
          userId,
        }
      },
      create: data,
      update: data,
    });

    baseLogger.info(`Activity ${activity.name} upserted successfully`);
  } catch (error) {
    baseLogger.error(`Failed to upsert activity ${activity.name}: ${error}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function queryUserActivities(userId: string): Promise<UserActivity[]> {
  try {
    baseLogger.info(`Querying user activities for user ${userId}`);
    const userActivities = await prisma.userActivity.findMany({
      where: {
        userId,
        summaryPolyline: {
          not: Prisma.JsonNullValueFilter.JsonNull
        }
      },
      orderBy: {
        startDateLocal: "desc"
      }
    });
    baseLogger.info(`Found ${userActivities.length} activities`);
    return userActivities;
  } catch (error) {
    throw error;
  }
}

