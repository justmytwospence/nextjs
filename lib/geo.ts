import * as turf from '@turf/turf';
import { GeoJSON } from 'geojson';

export function computeDistanceMiles(polyline: GeoJSON.LineString): number[] {
  let cumulativeDistance = 0;
  return polyline.coordinates.map((point, index, coords) => {
    if (index === 0) return 0;
    const from = turf.point(coords[index - 1]);
    const to = turf.point(point);
    const distance = turf.distance(from, to, { units: 'miles' });
    cumulativeDistance += distance;
    return cumulativeDistance;
  });
}

export function computeGradient(polyline: GeoJSON.LineString): number[] {
  return polyline.coordinates.map((point, index, coords) => {
    if (index === 0) return 0;
    const from = turf.point(coords[index - 1]);
    const to = turf.point(point);
    const distance = turf.distance(from, to, { units: 'meters' });
    const elevationChange = (point[2] - coords[index - 1][2]) * 0.3048;
    return elevationChange / distance;
  });
}
