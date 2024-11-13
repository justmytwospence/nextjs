import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { convertKeysToCamelCase } from "@/lib/utils";
import type { Route } from "@/lib/strava/schemas/strava";
import type { UserRoute, Mappable } from "@prisma/client";
import { Prisma } from "@prisma/client";

export async function queryUserRoutes(userId: string): Promise<UserRoute[]> {
  try {
    baseLogger.info(`Querying user routes for user ${userId}`);
    const routes = await prisma.userRoute.findMany({
      where: {
        userId,
        summaryPolyline: {
          not: Prisma.JsonNullValueFilter.JsonNull,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    baseLogger.info(`Found ${routes.length} routes`);
    return routes;
  } catch (error) {
    throw error;
  }
}

export async function queryMappables(userId: string): Promise<Mappable[]> {
  try {
    baseLogger.info(`Querying mappables for user ${userId}`);
    const [routes, activities] = await Promise.all([
      prisma.userRoute.findMany({
        where: {
          userId,
          OR: [
            { summaryPolyline: { not: Prisma.JsonNullValueFilter.JsonNull } },
            { polyline: { not: Prisma.JsonNullValueFilter.JsonNull } },
          ],
        },
      }),
      prisma.activity.findMany({
        where: {
          userId,
          movingTime: {
            gt: 0,
          },
          OR: [
            { summaryPolyline: { not: Prisma.JsonNullValueFilter.JsonNull } },
            { polyline: { not: Prisma.JsonNullValueFilter.JsonNull } },
          ],
        },
      }),
    ]);
    const mappables = [
      ...routes.map((route) => ({ ...route, type: "route" })),
      ...activities.map((activity) => ({ ...activity, type: "activity" })),
    ];
    baseLogger.info(`Found ${mappables.length} mappables`);
    return mappables;
  } catch (error) {
    throw error;
  }
}

export async function queryUserRoute(
  userId: string,
  routeId: string
): Promise<UserRoute | null> {
  try {
    baseLogger.info(
      `Querying user route for user ${userId} and route ${routeId}`
    );
    const route = await prisma.userRoute.findUnique({
      where: {
        id_userId: {
          id: routeId,
          userId,
        },
      },
    });
    baseLogger.info(`Found route ${routeId} to be ${route?.name}`);
    return route;
  } catch (error) {
    throw error;
  }
}

export async function upsertUserRoute(
  userId: string,
  route: Route
): Promise<UserRoute> {
  baseLogger.info(`Upserting route ${route.name}`);

  const routeData = convertKeysToCamelCase<Route>(route);

  const { id, idStr, map, segments, ...inputData } = routeData;

  try {
    const route = await prisma.userRoute.upsert({
      where: {
        id: idStr,
      },
      create: {
        ...inputData,
        id: idStr,
        polyline:
          (map.polyline as unknown as Prisma.InputJsonValue) || undefined,
        summaryPolyline:
          map.summaryPolyline as unknown as Prisma.InputJsonValue,
        userId: userId,
      },
      update: {
        ...inputData,
        id: idStr,
        polyline:
          (map.polyline as unknown as Prisma.InputJsonValue) || undefined,
        summaryPolyline:
          map.summaryPolyline as unknown as Prisma.InputJsonValue,
        userId: userId,
      },
    });

    baseLogger.info(`Route ${route.name} upserted successfully`);
    return route;
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

export async function enrichUserRoute(
  userId: string,
  routeId: string,
  route: JSON
): Promise<UserRoute> {
  baseLogger.info(`Enriching route ${routeId}`);

  try {
    return await prisma.userRoute.update({
      where: {
        id: routeId,
        userId,
      },
      data: {
        polyline: route as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
