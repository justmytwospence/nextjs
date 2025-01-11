"use server";

import fs from "node:fs/promises";
import { getTopo } from "@/lib/geo/open-topo";
import { checkGeoTIFFCache, getGeoTiff, insertGeoTiff } from "@/lib/geo/tiling";
import { baseLogger } from "@/lib/logger";
import type { Point } from "geojson";

import type { Aspect, Results } from "pathfinder";

process.env.LD_DEBUG = "libs";
process.env.LD_LIBRARY_PATH = process.env.LD_LIBRARY_PATH
  ? `${process.env.LD_LIBRARY_PATH}:/var/task/artifacts`
  : "/var/task/artifacts";

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

async function cacheGeoTIFF(geoTiffArrayBuffer: Buffer) {
  try {
    await insertGeoTiff(geoTiffArrayBuffer);
    return true;
  } catch (error) {
    console.error("Failed to cache GeoTIFF:", error);
    return false;
  }
}

export default async function* findPath(
  waypoints: Point[],
  bounds: Bounds,
  excludedAspects: Aspect[] = []
): AsyncGenerator<findPathMessage, void, unknown> {
  const librariesDir = "/var/task/artifacts";
  const files = await fs.readdir(librariesDir);
  console.log(`${librariesDir} directory: `, files);
  const stats = await fs.stat(`${librariesDir}/libgdal.so.36.3.10.0`);
  console.log("Stats:", JSON.stringify(stats, null, 2));

  baseLogger.debug("LD_LIBRARY_PATH: ", process.env.LD_LIBRARY_PATH);
  baseLogger.debug("LD_DEBUG: ", process.env.LD_DEBUG);

  const pathfinder = require("pathfinder");
  const { pathfind } = pathfinder;

  yield { type: "info", message: "Checking cache..." };
  const boundsInCache = await checkGeoTIFFCache(bounds);

  let geoTiffArrayBuffer: Buffer;
  let cachingPromise: Promise<boolean> | null = null;

  if (boundsInCache) {
    yield { type: "info", message: "Downloading DEM from cache..." };
    geoTiffArrayBuffer = await getGeoTiff(bounds);
    yield { type: "success", message: "DEM downloaded" };
  } else {
    yield { type: "info", message: "Downloading DEM from OpenTopo..." };
    geoTiffArrayBuffer = await getTopo(bounds);
    yield { type: "success", message: "DEM downloaded" };
    yield { type: "info", message: "Starting DEM cache in background..." };
    cachingPromise = cacheGeoTIFF(geoTiffArrayBuffer);
  }

  yield { type: "info", message: "Finding path..." };
  try {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const start = waypoints[i];
      const end = waypoints[i + 1];

      const { pathLine, pathPoints } = await pathfind(
        geoTiffArrayBuffer,
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
          pathPoints,
        },
      };
    }

    if (cachingPromise) {
      const cacheResult = await cachingPromise;
      yield {
        type: "success",
        message: cacheResult ? "DEM cached successfully" : "DEM caching failed",
      };
    }
  } catch (error) {
    yield { type: "error", message: "Failed to find path." };
    throw error;
  }
}
