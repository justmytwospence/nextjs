"use server";

import { createSessionLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import polyline from '@mapbox/polyline';
import type { Route, DetailedSegment, SummarySegment } from "@/schemas/strava";
import type { UserRoute, Account, Prisma } from "@prisma/client";
import type { Session } from "next-auth";


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
      sessionLogger.warn('No account found', { provider: accountProvider });
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
    sessionLogger.info('Querying user routes for user', { userId: session.user.id });
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
    throw new Error('Session is required to query route');
  }
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user route');
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

export async function createUserSegment(session: Session, segment: SummarySegment) {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info(`Creating segment ${segment.name}`);

    await prisma.userSegment.create({
      data: {
        activityType: segment.activity_type,
        averageGrade: segment.average_grade,
        city: segment.city,
        climbCategory: segment.climb_category,
        country: segment.country,
        distance: segment.distance,
        elevationHigh: segment.elevation_high,
        elevationLow: segment.elevation_low,
        id: segment.id,
        maximumGrade: segment.maximum_grade,
        name: segment.name,
        private: segment.private,
        state: segment.state,

        userId: session.user.id,
      }
    });
    sessionLogger.info(`Segment ${segment.name} created successfully`);
  } catch (error) {
    sessionLogger.error(`Failed to create segment ${segment.name}`);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function enrichUserSegment(session: Session, segment: DetailedSegment) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Enriching segment ${segment.name}`);

  try {
    await prisma.userSegment.upsert({
      where: {
        id: segment.id,
        userId: session.user.id
      },
      create: {
        activityType: segment.activity_type,
        athleteCount: segment.athlete_count,
        averageGrade: segment.average_grade,
        city: segment.city,
        climbCategory: segment.climb_category,
        country: segment.country,
        createdAt: new Date(segment.created_at),
        distance: segment.distance,
        effortCount: segment.effort_count,
        elevationHigh: segment.elevation_high,
        elevationLow: segment.elevation_low,
        hazardous: segment.hazardous,
        id: segment.id,
        maximumGrade: segment.maximum_grade,
        name: segment.name,
        polyline: polyline.toGeoJSON(segment.map.polyline),
        private: segment.private,
        starCount: segment.star_count,
        state: segment.state,
        totalElevationGain: segment.total_elevation_gain,
        updatedAt: new Date(segment.updated_at),
        userId: session.user.id,
      },
      update: {
        activityType: segment.activity_type,
        athleteCount: segment.athlete_count,
        averageGrade: segment.average_grade,
        city: segment.city,
        climbCategory: segment.climb_category,
        country: segment.country,
        createdAt: new Date(segment.created_at),
        distance: segment.distance,
        effortCount: segment.effort_count,
        elevationHigh: segment.elevation_high,
        elevationLow: segment.elevation_low,
        hazardous: segment.hazardous,
        id: segment.id,
        maximumGrade: segment.maximum_grade,
        name: segment.name,
        polyline: polyline.toGeoJSON(segment.map.polyline),
        private: segment.private,
        starCount: segment.star_count,
        state: segment.state,
        totalElevationGain: segment.total_elevation_gain,
        updatedAt: new Date(segment.updated_at),
        userId: session.user.id,
      }
    });

    sessionLogger.info(`Segment ${segment.name} enriched successfully`);
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }

}