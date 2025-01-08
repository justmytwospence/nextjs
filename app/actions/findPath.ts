"use server";

import { getTopo } from "@/lib/geo/open-topo";
import type { LineString, Point } from "geojson";
import pathfinder, { type Aspect } from "pathfinder";
const { processMap } = pathfinder;

type findPathMessage = {
  type: "info" | "success" | "warning" | "error" | "result";
  message: string;
};

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export default async function* findPath(
  start: Point,
  end: Point,
  bounds: Bounds,
  excludedAspects: Aspect[] = []
): AsyncGenerator<findPathMessage, LineString, unknown> {
  try {
    const [x1, y1] = start.coordinates;
    const [x2, y2] = end.coordinates;

    yield { type: "info", message: "Downloading DEM..." };
    const geoTiffArrayBuffer = await getTopo(bounds);
    yield { type: "success", message: "DEM downloaded." };

    yield { type: "info", message: "Finding path..." };
    const path = await processMap(
      Buffer.from(geoTiffArrayBuffer),
      JSON.stringify(start),
      JSON.stringify(end),
      excludedAspects
    );
    yield { type: "success", message: "Path successfully found." };
    yield { type: "result", message: path };
    return JSON.parse(path);
  } catch (error) {
    yield { type: "error", message: "Failed to find path." };
    throw error;
  }
}
