"use server";

import { getTopo } from "@/lib/geo/open-topo";
import type { LineString, Point } from "geojson";

import { calculateDistance } from "@/pathfinder";

export default async function findPath(start: Point, end: Point): Promise<LineString> {
  const [x1, y1] = start.coordinates;
  const [x2, y2] = end.coordinates;

  // Calculate bounding box
  const minX = Math.min(x1, x2);
  const minY = Math.min(y1, y2);
  const maxX = Math.max(x1, x2);
  const maxY = Math.max(y1, y2);

  // Download topographic raster data for the bounding box
  const geoTiffArrayBuffer = await getTopo(minY, maxY, minX, maxX);

  const foo = calculateDistance(x1, x2, y1, y2);
  console.log(foo);
}