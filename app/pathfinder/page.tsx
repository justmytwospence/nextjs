"use client";

import type { Bounds } from "@/app/actions/findPath";
import { AspectChart } from "@/components/aspect-chart";
import ElevationProfile from "@/components/elevation-chart";
import FindPathButton from "@/components/find-path-button";
import GradientCDF from "@/components/gradient-cdf-chart";
import LocationSearch from "@/components/location-search";
import LazyPolylineMap from "@/components/polyline-map-lazy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectAspectsDialog } from "@/components/ui/select-aspects-dialog";
import type { Aspect } from "@/pathfinder";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import { useCallback, useState } from "react";

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
        />
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={handleCenter}>Center Points</Button>
        <SelectAspectsDialog
          onSelectDirections={setExcludedAspects}
          selectedDirections={excludedAspects}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="aspect-square">
          <LazyPolylineMap
            onMapClick={handleMapClick}
            onMapMove={handleBoundsChange}
            interactive={true}
            clickable={path === null}
            markers={waypoints}
            polyline={path}
            polylineProperties={aspectPoints}
            center={mapCenter}
          />
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
