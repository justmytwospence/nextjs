import type {
  DetailedActivity,
  DetailedSegment,
  Route,
  SummaryActivity,
} from "@/lib/strava/schemas/strava";
import {
  DetailedActivitySchema,
  DetailedSegmentSchema,
  RoutesSchema,
  SummaryActivitiesSchema,
} from "@/lib/strava/schemas/strava";
import tj from "@mapbox/togeojson";
import { DOMParser } from "@xmldom/xmldom";
import { makeStravaRequest } from "./api";
import { validateAndLogExtras } from "./schema";

export const fetchRoutes = async (
  userId: string,
  perPage: number = 10,
  page: number = 1
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
): Promise<JSON> => {
  const response = await makeStravaRequest(
    userId,
    `/routes/${routeId}/export_gpx`
  );
  const gpxData = await response.text();
  const gpxParser = new DOMParser();
  const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
  const geoJson = tj.gpx(gpxDoc, { styles: false });
  return geoJson.features[0].geometry;
};

export const fetchActivities = async (
  userId: string,
  perPage: number = 10,
  page: number = 1
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
