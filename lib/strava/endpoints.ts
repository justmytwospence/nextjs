import type {
  DetailedActivity,
  DetailedSegment,
  Route,
  StreamSet,
  SummaryActivity,
} from "@/lib/strava/schemas/strava";
import {
  DetailedActivitySchema,
  DetailedSegmentSchema,
  RoutesSchema,
  StreamSetSchema,
  SummaryActivitiesSchema,
} from "@/lib/strava/schemas/strava";
import tj from "@mapbox/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import type { LineString } from "geojson";
import { baseLogger } from "../logger";
import { makeStravaRequest } from "./api";
import { validateAndLogExtras } from "./schema";

export const fetchRoutes = async (
  userId: string,
  page = 1,
  perPage = 200
): Promise<{ routes: Route[]; unrecognizedKeys: Set<string> }> => {
  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString(),
  });
  const response = await makeStravaRequest(userId, "/athlete/routes", params);
  const responseData = await response.json();
  const { validatedData: routes, unrecognizedKeys } = validateAndLogExtras(
    responseData,
    RoutesSchema
  );
  return { routes, unrecognizedKeys };
};

export const fetchDetailedSegment = async (
  userId: string,
  segmentId: string
): Promise<{
  detailedSegment: DetailedSegment;
  unrecognizedKeys: Set<string>;
}> => {
  const response = await makeStravaRequest(userId, `/segments/${segmentId}`);
  const responseData = await response.json();
  const { validatedData: detailedSegment, unrecognizedKeys } =
    validateAndLogExtras(responseData, DetailedSegmentSchema);
  return { detailedSegment, unrecognizedKeys };
};

export const fetchRouteGeoJson = async (
  userId: string,
  routeId: string
): Promise<LineString> => {
  const response = await makeStravaRequest(
    userId,
    `/routes/${routeId}/export_gpx`
  );
  const gpxData = await response.text();
  const gpxParser = new DOMParser();
  const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
  const geoJson = tj.gpx(gpxDoc, { styles: false });
  const geometry = geoJson.features[0]?.geometry;
  if (!geometry) {
    throw new Error("Failed to parse GeoJSON geometry.");
  }
  return geometry as LineString;
};

export const fetchActivities = async (
  userId: string,
  page = 1,
  perPage = 200
): Promise<{
  summaryActivities: SummaryActivity[];
  unrecognizedKeys: Set<string>;
}> => {
  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString(),
  });
  const response = await makeStravaRequest(
    userId,
    "/athlete/activities",
    params
  );
  const responseData = await response.json();
  const { validatedData: summaryActivities, unrecognizedKeys } =
    validateAndLogExtras(responseData, SummaryActivitiesSchema);
  return { summaryActivities, unrecognizedKeys };
};

export const fetchDetailedActivity = async (
  userId: string,
  activityId: string
): Promise<{
  detailedActivity: DetailedActivity;
  unrecognizedKeys: Set<string>;
}> => {
  const response = await makeStravaRequest(userId, `/activities/${activityId}`);
  const responseData = await response.json();
  const { validatedData: detailedActivity, unrecognizedKeys } =
    validateAndLogExtras(responseData, DetailedActivitySchema);
  return { detailedActivity, unrecognizedKeys };
};

export const fetchActivityStreams = async (
  userId: string,
  activityId: string
): Promise<{
  activityStreams: StreamSet;
  unrecognizedKeys: Set<string>;
}> => {
  const streamTypes = [
    "altitude",
    "cadence",
    "distance",
    "grade_smooth",
    "heartrate",
    "latlng",
    "moving",
    "temp",
    "time",
    "velocity_smooth",
    "watts",
  ];
  const params = new URLSearchParams({
    keys: streamTypes.join(","),
    key_by_type: "true",
  });
  const response = await makeStravaRequest(
    userId,
    `/activities/${activityId}/streams`,
    params
  );
  const responseData = await response.json();
  baseLogger.debug("Activity streams response", responseData);
  const { validatedData: activityStreams, unrecognizedKeys } = validateAndLogExtras(responseData, StreamSetSchema);
  return { activityStreams, unrecognizedKeys };
};

export const fetchRouteStreams = async (
  userId: string,
  routeId: string
): Promise<{
  routeStreams: StreamSet;
  unrecognizedKeys: Set<string>;
}> => {
  const response = await makeStravaRequest(
    userId,
    `/routes/${routeId}/streams`
  );
  const responseData = await response.json();
  baseLogger.debug("Activity streams response", responseData);
  const { validatedData: routeStreams, unrecognizedKeys } =
    validateAndLogExtras(responseData, StreamSetSchema);
  return { routeStreams, unrecognizedKeys };
};

export const fetchSegmentStreams = async (
  userId: string,
  segmentId: string
): Promise<{
  segmentStreams: StreamSet;
  unrecognizedKeys: Set<string>;
}> => {
  const streamTypes = [
    "altitude",
    "cadence",
    "distance",
    "grade_smooth",
    "heartrate",
    "latlng",
    "moving",
    "temp",
    "time",
    "velocity_smooth",
    "watts",
  ];
  const params = new URLSearchParams({
    keys: streamTypes.join(","),
    key_by_type: "true",
  });
  const response = await makeStravaRequest(
    userId,
    `/segments/${segmentId}/streams`,
    params
  );
  const responseData = await response.json();
  baseLogger.debug("Segment streams response", responseData);
  const { validatedData: segmentStreams, unrecognizedKeys } =
    validateAndLogExtras(responseData, StreamSetSchema);
  return { segmentStreams, unrecognizedKeys };
};
