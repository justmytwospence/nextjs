import { removeStaticPoints } from "@/lib/geo";
import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type {
	DetailedActivity,
	StreamSet,
	SummaryActivity
} from "@/lib/strava/schemas/strava";
import { convertKeysToCamelCase } from "@/lib/utils";
import { isEnrichedActivity, isMappableActivity } from "@/types/transformers";
import type { Activity, EnrichedActivity, MappableActivity } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { LineString } from "geojson";

export async function deleteActivity(
	userId: string,
	activityId: string,
): Promise<void> {
	baseLogger.info(`Deleting activity ${activityId}`);
	await prisma.activity.delete({
		where: {
			id_userId: {
				id: activityId,
				userId,
			},
		},
	});
	baseLogger.info(`Deleted activity ${activityId}`);
}

export async function queryMappableActivities(
	userId: string,
	page?: number,
	pageSize = 24,
	sportType?: string,
): Promise<MappableActivity[]> {
	baseLogger.info(`Querying user activities for user ${userId}`);

	const skip = page ? (page - 1) * pageSize : 0;

	const activities = await prisma.activity.findMany({
		where: {
			userId,
			summaryPolyline: {
				not: Prisma.JsonNullValueFilter.JsonNull,
			},
			sportType: sportType ? { equals: sportType } : undefined,
		},
		orderBy: {
			startDateLocal: "desc",
		},
		skip,
		take: pageSize,
	});

	baseLogger.info(`Found ${activities.length} activities`);
	return activities as MappableActivity[];
}

export async function queryActivity(
	userId: string,
	activityId: string,
): Promise<Activity | null> {
	baseLogger.info(
		`Querying user route for user ${userId} and route ${activityId}`,
	);
	const activity = await prisma.activity.findUnique({
		where: {
			id_userId: {
				id: activityId,
				userId,
			},
		},
	});
	baseLogger.info(`Found route ${activityId} to be ${activity?.name}`);
	return activity;
}

export async function upsertSummaryActivity(
	userId: string,
	activity: SummaryActivity,
): Promise<Activity> {
	baseLogger.info(`Upserting activity ${activity.name}`);

	const activityData = convertKeysToCamelCase<SummaryActivity>(activity);

	const { map, ...inputData } = activityData;

	try {
		const activity = await prisma.activity.upsert({
			where: {
				id_userId: {
					id: inputData.id,
					userId,
				},
			},
			create: {
				...inputData,
				summaryPolyline: map.summaryPolyline ?? undefined,
				userId: userId,
				syncedAt: new Date(),
			},
			update: {
				...inputData,
				summaryPolyline: map.summaryPolyline ?? undefined,
				userId: userId,
				syncedAt: new Date(),
			},
		});

		baseLogger.info(`Summary activity ${activity.name} upserted successfully`);
		return activity;
	} catch (error) {
		baseLogger.error(`Failed to upsert activity ${activity.name}: ${error}`);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

export async function upsertDetailedActivity(
	userId: string,
	activity: DetailedActivity,
): Promise<Activity> {
	baseLogger.info(`Upserting activity ${activity.name}`);

	const activityData = convertKeysToCamelCase<DetailedActivity>(activity);

	const { map, bestEfforts, segmentEfforts, ...inputData } = activityData;

	try {
		const activity = await prisma.activity.upsert({
			where: {
				id_userId: {
					id: inputData.id,
					userId,
				},
			},
			create: {
				...inputData,
				polyline: map.polyline ?? undefined,
				summaryPolyline: map.summaryPolyline ?? undefined,
				userId: userId,
				syncedAt: new Date(),
			},
			update: {
				...inputData,
				polyline: map.polyline ?? undefined,
				summaryPolyline: map.summaryPolyline ?? undefined,
				userId: userId,
				syncedAt: new Date(),
			},
		});
		baseLogger.info(`Activity ${activity.name} upserted successfully`);
		return activity;
	} catch (error) {
		baseLogger.error(`Failed to upsert activity ${activity.name}: ${error}`);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}

export async function queryActivityCountsByType(
	userId: string,
	isMappable = false,
): Promise<Record<string, number>> {
	const activityCountsByType = await prisma.activity.groupBy({
		by: ["sportType"],
		where: { 
			userId, 
			summaryPolyline: isMappable ? { not: Prisma.JsonNullValueFilter.JsonNull } : undefined
		},
		_count: true,
	});

	return activityCountsByType.reduce(
		(acc, curr) => {
			if (curr.sportType !== null) {
				acc[curr.sportType] = curr._count;
			}
			return acc;
		},
		{} as Record<string, number>,
	);
}

export async function enrichActivity(
	activityId: string,
	activityStreams: StreamSet,
): Promise<EnrichedActivity> {
	baseLogger.info(`Enriching activity ${activityId}`);

	const latLngStream = activityStreams.latlng?.data ?? [];
	const altitudeStream = activityStreams.altitude?.data ?? [];

	if (latLngStream.length !== altitudeStream.length) {
		throw new Error("LatLng and altitude streams must be of the same length");
	}

	const coordinates = latLngStream.map((latLng, index) => {
		const altitude = altitudeStream[index];
		return [latLng[1], latLng[0], altitude];
	});
	
	const cleanedCoordinates = removeStaticPoints(coordinates, 1);

	const lineString: LineString = {
		type: "LineString",
		coordinates: cleanedCoordinates,
	};

	try {
		const activity = await prisma.activity.update({
			where: {
				id: activityId,
			},
			data: {
				polyline: lineString,
				enrichedAt: new Date(),
			},
		});
		return activity as EnrichedActivity;
	} catch (error) {
		baseLogger.error(`Failed to enrich activity ${activityId}: ${error}`);
		throw error;
	} finally {
		await prisma.$disconnect();
	}
}
