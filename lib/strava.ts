"use server";

import { queryUserAccount } from '@/lib/db';
import { createSessionLogger } from '@/lib/logger';
import { AthleteRoute, AthleteRouteSchema, AthleteSegment, AthleteSegmentSchema } from '@/schemas/strava';
import tj from '@mapbox/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import { Session } from 'next-auth';

export async function fetchUserRoutes(session: Session, per_page: number = 10): Promise<AthleteRoute[]> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching ${per_page} routes from Strava`);
  try {
    const userAccount = await queryUserAccount(session, 'strava');
    const response = await fetch(`https://www.strava.com/api/v3/athlete/routes?per_page=${per_page}`, {
      headers: { "Authorization": `Bearer ${userAccount.access_token}` }
    });

    if (response.status === 429) {
      throw new Error('Too Many Requests');
    }

    if (!response.ok) {
      sessionLogger.error(`Failed to fetch routes from Strava: ${response.statusText}`);
      throw new Error(response.statusText);
    }

    const responseData = await response.json();
    sessionLogger.info(`Received ${responseData.length} routes from Strava`);

    const stravaRoutes = responseData
      .map(route => AthleteRouteSchema.safeParse(route))
      .filter(validationResult => validationResult.success)
      .map(validationResult => validationResult.data);

    sessionLogger.info(`Successfully parsed routes from Strava: ${stravaRoutes.length} successful, ${responseData.length - stravaRoutes.length} failed`);
    return stravaRoutes;
  } catch (error) {
    throw error;
  }
}

export async function fetchUserSegment(session: Session, segmentId: number): Promise<AthleteSegment> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching full segment ${segmentId} from Strava`);
  try {
    const userAccount = await queryUserAccount(session, 'strava');
    const response = await fetch(`https://www.strava.com/api/v3/segments/${segmentId}`, {
      headers: { "Authorization": `Bearer ${userAccount.access_token}` }
    });

    if (response.status === 429) {
      throw new Error('Too Many Requests');
    }

    if (!response.ok) {
      sessionLogger.error(`Failed to fetch segment ${segmentId} from Strava: ${response.statusText}`);
      throw new Error(response.statusText);
    }

    const responseData = await response.json();
    const segment = AthleteSegmentSchema.safeParse(responseData).data;
    if (!segment) {
      sessionLogger.error(`Failed to parse segment ${segmentId} from Strava`);
      throw new Error('Failed to parse segment');
    }
    sessionLogger.info(`Successfully fetched segment ${segmentId}  as ${segment?.name} from Strava`);
    return segment;
  } catch (error) {
    throw error;
  }
}

export async function fetchRouteGeoJson(session: Session, routeId: number): Promise<JSON> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info(`Fetching GPX for route ${routeId} from Strava`);
  try {
    const userAccount = await queryUserAccount(session, 'strava');
    const response = await fetch(`https://www.strava.com/api/v3/routes/${routeId}/export_gpx`, {
      headers: { 'Authorization': `Bearer ${userAccount.access_token}` }
    });

    if (response.status === 429) {
      throw new Error('Too Many Requests');
    }

    if (!response.ok) {
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
  } catch (error) {
    throw error;
  }
}
