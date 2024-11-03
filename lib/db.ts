"use server";

import { createSessionLogger } from '@/lib/logger';
import prisma from '@/lib/prisma';
import { fetchRouteGeoJson } from '@/lib/strava';
import polyline from '@mapbox/polyline';
import { Strava } from "./routes";
import type { StravaRoute } from "@prisma/client";


export async function queryUserAccount(session: Session, accountProvider: string) {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user account', { provider: accountProvider });
    const account = await prisma.account.findUnique({
      where: {
        userId_provider: {
          userId: session.userId,
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
    sessionLogger.error('Error querying user account', {
      error: error.message,
      provider: accountProvider
    });
    throw error;
  }
}

export async function queryUserRoutes(session: Session): Promise<StravaRoute[]> {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user routes for user', { userId: session.userId });
    const routes = await prisma.stravaRoute.findMany({
      where: {
        userId: session.userId
      },
    });
    sessionLogger.info('Found routes', { count: routes.length });
    return routes;
  } catch (error) {
    sessionLogger.error('Error querying user routes', {
      error: error.message
    });
    throw error;
  }
}

export async function queryRoute(session: Session, routeId: string): Promise<StravaRoute | null> {
  const sessionLogger = createSessionLogger(session);
  try {
    sessionLogger.info('Querying user route');
    const route = await prisma.stravaRoute.findUnique({
      where: {
        id_userId: {
          id: routeId,
          userId: session.userId
        }
      }
    });
    sessionLogger.info('Found route', { routeId });
    return route;
  } catch (error) {
    sessionLogger.error('Error querying user route', {
      error: error.message,
      routeId
    });
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
        userId: session.userId,
        createdAt: new Date(route.created_at),
        name: route.name,
        elevationGain: parseFloat(route.elevation_gain),
        description: route.description,
        distance: parseFloat(route.distance),
        starred: Boolean(route.starred),
        polyline: routePolyline,
        summaryPolyline: routeSummaryPolyline,
        type: route.type,
      },
      update: {
        name: route.name,
        elevationGain: parseFloat(route.elevation_gain),
        description: route.description,
        distance: parseFloat(route.distance),
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
    sessionLogger.error('Error upserting Strava route', {
      error: error.message,
      routeId: route.id_str,
      routeName: route.name
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}