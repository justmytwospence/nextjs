"use server";

import { queryUserAccount } from '@/lib/db';
import { createSessionLogger } from '@/lib/logger';
import { AthleteRoute, AthleteRouteSchema, AthleteSegment, AthleteSegmentSchema } from '@/schemas/strava';
import tj from '@mapbox/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import { Session } from 'next-auth';

export async function fetchUserRoutes(session: Session, per_page: number = 200): Promise<AthleteRoute[]> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info('Fetching user routes from Strava', { per_page });
  try {
    const userAccount = await queryUserAccount(session, 'strava');
    const response = await fetch(`https://www.strava.com/api/v3/athlete/routes?per_page=${per_page}`, {
      headers: { "Authorization": `Bearer ${userAccount.access_token}` }
    });

    if (!response.ok) {
      const error = `${response.statusText}: access token = ${userAccount.access_token}`;
      sessionLogger.error('Failed to fetch routes from Strava', { error, status: response.status });
      throw new Error(error);
    }

    const responseData = await response.json();
    sessionLogger.info('Received routes from Strava', { count: responseData.length });

    const stravaRoutes = responseData
      .map(route => AthleteRouteSchema.safeParse(route))
      .filter(validationResult => validationResult.success)
      .map(validationResult => validationResult.data);

    sessionLogger.info('Successfully fetched Strava routes', {
      total: responseData.length,
      valid: stravaRoutes.length
    });

    return stravaRoutes;
  } catch (error) {
    throw error;
  }
}

export async function fetchUserSegment(session: Session, segmentId: number): Promise<AthleteSegment> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info('Fetching segment from Strava', { segmentId });
  try {
    const userAccount = await queryUserAccount(session, 'strava');
    const response = await fetch(`https://www.strava.com/api/v3/segments/${segmentId}`, {
      headers: { "Authorization": `Bearer ${userAccount.access_token}` }
    });

    if (!response.ok) {
      const error = `${response.statusText}: access token = ${userAccount.access_token}`;
      sessionLogger.error('Failed to fetch segment from Strava', { error, status: response.status });
      throw new Error(error);
    }

    const responseData = await response.json();
    const segment = AthleteSegmentSchema.safeParse(responseData).data;
    sessionLogger.info('Successfully fetched Strava segment', { segment });

    return segment;
  } catch (error) {
    throw error;
  }
}

export async function fetchRouteGeoJson(session: Session, routeId: number): Promise<JSON> {
  const sessionLogger = createSessionLogger(session);
  sessionLogger.info('Fetching route GeoJSON', { routeId });
  try {
    const userAccount = await queryUserAccount(session, 'strava');
    const stravaResponse = await fetch(`https://www.strava.com/api/v3/routes/${routeId}/export_gpx`, {
      headers: { 'Authorization': `Bearer ${userAccount.access_token}` }
    });

    if (!stravaResponse.ok) {
      sessionLogger.error('Failed to fetch GPX from Strava', {
        status: stravaResponse.status,
        routeId
      });
      throw new Error(`Failed to fetch GPX: ${stravaResponse.statusText}`);
    }

    const gpxData = await stravaResponse.text();
    sessionLogger.info('Received GPX data from Strava', { routeId });

    const gpxParser = new DOMParser();
    const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
    const geoJson = tj.gpx(gpxDoc, { styles: false });

    sessionLogger.info('Successfully converted GPX to GeoJSON', { routeId });
    return geoJson;
  } catch (error) {
    throw error;
  }
}
