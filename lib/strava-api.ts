"use server";

/**
 * Strava API client module
 * 
 * This module provides functions for interacting with the Strava API.
 * All functions require an authenticated user session and handle token management,
 * request validation, and response parsing.
 */

import tj from "@mapbox/togeojson";
import type { Route, DetailedSegment, DetailedActivity, SummaryActivity } from "@/schemas/strava";
import { DOMParser } from "@xmldom/xmldom";
import { RoutesSchema, DetailedSegmentSchema, DetailedActivitySchema, SummaryActivitySchema } from "@/schemas/strava";
import { Session } from "next-auth";
import { createSessionLogger } from "@/lib/logger";
import { queryUserAccount, insertApiQuery } from "@/lib/db";
import { z } from "zod";
import { HttpError } from "@/lib/errors";

/**
 * Makes an authenticated request to the Strava API
 * @private
 */
async function makeStravaRequest(
  session: Session,
  endpoint: string,
  params: URLSearchParams = new URLSearchParams()
): Promise<Response> {
  const sessionLogger = createSessionLogger(session);
  const userAccount = await queryUserAccount(session, "strava");

  if (!userAccount?.access_token) {
    sessionLogger.error("No Strava access token found");
    throw new Error("No Strava access token found");
  }

  await insertApiQuery(session, "strava", userAccount?.access_token, endpoint, params);

  const url = new URL(`https://www.strava.com/api/v3${endpoint}`);

  // Add each parameter from params to the URL
  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  sessionLogger.info(`Fetching from URL: ${url.toString()}`);
  const response = await fetch(url.toString(), {
    headers: { "Authorization": `Bearer ${userAccount.access_token}` }
  });

  sessionLogger.debug(`Strava response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    sessionLogger.error(`Failed to fetch from Strava: ${response.status} ${response.statusText}`);
    throw new HttpError(response.status, response.statusText);
  }

  return response
}

/**
 * Fetches a list of routes from the authenticated user's Strava account
 * @param session - The authenticated user session
 * @param per_page - Number of routes to fetch (default: 10)
 * @param page - Page number to fetch (default: 1)
 * @returns Promise containing an array of Route objects
 */
export async function fetchRoutes(session: Session, per_page: number = 10, page: number = 1): Promise<Route[]> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching ${per_page} routes from page ${page} from Strava`);

  const params = new URLSearchParams({
    per_page: per_page.toString(),
    page: page.toString()
  });
  const response = await makeStravaRequest(session, "/athlete/routes", params);
  const responseData = await response.json();
  sessionLogger.info(`Strava response data: ${JSON.stringify(responseData, null, 2)}`);
  const validatedData = RoutesSchema.safeParse(responseData)
  if (!validatedData.success) {
    sessionLogger.error(`Failed to parse routes from Strava: ${JSON.stringify(validatedData.error.errors, null, 2)}`);
    throw new Error(`Failed to parse routes: ${JSON.stringify(validatedData.error.errors, null, 2)}`);
  }

  sessionLogger.info(`Parsed ${validatedData.data.length} routes from Strava`);
  return validatedData.data;
}

/**
 * Fetches detailed information about a specific Strava segment
 * @param session - The authenticated user session
 * @param segmentId - The ID of the segment to fetch
 * @returns Promise containing the DetailedSegment object
 */
export async function fetchDetailedSegment(session: Session, segmentId: number): Promise<DetailedSegment> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching full segment ${segmentId} from Strava`);

  const response = await makeStravaRequest(session, `/segments/${segmentId}`);
  const responseData = await response.json();
  const segment = DetailedSegmentSchema.safeParse(responseData).data;

  if (!segment) {
    sessionLogger.error(`Failed to parse segment ${segmentId} from Strava`);
    throw new Error("Failed to parse segment");
  } else {
    sessionLogger.info(`Successfully fetched segment ${segmentId} as ${segment?.name} from Strava`);
  }

  return segment;
}

/**
 * Fetches and converts a route's GPX data to GeoJSON format
 * @param session - The authenticated user session
 * @param routeId - The ID of the route to fetch
 * @returns Promise containing the GeoJSON representation of the route
 */
export async function fetchRouteGeoJson(session: Session, routeId: string): Promise<JSON> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching GPX for route ${routeId} from Strava`);

  const response = await makeStravaRequest(session, `/routes/${routeId}/export_gpx`);

  switch (response.status) {
    case 429:
      throw new Error("Too Many Requests");
    case 200:
      break;
    default:
      sessionLogger.error(`Failed to fetch GPX for route ${routeId} from Strava: ${response.statusText}`);
      throw new Error(`Failed to fetch GPX: ${response.statusText}`);
  }

  const gpxData = await response.text();
  sessionLogger.info(`Successfully fetched GPX for route ${routeId} from Strava`);
  const gpxParser = new DOMParser();
  const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
  const geoJson = tj.gpx(gpxDoc, { styles: false });
  sessionLogger.info(`Successfully converted GPX to GeoJSON for route ${routeId}`);
  return geoJson;
}

/**
 * Fetches a list of activities from the authenticated user's Strava account
 * @param session - The authenticated user session
 * @param per_page - Number of activities to fetch (default: 10)
 * @param page - Page number to fetch (default: 1)
 * @returns Promise containing an array of SummaryActivity objects
 */
export async function fetchActivities(session: Session, per_page: number = 10, page: number = 1): Promise<SummaryActivity[]> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching ${per_page} activities from page ${page} from Strava`);

  const params = new URLSearchParams({
    per_page: per_page.toString(),
    page: page.toString()
  });
  const response = await makeStravaRequest(session, "/athlete/activities", params);
  const responseData = await response.json();
  sessionLogger.debug(`rawData: ${JSON.stringify(responseData, null, 2)}`);
  const validatedData = z.array(SummaryActivitySchema).safeParse(responseData)

  if (!validatedData.success) {
    sessionLogger.error(`Failed to parse activities from Strava: ${JSON.stringify(validatedData.error.errors, null, 2)}`);
    throw new Error(`Failed to parse activities: ${JSON.stringify(validatedData.error.errors, null, 2)}`);
  } else {
    sessionLogger.info(`Parsed ${validatedData.data.length} activities from Strava`);
    return validatedData.data;
  }
}

/**
 * Fetches detailed information about a specific Strava activity
 * @param session - The authenticated user session
 * @param activityId - The ID of the activity to fetch
 * @returns Promise containing the DetailedActivity object
 */
export async function fetchDetailedActivity(session: Session, activityId: number): Promise<DetailedActivity> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching detailed activity ${activityId} from Strava`);

  const response = await makeStravaRequest(session, `/activities/${activityId}`);
  const responseData = await response.json();
  sessionLogger.info(`responseData: ${JSON.stringify(responseData, null, 2)}`);

  const validatedData = DetailedActivitySchema.safeParse(responseData);

  if (!validatedData.success) {
    sessionLogger.error(`Failed to parse detailed activity ${activityId} from Strava: ${JSON.stringify(validatedData.error.errors, null, 2)}`);
    sessionLogger.debug(`${JSON.stringify(responseData, null, 2)}`);
    throw new Error(`Failed to parse detailed activity: ${JSON.stringify(validatedData.error.errors, null, 2)}`);
  } else {
    sessionLogger.info(`Successfully fetched detailed activity ${activityId} as ${validatedData.data?.name} from Strava`);
    return validatedData.data;
  }
}