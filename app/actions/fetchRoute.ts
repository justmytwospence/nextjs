"use server";

import { auth } from "@/auth";
import { queryRoute } from "@/lib/db";
import { enrichRoute } from "@/lib/db/routes";
import { fetchRouteGeoJson } from "@/lib/strava";
import { isEnrichedRoute, toCourse } from "@/types/transformers";
import type { EnrichedRoute } from "@prisma/client";

export async function fetchRoute(routeId: string): Promise<EnrichedRoute>  {
  const session = await auth();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const route = await queryRoute(session.user.id, routeId);

  if (!route) {
    throw new Error("Route not found");
  }

  if (!isEnrichedRoute(route) || route.enrichedAt < route.updatedAt) {
    const routeGeoJson = await fetchRouteGeoJson(session.user.id, routeId);
    const enrichedRoute =  await enrichRoute(session.user.id, route.id, routeGeoJson);
    return enrichedRoute
  }

  return route
}
