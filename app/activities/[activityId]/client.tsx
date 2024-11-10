"use client";

import ElevationChart from "@/components/elevation-chart";
import LazyMap from "@/components/lazy-map";
import { UserActivity } from "@prisma/client";
import { Navigation, TrendingUp } from "lucide-react";

export default function RouteDetail({ mappable }: { mappable: UserActivity }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{mappable.name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <span>{(mappable.distance / 1609.344).toFixed(1)} mi</span>
            </div>
            <div className="flex items-center gap-2">
              {/* <TrendingUp className="h-4 w-4 text-muted-foreground" /> */}
              {/* <span>{Math.round(mappable.elevationGain)} ft</span> */}
            </div>
          </div>

          {mappable.polyline && (
            <div className="h-[400px] rounded-lg overflow-hidden">
              <LazyMap mappable={mappable} />
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="h-[200px]">
            <ElevationChart mappable={mappable} maxGradient={0.1} />
          </div>
        </div>
      </div>
    </div>
  );
}