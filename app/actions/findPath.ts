"use server";

import fs from "node:fs/promises";
import path from "node:path";
import { getTopo } from "@/lib/geo/open-topo";
import { checkGeoTIFFCache, getGeoTiff, insertGeoTiff } from "@/lib/geo/tiling";
import { baseLogger } from "@/lib/logger";
import type { Point } from "geojson";

import type { Aspect, Results } from "pathfinder";

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
  const cwd = process.cwd();
  console.log("CWD: ", cwd)
  console.log("Files in CWD: ", await fs.readdir(cwd));
  const librariesDir = "/var/task/libraries"
  const files = await fs.readdir(librariesDir);
  console.log("Files in /var/task/libraries directory: ", files);
  for (const file of files) {
    const filePath = path.join(librariesDir, file);
    const stats = await fs.stat(filePath);
    const permissions = `0${(stats.mode & 0o777).toString(8)}`;
    console.log(`Permissions: ${permissions}`);
  }

  process.env.LD_LIBRARY_PATH = librariesDir;
  baseLogger.debug("LD_LIBRARY_PATH: ", process.env.LD_LIBRARY_PATH);

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
