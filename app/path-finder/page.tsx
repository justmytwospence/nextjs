"use client";

import findPath from "@/app/actions/findPath";
import LazyPathfindMap from "@/components/pathfind-map-lazy";
import type { Point } from "geojson";
import { useState } from "react";

export default function PathFinderPage() {
  const [markers, setMarkers] = useState<Point[]>([]);

  const handleMapClick = async (point: Point) => {
    const newMarkers = [...markers, point];
    setMarkers(newMarkers);

    if (newMarkers.length === 2) {
      const route = await findPath(newMarkers[0], newMarkers[1]);
    }
  };

  return (
    <div className="w-full h-[500px]">
      <LazyPathfindMap onMapClick={handleMapClick} markers={markers} />
    </div>
  );
}
