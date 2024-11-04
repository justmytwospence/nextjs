"use server";

import { createSessionLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import polyline from '@mapbox/polyline';
import type { AthleteRoute, AthleteRouteSegment, AthleteSegment } from "@/schemas/strava";
import type { UserRoute } from "@prisma/client";
import type { Session } from "next-auth";


export async function queryUserAccount(session: Session, accountProvider: string) {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user account', { provider: accountProvider });
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

export async function queryUserRoutes(session: Session): Promise<AthleteRoute[]> {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user routes for user', { userId: session.user.id });
    const routes = await prisma.userRoute.findMany({
      where: {
        userId: session.user.id
      },
    });
    sessionLogger.info('Found routes', { count: routes.length });
    return routes;
  } catch (error) {
    throw error;
  }
}

export async function queryUserRoute(session: Session, routeId: string): Promise<AthleteRoute | null> {
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
    sessionLogger.info('Found route', { routeId });
    return route;
  } catch (error) {
    throw error;
  }
}

export async function upsertUserRoute(session: Session, route: AthleteRoute) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info('Upserting route', {
    routeId: route.id_str,
    routeName: route.name
  });

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
        summaryPolyline: route.map.summary_polyline,
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
        summaryPolyline: route.map.summary_polyline,
        timestamp: new Date(route.timestamp),
        type: route.type,
        updatedAt: new Date(route.updated_at),
        userId: session.user.id,
      },
    });

    sessionLogger.info('Route upserted successfully', {
      routeId: route.id_str,
      routeName: route.name
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function enrichUserRoute(session: Session, routeId: number, route: JSON) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info('Enriching route', {
    routeId: routeId,
    routeName: route.name
  });

  await prisma.userRoute.update({
    where: {
      id: routeId,
      userId: session.user.id
    },
    data: {
      polyline: route,
    }
  });
}

export async function createUserSegment(session: Session, segment: AthleteRouteSegment) {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Creating segment', {
      segmentId: segment.id,
      segmentName: segment.name
    });

    await prisma.userSegment.create({
      data: {
        activityType: segment.activity_type,
        averageGrade: segment.average_grade,
        city: segment.city,
        climbCategory: segment.climb_category,
        country: segment.country,
        distance: segment.distance,
        efforttCount: segment.athlete_pr_effort.effort_count,
        elevationHigh: segment.elevation_high,
        elevationLow: segment.elevation_low,
        endLat: segment.end_latlng[0],
        endLng: segment.end_latlng[1],
        id: segment.id,
        maximumGrade: segment.maximum_grade,
        name: segment.name,
        prActivityId: segment.athlete_pr_effort.pr_activity_id,
        prDate: segment.athlete_pr_effort.pr_date,
        prElapsedTime: segment.athlete_pr_effort.pr_elapsed_time,
        private: segment.private,
        startLat: segment.start_latlng[0],
        startLng: segment.start_latlng[1],
        state: segment.state,
        userId: session.user.id,
      }
    });

    sessionLogger.info('Segment created successfully', {
      segmentId: segment.id,
      segmentName: segment.name
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function enrichUserSegment(session: Session, segment: AthleteSegment) {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info('Enriching segment', {
    segmentId: segment.id,
    segmentName: segment.name
  });

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
        effortCount: segment.athlete_segment_stats.effort_count,
        elevationHigh: segment.elevation_high,
        elevationLow: segment.elevation_low,
        endLat: segment.end_latlng[0],
        endLng: segment.end_latlng[1],
        hazardous: segment.hazardous,
        id: segment.id,
        mapResourceState: segment.map.resource_state,
        maximumGrade: segment.maximum_grade,
        name: segment.name,
        polyline: polyline.toGeoJSON(segment.map.polyline),
        prDate: segment.athlete_segment_stats.pr_date,
        prElapsedTime: segment.athlete_segment_stats.pr_elapsed_time,
        private: segment.private,
        starCount: segment.star_count,
        starred: segment.starred,
        startLat: segment.start_latlng[0],
        startLng: segment.start_latlng[1],
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
        effortCount: segment.athlete_segment_stats.effort_count,
        elevationHigh: segment.elevation_high,
        elevationLow: segment.elevation_low,
        endLat: segment.end_latlng[0],
        endLng: segment.end_latlng[1],
        hazardous: segment.hazardous,
        id: segment.id,
        mapResourceState: segment.map.resource_state,
        maximumGrade: segment.maximum_grade,
        name: segment.name,
        polyline: polyline.toGeoJSON(segment.map.polyline),
        prDate: segment.athlete_segment_stats.pr_date,
        prElapsedTime: segment.athlete_segment_stats.pr_elapsed_time,
        private: segment.private,
        starCount: segment.star_count,
        starred: segment.starred,
        startLat: segment.start_latlng[0],
        startLng: segment.start_latlng[1],
        state: segment.state,
        totalElevationGain: segment.total_elevation_gain,
        updatedAt: new Date(segment.updated_at),
        userId: session.user.id,
      }
    });

    sessionLogger.info('Segment enriched successfully', {
      segmentId: segment.id,
      segmentName: segment.name
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }

}