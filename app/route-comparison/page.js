import { auth } from "@/auth";
import RouteComparisonClient from "./client";
import { queryUserRoutes } from "@/lib/db";
import { fetchRouteGeoJson } from "@/lib/strava";

export default async function RouteComparisonPage() {
  const session = await auth();
  const routes = await queryUserRoutes(session);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <RouteComparisonClient routes={routes} routeFetcher={fetchRouteGeoJson} />
    </div>
  );
}