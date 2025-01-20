"use server";

import { getTopo } from "@/lib/geo/open-topo";
import { checkGeoTIFFCache, getGeoTiff, insertGeoTiff } from "@/lib/geo/tiling";
import type { Point } from "geojson";
import { type Aspect, computeAzimuths, findPathRs } from "pathfinder";

type findPathMessage =
  | {
      type: "info" | "success" | "warning" | "error";
      message: string;
    }
  | {
      type: "rasterResult";
      result: {
        elevations: number[];
        azimuths: number[];
        gradients: number[];
      };
    }
  | {
      type: "geoJsonResult";
      result: string;
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
  maxGradient: number,
  excludedAspects: Aspect[] = [],
): AsyncGenerator<findPathMessage, void, unknown> {
  yield { type: "info", message: "Downloading DEM from OpenTopo..." };
  const geoTiffArrayBuffer = await getTopo(bounds);

  try {
    yield { type: "info", message: "Computing azimuths and gradients..." };
    const { elevations, azimuths, gradients } = computeAzimuths(geoTiffArrayBuffer);
    yield {
      type: "rasterResult",
      result: {
        elevations: Array.from(elevations),
        azimuths: Array.from(azimuths),
        gradients: Array.from(gradients),
      },
    };

    for (let i = 0; i < waypoints.length - 1; i++) {
      yield { type: "info", message: `Finding path for segment ${i + 1}` };
      const path = findPathRs(
        geoTiffArrayBuffer,
        JSON.stringify(waypoints[i]),
        JSON.stringify(waypoints[i + 1]),
        maxGradient,
        azimuths,
        excludedAspects,
        gradients,
        0.05
      );

      yield {
        type: "geoJsonResult",
        result: path
      };
    }
  } catch (error) {
    yield { type: "error", message: "Failed to find path." };
    throw error;
  }
}
