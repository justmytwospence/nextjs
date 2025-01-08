"use client";

import findPath from "@/app/actions/findPath";
import type { Bounds } from "@/app/actions/findPath";
import ElevationProfile from "@/components/elevation-chart";
import FindPathButton from "@/components/find-path-button";
import GradientCDF from "@/components/gradient-cdf-chart";
import LazyPolylineMap from "@/components/polyline-map-lazy";
import { Card } from "@/components/ui/card";
import { SelectAspectsDialog } from "@/components/ui/select-aspects-dialog";
import type { Aspect } from "@/pathfinder/index.d.ts";
import type { LineString, Point } from "geojson";
import { useState } from "react";
import { toast } from "sonner";

export default function PathFinderPage() {
  const [markers, setMarkers] = useState<Point[]>([]);
  const [path, setPath] = useState<LineString | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [excludedAspects, setExcludedAspects] = useState<Aspect[]>([]);

  function handleMapClick(point: Point) {
    if (markers.length > 1) {
      setMarkers([point]);
    } else {
      setMarkers([...markers, point]);
    }
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

  return (
    <div className="container mx-auto p-4">
      <div className="flex gap-4 mb-4">
        <FindPathButton
          markers={markers}
          bounds={bounds}
          excludedAspects={excludedAspects}
          disabled={markers.length !== 2 || isLoading}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setPath={setPath}
        />
        <SelectAspectsDialog
          onSelectDirections={setExcludedAspects}
          selectedDirections={excludedAspects}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="aspect-square">
          <LazyPolylineMap
            onMapClick={handleMapClick}
            onMapMove={handleBoundsChange}
            interactive={true}
            markers={markers}
            polyline={path}
          />
        </Card>

        {/* Charts section */}
        <div className="space-y-4">
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
    </div>
  );
}
