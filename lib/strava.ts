"use server";

import { queryUserAccount } from '@/lib/db';
import { createSessionLogger } from '@/lib/logger';
import { RouteSchema } from '@/schemas/routes';
import tj from '@mapbox/togeojson';
import { DOMParser } from '@xmldom/xmldom';
import { Session } from 'next-auth';

export async function fetchUserRoutes(session: Session, per_page: number = 200) {
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
      .map(route => RouteSchema.safeParse(route))
      .filter(validationResult => validationResult.success)
      .map(validationResult => validationResult.data);

    sessionLogger.info('Successfully processed Strava routes', {
      total: responseData.length,
      valid: stravaRoutes.length
    });

    return stravaRoutes;
  } catch (error) {
    sessionLogger.error('Error fetching user routes', { error: error.message });
    throw error;
  }
}

export async function fetchRouteGeoJson(session: Session, routeId: string) {
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
    sessionLogger.error('Error fetching route GeoJSON', {
      routeId,
      error: error.message
    });
    throw error;
  }
}
