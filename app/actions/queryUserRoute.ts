"use server";

import { auth } from "@/auth";
import { queryUserRoute } from "@/lib/db";

export async function queryUserRouteAction(routeId: string) {
  const session = await auth();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return queryUserRoute(session, routeId);
}