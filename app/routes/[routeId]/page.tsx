import { fetchRoute } from "@/app/actions/fetchRoute";
import { auth } from "@/auth";
import { enrichRoute, queryRoute } from "@/lib/db";
import { fetchRouteGeoJson } from "@/lib/strava";
import { notFound } from "next/navigation";
import RouteDetail from "./client";

export default async function RoutePage({ params }) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { routeId } = await params;

  const route = await fetchRoute(routeId);

  if (!route) {
    notFound();
  }

  return <RouteDetail route={route} />;
}
