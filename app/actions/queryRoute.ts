"use server";

import { auth } from '@/auth';
import { queryRoute } from '@/lib/db';

export async function queryRouteAction(routeId: string) {
  const session = await auth();
  if (!session) { 
    throw new Error('Not authenticated');
  }
  return queryRoute(session, routeId);
}