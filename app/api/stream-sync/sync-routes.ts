
import { enrichUserRoute, upsertUserRoute } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { fetchRouteGeoJson, fetchRoutes } from "@/lib/strava-api";
import { Route } from "@/lib/strava/schemas/strava";
import { streamManager } from "./stream-utils";
import { retryWithBackoff } from "./retry-utils";

export async function syncRoutes(
  userId: string,
  searchParams: URLSearchParams,
) {
  try {
    const perPage = parseInt(searchParams.get("per_page") || "1000");
    const page = parseInt(searchParams.get("page") || "1");

    const routes = await retryWithBackoff(async () => {
      return fetchRoutes(userId, perPage, page)
    });

    if (!routes || routes.length === 0) {
      await streamManager.send({ type: "complete" });
      return;
    }

    baseLogger.info(`Found ${routes.length} routes from Strava`);
    await streamManager.send({
      type: "update_total",
      message: `Found ${routes.length} activities from Strava...`,
      n: routes.length,
    });

    const filteredRoutes = routes.filter(async (route: Route) => {
      const existingRoute = await upsertUserRoute(userId, route);
      if (existingRoute.polyline) {
        baseLogger.info(`Route ${route.name} already exists in detailed form, skipping...`);
        await streamManager.send({
          type: "update_current",
          message: `Found ${routes.length} activities from Strava, already synced ${route.name} `
        });
        return false;
      }
      return true;
    });

    baseLogger.info(`Syncing ${filteredRoutes.length} new routes`);
    await streamManager.send({
      type: "update_total",
      message: `Syncing ${filteredRoutes.length} activities from Strava...`,
      n: routes.length
    });

    for (const route of filteredRoutes) {
      try {
        await streamManager.send({
          type: "update_current",
          message: `Syncing route ${route.name}...`
        });

        await retryWithBackoff(async () => {
          const geoJson = await fetchRouteGeoJson(userId, route.id_str);
          await enrichUserRoute(userId, route.id_str, geoJson);
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await streamManager.send({
          type: "update_failed",
          name: route.name,
          error: `Failed to sync route ${route.name}: ${errorMessage}`,
        });
      }
    }
    await streamManager.send({ type: "complete" });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    baseLogger.error(`Sync failed: ${errorMessage}`);
    throw error;
  }
}