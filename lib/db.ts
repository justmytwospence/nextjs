"use server";

import { createSessionLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { DetailedActivity, Route, SummaryActivity } from "@/schemas/strava";
import polyline from "@mapbox/polyline";
import { Prisma } from "@prisma/client";
import type { Account, UserActivity, UserRoute } from "@prisma/client";
import type { Session } from "next-auth";

export async function insertApiQuery(
  session: Session,
  provider: string,
  accessToken: string,
  endpoint: string,
  params: URLSearchParams,
) {
  return await prisma.apiQuery.create({
    data: {
      accessToken,
      endpoint,
      params: Object.fromEntries(params.entries()),
      provider,
      userId: session.user.id,
    },
  });
}

export async function queryUserAccount(session: Session, accountProvider: string): Promise<Account> {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info(`Querying ${accountProvider} account for user ${session.user.id}`);
    const account = await prisma.account.findUnique({
      where: {
        userId_provider: {
          userId: session.user.id,
          provider: accountProvider,
        }
      },
    });

    if (!account) {
      sessionLogger.warn("No account found", { provider: accountProvider });
      throw new Error(`No ${accountProvider} account found for this user`);
    }

    return account;
  } catch (error) {
    throw error;
  }
}

export async function queryUserRoutes(session: Session): Promise<UserRoute[]> {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info("Querying user routes for user", { userId: session.user.id });
    const routes = await prisma.userRoute.findMany({
      where: {
        userId: session.user.id
      },
    });
    sessionLogger.info(`Found ${routes.length} routes`);
    return routes;
  } catch (error) {
    throw error;
  }
}

export async function queryUserRoute(session: Session, routeId: string): Promise<UserRoute | null> {
  if (!session) {
    throw new Error("Session is required to query route");
  }
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info("Querying user route");
    const route = await prisma.userRoute.findUnique({
      where: {
        id_userId: {
          id: routeId,
          userId: session.user.id
        }
      }
    });
    sessionLogger.info(`Found route ${routeId} to be ${route?.name}`);
    return route;
  } catch (error) {
    throw error;
  }
}

export async function upsertUserRoute(session: Session, route: Route) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Upserting route ${route.name}`);

  try {

    await prisma.userRoute.upsert({
      where: {
        id: route.id_str
      },
      create: {
        createdAt: new Date(route.created_at),
        description: route.description,
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
        userId: session.user.id,
      },
      update: {
        createdAt: new Date(route.created_at),
        description: route.description,
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
        userId: session.user.id,
      },
    });

    sessionLogger.info(`Route ${route.name} upserted successfully`);
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function enrichUserRoute(session: Session, routeId: string, route: JSON) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Enriching route ${routeId}`);

  try {
    await prisma.userRoute.update({
      where: {
        id: routeId,
        userId: session.user.id
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

export async function upsertUserActivity(session: Session, activity: SummaryActivity) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Upserting activity ${activity.name}`);

  try {
    await prisma.userActivity.upsert({
      where: {
        id_userId: {
          id: activity.id.toString(),
          userId: session.user.id
        }
      },
      create: {
        achievementCount: activity.achievement_count,
        athleteCount: activity.athlete_count,
        averageSpeed: activity.average_speed,
        averageWatts: activity.average_watts,
        commentCount: activity.comment_count,
        commute: activity.commute,
        deviceWatts: activity.device_watts,
        distance: activity.distance,
        elapsedTime: activity.elapsed_time,
        elevationHigh: activity.elev_high,
        elevationLow: activity.elev_low,
        flagged: activity.flagged,
        gearId: activity.gear_id,
        hasKudoed: activity.has_kudoed,
        hideFromHome: activity.hide_from_home || false,
        id: activity.id.toString(),
        kilojoules: activity.kilojoules,
        kudosCount: activity.kudos_count,
        manual: activity.manual,
        maxSpeed: activity.max_speed,
        maxWatts: activity.max_watts,
        movingTime: activity.moving_time,
        name: activity.name,
        photoCount: activity.photo_count,
        private: activity.private,
        sportType: activity.sport_type,
        startDate: new Date(activity.start_date),
        startDateLocal: new Date(activity.start_date_local),
        timezone: activity.timezone,
        totalElevationGain: activity.total_elevation_gain,
        totalPhotoCount: activity.total_photo_count,
        trainer: activity.trainer,
        type: activity.type,
        uploadId: activity.upload_id.toString(),
        weightedAverageWatts: activity.weighted_average_watts,
        workoutType: activity.workout_type,
        userId: session.user.id,

        // If map data exists, store the polyline
        summaryPolyline: activity.map?.summary_polyline ?
          polyline.toGeoJSON(activity.map.summary_polyline) :
          null,
      },
      update: {
        achievementCount: activity.achievement_count,
        athleteCount: activity.athlete_count,
        averageSpeed: activity.average_speed,
        averageWatts: activity.average_watts,
        commentCount: activity.comment_count,
        commute: activity.commute,
        deviceWatts: activity.device_watts,
        distance: activity.distance,
        elapsedTime: activity.elapsed_time,
        elevationHigh: activity.elev_high,
        elevationLow: activity.elev_low,
        flagged: activity.flagged,
        gearId: activity.gear_id,
        hasKudoed: activity.has_kudoed,
        hideFromHome: activity.hide_from_home,
        kilojoules: activity.kilojoules,
        kudosCount: activity.kudos_count,
        manual: activity.manual,
        maxSpeed: activity.max_speed,
        maxWatts: activity.max_watts,
        movingTime: activity.moving_time,
        name: activity.name,
        photoCount: activity.photo_count,
        private: activity.private,
        sportType: activity.sport_type,
        startDate: new Date(activity.start_date),
        startDateLocal: new Date(activity.start_date_local),
        timezone: activity.timezone,
        totalElevationGain: activity.total_elevation_gain,
        totalPhotoCount: activity.total_photo_count,
        trainer: activity.trainer,
        type: activity.type,
        uploadId: activity.upload_id.toString(),
        weightedAverageWatts: activity.weighted_average_watts,
        workoutType: activity.workout_type,

        // If map data exists, update the polyline
        summaryPolyline: activity.map?.summary_polyline ?
          polyline.toGeoJSON(activity.map.summary_polyline) :
          undefined,
      },
    });

    sessionLogger.info(`Activity ${activity.name} upserted successfully`);
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function enrichUserActivity(session: Session, activity: DetailedActivity) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Enriching activity ${activity.name}`);

  try {
    await prisma.userActivity.update({
      where: {
        id_userId: {
          id: activity.id.toString(),
          userId: session.user.id
        }
      },
      data: {
        // Add detailed-only fields
        description: activity.description,
        deviceName: activity.device_name,
        embedToken: activity.embed_token,
        calories: activity.calories,

        // Add detailed map data if available
        polyline: activity.map?.polyline ?
          polyline.toGeoJSON(activity.map.polyline) :
          undefined,

        // Add splits data
        splitsMetric: activity.splits_metric as Prisma.InputJsonValue,
        splitsStandard: activity.splits_standard as Prisma.InputJsonValue,

        // Add photos data if available
        photos: activity.photos as Prisma.InputJsonValue,

        // Add laps data
        laps: activity.laps as Prisma.InputJsonValue,
      }
    });

    sessionLogger.info(`Activity ${activity.name} enriched successfully`);
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function queryUserActivities(session: Session): Promise<UserActivity[]> {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info("Querying user activities for user", { userId: session.user.id });
    const activities = await prisma.userActivity.findMany({
      where: {
        userId: session.user.id,
        summaryPolyline: {
          not: Prisma.JsonNullValueFilter.JsonNull
        }
      },
      orderBy: {
        startDateLocal: "desc"
      }
    });
    sessionLogger.info(`Found ${activities.length} activities`);
    return activities;
  } catch (error) {
    throw error;
  }
}

