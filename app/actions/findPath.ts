"use server";

import { getTopo } from "@/lib/geo/open-topo";
import type { LineString, Point } from "geojson";
import pathfinder, { type Results, type Aspect } from "pathfinder";
const { processMap } = pathfinder;

type findPathMessage =
  | {
      type: "info" | "success" | "warning" | "error";
      message: string;
    }
  | {
      type: "result";
      result: Results;
    };

export type Bounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export default async function* findPath(
  waypoints: Point[],
  bounds: Bounds,
  excludedAspects: Aspect[] = []
): AsyncGenerator<findPathMessage, void, unknown> {
  yield { type: "info", message: "Downloading DEM..." };
  const geoTiffArrayBuffer = await getTopo(bounds);
  yield { type: "success", message: "DEM downloaded." };

  yield { type: "info", message: "Finding path..." };
  try {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      const { pathLine, pathPoints } = await processMap(
        Buffer.from(geoTiffArrayBuffer),
        JSON.stringify(start),
        JSON.stringify(end),
        excludedAspects
      );

      yield {
        type: "success",
        message: "Path successfully found.",
      };

      yield {
        type: "result",
        result: {
          pathLine,
          pathPoints
        }
      };
    }
  } catch (error) {
    yield { type: "error", message: "Failed to find path." };
    throw error;
  }
}
