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
  perPage = 200,
): Promise<Route[]> => {
  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString(),
  });
  const response = await makeStravaRequest(userId, "/athlete/routes", params);
  const responseData = await response.json();
  return validateAndLogExtras(responseData, RoutesSchema);
};

export const fetchDetailedSegment = async (
  userId: string,
  segmentId: string
): Promise<DetailedSegment> => {
  const response = await makeStravaRequest(userId, `/segments/${segmentId}`);
  const responseData = await response.json();
  const segment = validateAndLogExtras(responseData, DetailedSegmentSchema);
  return segment;
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
  perPage = 200,
): Promise<SummaryActivity[]> => {
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
  return validateAndLogExtras(responseData, SummaryActivitiesSchema);
};

export const fetchDetailedActivity = async (
  userId: string,
  activityId: string
): Promise<DetailedActivity> => {
  const response = await makeStravaRequest(
    userId,
    `/activities/${activityId}`
  );
  const responseData = await response.json();
  return validateAndLogExtras(responseData, DetailedActivitySchema);
};

export const fetchActivityStreams = async (
  userId: string,
  activityId: string
): Promise<StreamSet> => {
  const types = [
    "distance", "latlng", "altitude"
  ];
  const params = new URLSearchParams({
    keys: types.join(","),
    key_by_type: "true",
  });
  const response = await makeStravaRequest(
    userId,
    `/activities/${activityId}/streams`,
    params
  );
  const responseData = await response.json();
  baseLogger.debug("Activity streams response", responseData);
  return validateAndLogExtras(responseData, StreamSetSchema);
}
