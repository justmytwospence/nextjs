"use server";

/**
 * Strava API client module
 * 
 * This module provides functions for interacting with the Strava API.
 * All functions require an authenticated userId and handle token management,
 * request validation, and response parsing.
 */

import tj from "@mapbox/togeojson";
import type { Route, DetailedSegment, DetailedActivity, SummaryActivity } from "@/schemas/strava";
import { DOMParser } from "@xmldom/xmldom";
import { prisma } from "@/lib/prisma";
import { RoutesSchema, DetailedSegmentSchema, DetailedActivitySchema, SummaryActivitySchema } from "@/schemas/strava";
import { baseLogger } from "@/lib/logger";
import { queryUserAccount, insertApiQuery } from "@/lib/db";
import { z } from "zod";
import { HttpError } from "@/lib/errors";

/*d
 * Makes an authenticated request to the Strava API
 * @private
 */
async function makeStravaRequest(
  userId: string,
  endpoint: string,
  params: URLSearchParams = new URLSearchParams()
): Promise<Response> {
  const userAccount = await queryUserAccount(userId, "strava");

  if (!userAccount?.access_token) {
    baseLogger.error("No Strava access token found");
    throw new Error("No Strava access token found");
  }

  await insertApiQuery(userId, "strava", userAccount?.access_token, endpoint, params);

  const url = new URL(`https://www.strava.com/api/v3${endpoint}`);

  // Add each parameter from params to the URL
  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });

  baseLogger.info(`Fetching from URL: ${url.toString()}`);
  const response = await fetch(url.toString(), {
    headers: { "Authorization": `Bearer ${userAccount.access_token}` }
  });

  baseLogger.debug(`Strava response: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    baseLogger.error(`Failed to fetch from Strava: ${response.status} ${response.statusText}`);
    throw new HttpError(response.status, response.statusText);
  }

  return response
}

/**
 * Fetches a list of routes from the authenticated user's Strava account
 * @param userId - The authenticated user 
 * @param per_page - Number of routes to fetch (default: 10)
 * @param page - Page number to fetch (default: 1)
 * @returns Promise containing an array of Route objects
 */
export async function fetchRoutes(userId: string, per_page: number = 10, page: number = 1): Promise<Route[]> {
  baseLogger.info(`Fetching ${per_page} routes from page ${page} from Strava`);

  const params = new URLSearchParams({
    per_page: per_page.toString(),
    page: page.toString()
  });
  const response = await makeStravaRequest(userId, "/athlete/routes", params);
  const responseData = await response.json();
  baseLogger.info(`Strava response data: ${JSON.stringify(responseData, null, 2)}`);
  const validatedRoutes = RoutesSchema.safeParse(responseData)
  if (!validatedRoutes.success) {
    baseLogger.error(`Failed to parse routes from Strava: ${JSON.stringify(validatedRoutes.error.errors, null, 2)}`);
    throw new Error(`Failed to parse routes: ${JSON.stringify(validatedRoutes.error.errors, null, 2)}`);
  }

  baseLogger.info(`Parsed ${validatedRoutes.data.length} routes from Strava`);
  return validatedRoutes.data;
}

/**
 * Fetches detailed information about a specific Strava segment
 * @param userId - The authenticated user
 * @param segmentId - The ID of the segment to fetch
 * @returns Promise containing the DetailedSegment object
 */
export async function fetchDetailedSegment(userId: string, segmentId: number): Promise<DetailedSegment> {
  baseLogger.info(`Fetching full segment ${segmentId} from Strava`);

  const response = await makeStravaRequest(userId, `/segments/${segmentId}`);
  const responseData = await response.json();
  const segment = DetailedSegmentSchema.safeParse(responseData).data;

  if (!segment) {
    baseLogger.error(`Failed to parse segment ${segmentId} from Strava`);
    throw new Error("Failed to parse segment");
  } else {
    baseLogger.info(`Successfully fetched segment ${segmentId} as ${segment?.name} from Strava`);
  }

  return segment;
}

/**
 * Fetches and converts a route's GPX data to GeoJSON format
 * @param userId - The authenticated user
 * @param routeId - The ID of the route to fetch
 * @returns Promise containing the GeoJSON representation of the route
 */
export async function fetchRouteGeoJson(userId: string, routeId: string): Promise<JSON> {
  baseLogger.info(`Fetching GPX for route ${routeId} from Strava`);

  const response = await makeStravaRequest(userId, `/routes/${routeId}/export_gpx`);

  switch (response.status) {
    case 429:
      throw new Error("Too Many Requests");
    case 200:
      break;
    default:
      baseLogger.error(`Failed to fetch GPX for route ${routeId} from Strava: ${response.statusText}`);
      throw new Error(`Failed to fetch GPX: ${response.statusText}`);
  }

  const gpxData = await response.text();
  baseLogger.info(`Successfully fetched GPX for route ${routeId} from Strava`);
  const gpxParser = new DOMParser();
  const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
  const geoJson = tj.gpx(gpxDoc, { styles: false });
  baseLogger.info(`Successfully converted GPX to GeoJSON for route ${routeId}`);
  return geoJson;
}

/**
 * Fetches a list of activities from the authenticated user's Strava account
 * @param userId - The authenticated user
 * @param per_page - Number of activities to fetch (default: 10)
 * @param page - Page number to fetch (default: 1)
 * @returns Promise containing an array of SummaryActivity objects
 */
export async function fetchActivities(userId: string, per_page: number = 10, page: number = 1): Promise<SummaryActivity[]> {
  baseLogger.info(`Fetching ${per_page} activities from page ${page} from Strava`);

  const params = new URLSearchParams({
    per_page: per_page.toString(),
    page: page.toString()
  });
  const response = await makeStravaRequest(userId, "/athlete/activities", params);
  const responseData = await response.json();
  baseLogger.debug(`rawData: ${JSON.stringify(responseData, null, 2)}`);
  const validatedActivities = z.array(SummaryActivitySchema).safeParse(responseData)

  if (!validatedActivities.success) {
    baseLogger.error(`Failed to parse activities from Strava: ${JSON.stringify(validatedActivities.error.errors, null, 2)}`);
    throw new Error(`Failed to parse activities: ${JSON.stringify(validatedActivities.error.errors, null, 2)}`);
  } else {
    baseLogger.info(`Parsed ${validatedActivities.data.length} activities from Strava`);
    return validatedActivities.data;
  }
}

/**
 * Fetches detailed information about a specific Strava activity
 * @param userId - The authenticated user
 * @param activityId - The ID of the activity to fetch
 * @returns Promise containing the DetailedActivity object
 */
export async function fetchDetailedActivity(userId: string, activityId: number): Promise<DetailedActivity> {
  baseLogger.info(`Fetching detailed activity ${activityId} from Strava`);

  const response = await makeStravaRequest(userId, `/activities/${activityId}`);
  const responseData = await response.json();
  baseLogger.info(`responseData: ${JSON.stringify(responseData, null, 2)}`);

  const validatedActivities = DetailedActivitySchema.safeParse(responseData);

  if (!validatedActivities.success) {
    baseLogger.error(`Failed to parse detailed activity ${activityId} from Strava: ${JSON.stringify(validatedActivities.error.errors, null, 2)}`);
    baseLogger.debug(`${JSON.stringify(responseData, null, 2)}`);
    throw new Error(`Failed to parse detailed activity: ${JSON.stringify(validatedActivities.error.errors, null, 2)}`);
  } else {
    baseLogger.info(`Successfully fetched detailed activity ${activityId} as ${validatedActivities.data?.name} from Strava`);
    return validatedActivities.data;
  }
}

export async function refreshToken(userId: string) {
  const stravaAccount = await queryUserAccount(userId, "strava");
  if (!stravaAccount || !stravaAccount.expires_at) {
    baseLogger.error(`No Strava account found for user ${userId}`);
    throw new Error("No Strava account found");
  }

  if (stravaAccount.expires_at * 1000 < Date.now()) {
    try {
      if (!stravaAccount.refresh_token) {
        return
      }

      const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
        method: "POST",
        body: new URLSearchParams({
          client_id: process.env.STRAVA_CLIENT_ID!,
          client_secret: process.env.STRAVA_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: stravaAccount.refresh_token,
        }),
      })

      const tokensOrError = await response.json()
      if (!response.ok) {
        throw tokensOrError;
      }

      const newTokens = tokensOrError as {
        access_token: string
        refresh_token?: string
        expires_at: number
      }

      await prisma.account.update({
        data: {
          access_token: newTokens.access_token,
          expires_at: newTokens.expires_at,
          refresh_token: newTokens.refresh_token ?? stravaAccount.refresh_token,
        },
        where: {
          provider_providerAccountId: {
            provider: "strava",
            providerAccountId: stravaAccount.providerAccountId,
          },
        },
      })
    } catch (error) {
      return
    }
  }
  return
}