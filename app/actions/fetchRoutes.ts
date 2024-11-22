"use server";

import { auth } from "@/auth";
import { queryRouteCountsByType, queryRoutes } from "@/lib/db";
import type { Route } from "@prisma/client";

export async function fetchRoutes(
  type = "all",
  page = 1,
  perPage = 24
): Promise<{ routes: Route[], routeCountsTotal: number, routeCountsByType: Record<string, number> }> {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  const routes = await queryRoutes(session.user.id, page, perPage, type === "all" ? undefined : type);
  const routeCountsByType = await queryRouteCountsByType(session.user.id);
  const routeCountsTotal = Object.values(routeCountsByType).reduce((acc, count) => acc + count, 0);

  return {
    routes,
    routeCountsByType,
    routeCountsTotal,
  };
}