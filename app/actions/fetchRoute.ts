"use server";

import { auth } from "@/auth";
import { queryRoute } from "@/lib/db";
import { enrichRoute } from "@/lib/db/routes";
import { fetchRouteGeoJson } from "@/lib/strava";
import type { EnrichedRoute, Route } from "@prisma/client";

export async function fetchRoute(routeId: string): Promise<EnrichedRoute>  {
  const session = await auth();

  if (!session) {
    throw new Error("Not authenticated");
  }

  const route = await queryRoute(session.user.id, routeId);

  if (!route) {
    throw new Error("Route not found");
  }

  if (!route.polyline) {
    const routeGeoJson = await fetchRouteGeoJson(session.user.id, routeId);
    return await enrichRoute(session.user.id, route.id, routeGeoJson) as EnrichedRoute;
  }

  return route as EnrichedRoute;
}
