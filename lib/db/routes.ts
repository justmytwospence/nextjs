import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type { Route } from "@/lib/strava/schemas"
import { convertKeysToCamelCase } from "@/lib/utils";
import type { Route as DbRoute, EnrichedRoute } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { LineString } from "geojson";

export async function queryRoutes(
	userId: string,
	page = 1,
	pageSize = 24,
	type?: string,
): Promise<DbRoute[]> {
		baseLogger.info(
			`Querying user routes for user ${userId}, page ${page}, pageSize ${pageSize}, type ${type}`,
		);
		const routes = await prisma.route.findMany({
			where: {
				userId,
				...(type && { type: Number.parseInt(type) }),
			},
			orderBy: {
				createdAt: "desc",
			},
			skip: (page - 1) * pageSize,
			take: pageSize,
		});
		baseLogger.info(`Found ${routes.length} routes`);
		return routes;
}

export async function queryRoute(
	userId: string,
	routeId: string,
): Promise<DbRoute | null> {
		baseLogger.info(
			`Querying user route for user ${userId} and route ${routeId}`,
		);
		const route = await prisma.route.findUnique({
			where: {
				id_userId: {
					id: routeId,
					userId,
				},
			},
		});
		baseLogger.info(`Found route ${routeId} to be ${route?.name}`);
		return route;
}

export async function upsertRoute(
	userId: string,
	route: Route,
): Promise<DbRoute> {
	baseLogger.info(`Upserting route ${route.name}`);

	const routeData = convertKeysToCamelCase<Route>(route);

	const { id, idStr, map, segments, ...inputData } = routeData;

	if (!map.summaryPolyline) {
		throw new Error("Route must have a summary polyline");
	}

	try {
		const route = await prisma.route.upsert({
			where: {
				id: idStr,
			},
			create: {
				...inputData,
				id: idStr,
				polyline: map.polyline ?? undefined,
				summaryPolyline: map.summaryPolyline,
				userId: userId,
			},
			update: {
				...inputData,
				id: idStr,
				polyline: map.polyline ?? undefined,
				summaryPolyline: map.summaryPolyline ?? undefined,
				userId: userId,
			},
		});

		baseLogger.info(`Route ${route.name} upserted successfully`);
		return route;
	} finally {
		await prisma.$disconnect();
	}
}

export async function enrichRoute(
	userId: string,
	routeId: string,
	routeJson: LineString,
): Promise<EnrichedRoute> {
	baseLogger.info(`Enriching route ${routeId}`);

	try {
		if (!routeJson) {
			throw new Error("Route JSON must not be null");
		}

		const enrichedRoute = await prisma.route.update({
			where: {
				id_userId: {
					id: routeId,
					userId,
				},
			},
			data: {
				polyline: routeJson ?? undefined,
			},
		});
		return enrichedRoute as EnrichedRoute;
	} finally {
		await prisma.$disconnect();
	}
}

export async function queryRouteCountsByType(
	userId: string,
): Promise<Record<string, number>> {
	const routeCountsByType = await prisma.route.groupBy({
		by: ["type"],
		where: { userId },
		_count: true,
	});

	return routeCountsByType.reduce(
		(acc, curr) => {
			if (curr.type !== null) {
				acc[curr.type] = curr._count;
			}
			return acc;
		},
		{} as Record<string, number>,
	);
}
