"use server";

import { createSessionLogger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { fetchRouteGeoJson } from '@/lib/strava';
import polyline from '@mapbox/polyline';
import { Strava } from "@/schemas/routes";
import type { StravaRoute } from "@prisma/client";
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

export async function queryUserRoutes(session: Session): Promise<StravaRoute[]> {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user routes for user', { userId: session.user.id });
    const routes = await prisma.stravaRoute.findMany({
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

export async function queryRoute(session: Session, routeId: string): Promise<StravaRoute | null> {
  if (!session) {
    throw new Error('Session is required to query route');
  }
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user route');
    const route = await prisma.stravaRoute.findUnique({
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

export async function upsertRoute(session: Session, route: Strava.Route) {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Upserting route', {
      routeId: route.id_str,
      routeName: route.name
    });

    const routePolyline = await fetchRouteGeoJson(session, route.id_str);
    const routeSummaryPolyline = polyline.toGeoJSON(route["map"].summary_polyline);

    await prisma.stravaRoute.upsert({
      where: {
        id: route.id_str
      },
      create: {
        id: route.id_str,
        userId: session.user.id,
        createdAt: new Date(route.created_at),
        name: route.name,
        elevationGain: route.elevation_gain,
        description: route.description,
        distance: route.distance,
        starred: Boolean(route.starred),
        polyline: routePolyline,
        summaryPolyline: routeSummaryPolyline,
        type: route.type,
      },
      update: {
        name: route.name,
        elevationGain: route.elevation_gain,
        description: route.description,
        distance: route.distance,
        starred: Boolean(route.starred),
        polyline: routePolyline,
        summaryPolyline: routeSummaryPolyline,
        type: route.type,
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