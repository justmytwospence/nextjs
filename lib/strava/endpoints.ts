import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
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
import { queryUserAccount } from "../db";
import { withRetry } from "./decorators";
import { makeStravaRequest } from "./api";
import { validateAndLogExtras } from "./schema";

export const fetchRoutes = withRetry()(
  async (
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
  }
);

export const fetchDetailedSegment = withRetry()(
  async (userId: string, segmentId: string): Promise<DetailedSegment> => {
    const response = await makeStravaRequest(userId, `/segments/${segmentId}`);
    const responseData = await response.json();
    const segment = validateAndLogExtras(responseData, DetailedSegmentSchema);
    if (!segment) {
      throw new Error("Failed to parse segment");
    }
    return segment;
  }
);

export const fetchRouteGeoJson = withRetry()(
  async (userId: string, routeId: string): Promise<JSON> => {
    const response = await makeStravaRequest(
      userId,
      `/routes/${routeId}/export_gpx`
    );
    const gpxData = await response.text();
    const gpxParser = new DOMParser();
    const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
    const geoJson = tj.gpx(gpxDoc, { styles: false });
    return geoJson.features[0].geometry;
  }
);

export const fetchActivities = withRetry()(
  async (
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
  }
);

export const fetchDetailedActivity = withRetry()(
  async (userId: string, activityId: string): Promise<DetailedActivity> => {
    const response = await makeStravaRequest(
      userId,
      `/activities/${activityId}`
    );
    const responseData = await response.json();
    return validateAndLogExtras(responseData, DetailedActivitySchema);
  }
);

export async function refreshToken(userId: string) {
  const stravaAccount = await queryUserAccount(userId, "");
  if (!stravaAccount || !stravaAccount.expires_at) {
    baseLogger.error(`No Strava account found for user ${userId}`);
    throw new Error("No Strava account found");
  }

  if (stravaAccount.expires_at * 1000 < Date.now()) {
    try {
      if (!stravaAccount.refresh_token) {
        return;
      }

      const response = await fetch(
        "https://www.strava.com/api/v3/oauth/token",
        {
          method: "POST",
          body: new URLSearchParams({
            client_id: process.env.STRAVA_CLIENT_ID!,
            client_secret: process.env.STRAVA_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: stravaAccount.refresh_token,
          }),
        }
      );

      const tokensOrError = await response.json();
      if (!response.ok) {
        throw tokensOrError;
      }

      const newTokens = tokensOrError as {
        access_token: string;
        refresh_token?: string;
        expires_at: number;
      };

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
      });
    } catch (error) {
      return;
    }
  }
  return;
}
