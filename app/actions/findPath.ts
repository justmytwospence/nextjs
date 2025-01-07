"use server";

import { getTopo } from "@/lib/geo/open-topo";
import type { LineString, Point } from "geojson";
import pathfinder from "pathfinder";
const { processMap } = pathfinder;

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export default async function findPath(
  start: Point,
  end: Point,
  bounds: Bounds
): Promise<LineString> {
  const [x1, y1] = start.coordinates;
  const [x2, y2] = end.coordinates;

  const geoTiffArrayBuffer = await getTopo(bounds);
  console.log(JSON.stringify(start));
  const result = await processMap(
    Buffer.from(geoTiffArrayBuffer),
    JSON.stringify(start),
    JSON.stringify(end)
  );
  console.log(result);

  const lineString = JSON.parse(result);
  return lineString;
}
