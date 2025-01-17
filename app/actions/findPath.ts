"use server";

import { getTopo } from "@/lib/geo/open-topo";
import { checkGeoTIFFCache, getGeoTiff, insertGeoTiff } from "@/lib/geo/tiling";
import type { Point } from "geojson";
import type { Aspect, PathResults } from "pathfinder";

const pathfinder = require("pathfinder");
const { pathfind } = pathfinder;

type findPathMessage =
  | {
      type: "info" | "success" | "warning" | "error";
      message: string;
    }
  | {
      type: "result";
      result: {
        path: string;
        azimuths: number[];
      };
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
  yield { type: "info", message: "Downloading DEM from OpenTopo..." };
  const geoTiffArrayBuffer = await getTopo(bounds);

  try {
    for (let i = 0; i < waypoints.length - 1; i++) {
      yield { type: "info", message: `Finding path for segment ${i+1}` };
      const { path, azimuths } = await pathfind(
        geoTiffArrayBuffer,
        JSON.stringify(waypoints[i]),
        JSON.stringify(waypoints[i + 1]),
        excludedAspects
      );

      yield { type: "success", message: `Found path ${i+1}...` };
      yield {
        type: "result",
        result: {
          path: path,
          azimuths: Array.from(azimuths)
        } 
      };
    }
  } catch (error) {
    yield { type: "error", message: "Failed to find path." };
    throw error;
  }
}
