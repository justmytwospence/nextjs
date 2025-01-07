"use client";

import findPath from "@/app/actions/findPath";
import type { Bounds } from "@/app/actions/findPath";
import ElevationProfile from "@/components/elevation-chart";
import GradientCDF from "@/components/gradient-cdf-chart";
import LazyPolylineMap from "@/components/polyline-map-lazy";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { baseLogger } from "@/lib/logger";
import type { LineString, Point } from "geojson";
import { Loader } from "lucide-react";
import { useState } from "react";

export default function PathFinderPage() {
  const [markers, setMarkers] = useState<Point[]>([]);
  const [path, setPath] = useState<LineString | null>(null);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  async function handleButtonClick() {
    if (!bounds) return;
    setIsLoading(true);
    const path = await findPath(markers[0], markers[1], bounds);
    setPath(path);
    setIsLoading(false);
  }

  return (
    <div className="container mx-auto p-4">
      <Button
        onClick={handleButtonClick}
        disabled={markers.length !== 2 || isLoading}
        className="mb-4"
      >
        {isLoading ? (
          <>
            Find Path
            <Loader className="animate-spin h-4 w-4 ml-2" />
          </>
        ) : (
          "Find Path"
        )}
      </Button>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Map section - square aspect ratio */}
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
