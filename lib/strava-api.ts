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
import { RoutesSchema, DetailedSegmentSchema, DetailedActivitySchema, SummaryActivitiesSchema } from "@/schemas/strava";
import { baseLogger } from "@/lib/logger";
import { queryUserAccount } from "@/lib/db";
import { z } from "zod";
import { HttpError, type RateLimit } from "@/lib/errors";

/**
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

  const url = new URL(`https://www.strava.com/api/v3${endpoint}`);
  params.forEach((value, key) => url.searchParams.append(key, value));

  baseLogger.info(`Fetching from URL: ${url.toString()}`);
  const response = await fetch(url.toString(), {
    headers: { "Authorization": `Bearer ${userAccount.access_token}` }
  });

  if (response.status === 429) {
    const rateLimit: RateLimit = {
      short: {
        usage: Number(response.headers.get("X-RateLimit-Usage")?.split(",")[0]),
        limit: Number(response.headers.get("X-RateLimit-Limit")?.split(",")[0]),
        readUsage: Number(response.headers.get("X-ReadRateLimit-Usage")?.split(",")[0]),
        readLimit: Number(response.headers.get("X-ReadRateLimit-Limit")?.split(",")[0])
      },
      long: {
        usage: Number(response.headers.get("X-RateLimit-Usage")?.split(",")[1]),
        limit: Number(response.headers.get("X-RateLimit-Limit")?.split(",")[1]),
        readUsage: Number(response.headers.get("X-ReadRateLimit-Usage")?.split(",")[1]),
        readLimit: Number(response.headers.get("X-ReadRateLimit-Limit")?.split(",")[1])
      }
    };

    throw new HttpError(429, "Rate limit exceeded", rateLimit);
  }

  if (!response.ok) {
    baseLogger.error(`${response.status} ${response.statusText}`);
    throw new HttpError(response.status, response.statusText);
  }

  return response;
}

const validateAndLogExtras = (data: any, schema: z.ZodObject<any> | z.ZodArray<any>): any => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Check if we only have unrecognized keys errors
      const hasOnlyUnrecognizedKeys = error.errors.every(e => e.code === "unrecognized_keys");

      // Log unrecognized fields
      const unrecognizedFields = new Set(error.errors.flatMap((e) => e.code === "unrecognized_keys" ? e.keys : []));
      if (unrecognizedFields.size > 0) {
        baseLogger.warn(`Received unrecognized fields from Strava: ${Array.from(unrecognizedFields).join(", ")}`);
      }

      // If we only have unrecognized keys, we can safely strip and continue
      if (hasOnlyUnrecognizedKeys) {
        if (schema instanceof z.ZodArray) {
          const arraySchema = schema.element;
          if (arraySchema instanceof z.ZodObject) {
            return data.map((item: any) => arraySchema.strip().parse(item));
          }
        }
        if (schema instanceof z.ZodObject) {
          return schema.strip().parse(data);
        }
      }

      // If we have other validation errors, throw them
      throw error;
    }
    throw error;
  }
};

/**
 * Fetches a list of routes from the authenticated user's Strava account
 * @param userId - The authenticated user 
 * @param perPage - Number of routes to fetch (default: 10)
 * @param page - Page number to fetch (default: 1)
 * @returns Promise containing an array of Route objects
 */
export async function fetchRoutes(
  userId: string,
  perPage: number = 10,
  page: number = 1
): Promise<Route[]> {
  baseLogger.info(`Fetching ${perPage} routes from page ${page} from Strava`);

  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString()
  });
  const response = await makeStravaRequest(userId, "/athlete/routes", params);
  const responseData = await response.json();
  const validatedRoutes = validateAndLogExtras(responseData, RoutesSchema);
  return validatedRoutes;
}

/**
 * Fetches detailed information about a specific Strava segment
 * @param userId - The authenticated user
 * @param segmentId - The ID of the segment to fetch
 * @returns Promise containing the DetailedSegment object
 */
export async function fetchDetailedSegment(
  userId: string,
  segmentId: string
): Promise<DetailedSegment> {
  baseLogger.info(`Fetching full segment ${segmentId} from Strava`);

  const response = await makeStravaRequest(userId, `/segments/${segmentId}`);
  const responseData = await response.json();
  const segment = validateAndLogExtras(responseData, DetailedSegmentSchema);

  if (!segment) {
    baseLogger.error(`Failed to parse segment ${segmentId} from Strava`);
    throw new Error("Failed to parse segment");
  }

  return segment;
}

/**
 * Fetches and converts a route's GPX data to GeoJSON format
 * @param userId - The authenticated user
 * @param routeId - The ID of the route to fetch
 * @returns Promise containing the GeoJSON representation of the route
 */
export async function fetchRouteGeoJson(
  userId: string,
  routeId: string
): Promise<JSON> {
  baseLogger.info(`Fetching GPX for route ${routeId} from Strava`);

  const response = await makeStravaRequest(userId, `/routes/${routeId}/export_gpx`);
  const gpxData = await response.text();

  baseLogger.info(`Successfully fetched GPX for route ${routeId} from Strava`);
  const gpxParser = new DOMParser();
  const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
  const geoJson = tj.gpx(gpxDoc, { styles: false });
  const lineString = geoJson.features[0].geometry;

  baseLogger.info(`Successfully converted GPX to GeoJSON for route ${routeId}`);
  return lineString;
}

/**
 * Fetches a list of activities from the authenticated user's Strava account
 * @param userId - The authenticated user
 * @param perPage - Number of activities to fetch (default: 10)
 * @param page - Page number to fetch (default: 1)
 * @returns Promise containing an array of SummaryActivity objects
 */
export async function fetchActivities(
  userId: string,
  perPage: number = 10,
  page: number = 1
): Promise<SummaryActivity[]> {
  const params = new URLSearchParams({
    per_page: perPage.toString(),
    page: page.toString()
  });
  const response = await makeStravaRequest(userId, "/athlete/activities", params);
  const responseData = await response.json();
  const validatedActivities = validateAndLogExtras(responseData, SummaryActivitiesSchema);
  return validatedActivities;
}

/**
 * Fetches detailed information about a specific Strava activity
 * @param userId - The authenticated user
 * @param activityId - The ID of the activity to fetch
 * @returns Promise containing the DetailedActivity object
 */
export async function fetchDetailedActivity(
  userId: string,
  activityId: string
): Promise<DetailedActivity> {
  baseLogger.info(`Fetching detailed activity ${activityId} from Strava`);

  const response = await makeStravaRequest(userId, `/activities/${activityId}`);
  const responseData = await response.json();
  const validatedActivities = validateAndLogExtras(responseData, DetailedActivitySchema);
  baseLogger.info(`Successfully fetched detailed activity ${activityId} as ${validatedActivities.name} from Strava`);
  return validatedActivities;
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

