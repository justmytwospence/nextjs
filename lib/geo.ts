import * as turf from "@turf/turf";
import { GeoJSON } from "geojson";

export function computeDistanceMiles(polyline: GeoJSON.LineString): number[] {
  let cumulativeDistance = 0;
  return polyline.coordinates.map((point, index, coords) => {
    if (index === 0) return 0;
    const from = turf.point(coords[index - 1]);
    const to = turf.point(point);
    const distance = turf.distance(from, to, { units: "miles" });
    cumulativeDistance += distance;
    return cumulativeDistance;
  });
}

function smoothArray(arr: number[], windowSize: number = 10): number[] {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - Math.floor(windowSize / 2));
      j <= Math.min(arr.length - 1, i + Math.floor(windowSize / 2)); j++) {
      sum += arr[j];
      count++;
    }
    result.push(sum / count);
  }
  return result;
}

export function computeGradient(polyline: GeoJSON.LineString): number[] {
  const rawGradients = polyline.coordinates.map((point, index, coords) => {
    if (index === 0) return 0;
    const from = turf.point(coords[index - 1]);
    const to = turf.point(point);
    const distance = turf.distance(from, to, { units: "meters" });
    const elevationChange = (point[2] - coords[index - 1][2]) * 0.3048;
    return elevationChange / distance;
  });

  return smoothArray(rawGradients);
}

export function computeCdf(data: number[], range: number[]): number[] {
  const sorted = [...data].sort((a, b) => a - b);
  const cdf: number[] = [];
  let cumulativeCount = 0;
  let dataIndex = 0;

  range.forEach(x => {
    while (dataIndex < sorted.length && sorted[dataIndex] <= x) {
      cumulativeCount++;
      dataIndex++;
    }
    cdf.push(cumulativeCount / sorted.length);
  });

  return cdf;
}
