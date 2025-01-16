"use client";

import type { Bounds } from "@/app/actions/findPath";
import { AspectChart } from "@/components/aspect-chart";
import ElevationProfile from "@/components/elevation-chart";
import FindPathButton from "@/components/find-path-button";
import GradientCDF from "@/components/gradient-cdf-chart";
import GeoJSONLayer from "@/components/leaflet-geojson-layer"; // Import GeoJSONLayer
import LazyPolylineMap from "@/components/leaflet-map-lazy";
import LeafletPathfindingLayer from "@/components/leaflet-pathfinding-layer";
import LeafletRasterLayer from "@/components/leaflet-raster-layer"; // Import LeafletRasterLayer
import LocationSearch from "@/components/location-search";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectAspectsDialog } from "@/components/ui/select-aspects-dialog";
import type { Aspect } from "@/pathfinder";
import { hoverIndexStore as defaultHoverIndexStore } from "@/store";
import { saveAs } from "file-saver";
import type { FeatureCollection, LineString, Point } from "geojson";
import type GeoTIFF from "geotiff";
import { useCallback, useState } from "react";
import togpx from "togpx";

const parseGeoraster = require("georaster");

export default function PathFinderPage() {
  const [waypoints, setWaypoints] = useState<Point[]>([]);
  const [path, setPath] = useState<LineString | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [excludedAspects, setExcludedAspects] = useState<Aspect[]>([]);
  const [mapCenter, setMapCenter] = useState<[number, number] | undefined>();
  const [aspectPoints, setAspectPoints] = useState<FeatureCollection | null>(
    null
  );
  const [azimuthRaster, setAzimuthRaster] = useState<GeoTIFF | null>(null);

  function handleMapClick(point: Point) {
    setWaypoints([...waypoints, point]);
    return point;
  }

  function handleBoundsChange(newBounds: Bounds) {
    if (
      bounds &&
      bounds.north === newBounds.north &&
      bounds.south === newBounds.south &&
      bounds.east === newBounds.east &&
      bounds.west === newBounds.west
    ) {
      return newBounds;
    }
    setBounds(newBounds);
    return newBounds;
  }

  function handleReset() {
    setWaypoints([]);
    setPath(null);
    setBounds(null);
    setIsLoading(false);
    setAspectPoints(null);

    const mapElement = document.querySelector(".leaflet-container");
    if (mapElement) {
      // @ts-ignore - accessing custom property
      const map = mapElement._leaflet_map;
      if (map?.resetBounds) {
        map.resetBounds();
      }
    }
  }

  function handleCenter() {
    if (waypoints.length > 0) {
      setWaypoints([...waypoints]);
    }
  }

  const handleSetPath = useCallback((newPath: LineString | null) => {
    setPath(null);
    setAspectPoints(null);
    setPath((currentPath) => {
      if (newPath === null) {
        return null;
      }

      const combinedPath: LineString = {
        type: "LineString",
        coordinates:
          currentPath === null
            ? newPath.coordinates
            : [...currentPath.coordinates, ...newPath.coordinates.slice(1)],
      };

      return combinedPath;
    });
  }, []);

  const handleSetAspectPoints = useCallback(
    (newPoints: FeatureCollection | null) => {
      setAspectPoints((currentAspectPoints) => {
        if (newPoints === null) {
          return null;
        }

        const combinedPoints: FeatureCollection = {
          type: "FeatureCollection",
          features: [
            ...(currentAspectPoints?.features || []),
            ...newPoints.features,
          ],
        };

        return combinedPoints;
      });
    },
    []
  );

  const handleLocationSelect = useCallback((center: [number, number]) => {
    setMapCenter(center);
  }, []);

  const handleSetAzimuths = useCallback(async (azimuths: Uint8Array) => {
    const georaster = await parseGeoraster(azimuths.buffer as ArrayBuffer);
    setAzimuthRaster(georaster);
  }, []);

  // Function to convert LineString to GPX using togpx
  const handleDownloadGpx = () => {
    if (!path) return;

    const geojson = {
      type: "Feature",
      geometry: path,
      properties: {},
    };

    const gpxData = togpx(geojson);
    const blob = new Blob([gpxData], { type: "application/gpx+xml" });
    saveAs(blob, "path.gpx");
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-4 mb-4">
        <LocationSearch onLocationSelect={handleLocationSelect} />
        <FindPathButton
          waypoints={waypoints}
          bounds={bounds}
          excludedAspects={excludedAspects}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setPath={handleSetPath}
          setAspectPoints={handleSetAspectPoints}
          setAzimuths={handleSetAzimuths}
        />
        <Button className="flex-1" onClick={handleReset}>
          Reset
        </Button>
        <Button className="flex-1" onClick={handleCenter}>
          Center Points
        </Button>
        <SelectAspectsDialog
          onSelectDirections={setExcludedAspects}
          selectedDirections={excludedAspects}
        />
        <Button className="flex-1" onClick={handleDownloadGpx}>
          Download GPX
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="aspect-square">
          <LazyPolylineMap interactive={true}>
            <LeafletPathfindingLayer
              markers={waypoints}
              showLine={path == null}
              onMapClick={handleMapClick}
              onBoundsChange={handleBoundsChange}
            />
            {path && bounds && aspectPoints && (
              <GeoJSONLayer
                polyline={path}
                polylineProperties={aspectPoints}
                interactive={true}
                hoverIndexStore={defaultHoverIndexStore}
              />
            )}
            {azimuthRaster && (
              <LeafletRasterLayer
                azimuthRaster={azimuthRaster}
                excludedAspects={excludedAspects}
              />
            )}
          </LazyPolylineMap>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Aspect Distribution</h2>
          {aspectPoints && (
            <div className="h-[300px]">
              <AspectChart aspectPoints={aspectPoints} />
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Elevation Profile</h2>
          {path && (
            <div className="h-[300px]">
              <ElevationProfile polyline={path} />
            </div>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-2">Gradient Distribution</h2>
          {path && (
            <div className="h-[300px]">
              <GradientCDF
                mappables={[{ polyline: path, name: "Path", id: "path" }]}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
