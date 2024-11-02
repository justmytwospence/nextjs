"use server";

import prisma from '@/lib/prisma';
import { fetchRouteGeoJson } from '@/lib/strava';
import polyline from '@mapbox/polyline';

export async function queryUserAccount(session, accountProvider) {
  try {
    const account = await prisma.account.findUnique({
      where: {
        userId_provider: {
          userId: session.userId,
          provider: accountProvider,
        }
      },
    });

    if (!account) {
      throw new Error(`No ${accountProvider} account found for this user ${session.userId}`);
    }

    return account;
  } catch (error) {
    console.error("Error querying user account:", error);
    throw error;
  }
}

export async function queryUserRoutes(session) {
  try {
    const stravaRoutes = await prisma.stravaRoute.findMany({
      where: {
        userId: session.userId
      },
    });
    return stravaRoutes;
  } catch (error) {
    console.error("Error querying user routes:", error);
    throw error;
  }
}

export async function upsertRoute(session, route) {
  try {
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
  } catch (error) {
    console.error("Error upserting Strava routes:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}