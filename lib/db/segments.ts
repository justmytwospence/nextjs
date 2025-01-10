import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import type {
  DetailedSegment,
  DetailedSegmentEffort,
  StreamSet,
} from "@/lib/strava/schemas/strava";
import type {
  EnrichedSegment,
  Prisma,
  Segment,
  SegmentEffort,
} from "@prisma/client";
import type { LineString } from "geojson";
import { removeStaticPoints } from "../geo/geo";
import { convertKeysToCamelCase } from "../utils";

export async function querySegment(segmentId: string): Promise<Segment | null> {
  baseLogger.debug(`Querying segment ${segmentId}`);

  return await prisma.segment
    .findUnique({
      where: {
        id: segmentId,
      },
    })
}

export async function querySegments(
  userId: string,
  activityType?: string,
  page = 1,
  pageSize = 24,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "asc"
): Promise<Segment[]> {
  baseLogger.debug(`Querying segments for user ${userId}`);

  const skip = (page - 1) * pageSize;

  return await prisma.segment
    .findMany({
      where: {
        userId,
        activityType: activityType ? { equals: activityType } : undefined,
      },
      orderBy: sortBy
        ? {
            [sortBy]: sortOrder,
          }
        : { name: "asc" },
      skip,
      take: pageSize,
    })
}

export async function querySegmentCountsByType(
  userId: string
): Promise<Record<string, number>> {
  const segmentCountsByType = await prisma.segment
    .groupBy({
      by: ["activityType"],
      where: {
        userId,
      },
      _count: true,
    })

  return segmentCountsByType.reduce((acc, curr) => {
    if (curr.activityType !== null) {
      acc[curr.activityType] = curr._count;
    }
    return acc;
  }, {} as Record<string, number>);
}

export async function upsertSegmentEffort(
  segmentEffort: DetailedSegmentEffort,
  userId: string
): Promise<SegmentEffort | null> {
  baseLogger.debug(`Upserting segment effort ${segmentEffort.name}`);

  const {
    athlete,
    segment,
    activity,
    activityId, // use activity.id instead
    ...segmentEffortData
  } = convertKeysToCamelCase(segmentEffort);

  if (!segment) {
    baseLogger.error(
      `Segment effort ${segmentEffort.name} does not have a segment`
    );
    return null;
  }

  const { athleteSegmentStats, ...segmentData } =
    convertKeysToCamelCase(segment);

  const segmentEffortInput:
    | Prisma.SegmentEffortCreateInput
    | Prisma.SegmentEffortUpdateInput = {
    ...segmentEffortData,
    activity: {
      connect: {
        id: activity.id,
      },
    },
    user: {
      connect: {
        id: userId,
      },
    },
    segment: {
      connectOrCreate: {
        where: {
          id_userId: {
            id: segmentData.id,
            userId,
          },
        },
        create: {
          ...segmentData,
          userId,
        },
      },
    },
  };

  return await prisma.segmentEffort
    .upsert({
      where: {
        id: segmentEffortData.id,
      },
      create: segmentEffortInput as Prisma.SegmentEffortCreateInput,
      update: segmentEffortInput as Prisma.SegmentEffortUpdateInput,
    })
}

export async function enrichSegment(
  userId: string,
  segmentId: string,
  detailedSegment: DetailedSegment,
  segmentSteams: StreamSet
): Promise<EnrichedSegment> {
  baseLogger.debug(`Enriching segment ${segmentId}`);

  const { athleteSegmentStats, map, ...segmentData } =
    convertKeysToCamelCase(detailedSegment);

  const latLngStream = segmentSteams.latlng?.data ?? [];
  const altitudeStream = segmentSteams.altitude?.data ?? [];

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

   return await prisma.segment.upsert({
    where: {
      id: segmentId,
    },
    create: {
      ...segmentData,
      polyline: lineString ?? map.polyline ?? undefined,
      userId,
    },
    update: {
      ...segmentData,
      polyline: lineString ?? map.polyline ?? undefined,
      userId,
    },
  }) as EnrichedSegment;
}
