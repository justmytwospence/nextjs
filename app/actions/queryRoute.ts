"use server";

import { auth } from '@/auth';
import { queryRoute } from '@/lib/db';

export async function queryRouteAction(routeId: string) {
  const session = await auth();
  console.log("action", session, routeId);
  return queryRoute(session, routeId);
}