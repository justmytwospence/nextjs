"use server";

import { queryUserAccount } from '@/lib/db';
import { RouteSchema } from '@/schemas/routes';
import tj from '@mapbox/togeojson';
import { DOMParser } from '@xmldom/xmldom';

export async function fetchUserRoutes(session, per_page = 30) {
  const userAccount = await queryUserAccount(session, 'strava');
  const response = await fetch(`https://www.strava.com/api/v3/athlete/routes?per_page=${per_page}`, {
    headers: { "Authorization": `Bearer ${userAccount.access_token}` }
  });

  if (!response.ok) {
    throw new Error(`${response.statusText}: access token = ${userAccount.access_token}`);
  }
  const responseData = await response.json();

  const stravaRoutes = responseData
    .map(route => RouteSchema.safeParse(route))
    .filter(validationResult => validationResult.success)
    .map(validationResult => validationResult.data);

  return stravaRoutes;
}

export async function fetchRouteGeoJson(session, routeId) {
  "use server";

  const userAccount = await queryUserAccount(session, 'strava');

  const stravaResponse = await fetch(`https://www.strava.com/api/v3/routes/${routeId}/export_gpx`, {
    headers: { 'Authorization': `Bearer ${userAccount.access_token}` }
  });

  const gpxData = await stravaResponse.text();
  const gpxParser = new DOMParser();
  const gpxDoc = gpxParser.parseFromString(gpxData, "text/xml");
  const geoJson = tj.gpx(gpxDoc, { styles: false });
  return geoJson;
}
