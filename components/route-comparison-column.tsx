"use client";

import ElevationChart from "@/components/elevation-chart";
import LazyMap from "@/components/lazy-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createHoverIndexStore } from "@/store";
import type { Mappable, MappableItem } from "@prisma/client";
import { useMemo } from "react";

export default function RouteComparisonColumn({
  routes,
  activities,
  selectedMap,
  handleMapSelection,
}: {
  routes: MappableItem[];
  activities: MappableItem[];
  selectedMap: Mappable | null;
  handleMapSelection: (value: string) => void;
}) {
  const hoverIndexStore = useMemo(() => createHoverIndexStore(), []);

  return (
    <div className="space-y-6 p-6 bg-background border rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="route-select" className="text-sm font-medium mb-2 block">Select Route</label>
          <Select
            onValueChange={handleMapSelection}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a route" />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="activity-select" className="text-sm font-medium mb-2 block">
            Select Activity
          </label>
          <Select
            onValueChange={handleMapSelection}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose an activity" />
            </SelectTrigger>
            <SelectContent>
              {activities.map((activity) => (
                <SelectItem key={activity.id} value={activity.id}>
                  {activity.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedMap && (
        <div className="h-[300px] w-full mt-4">
          <LazyMap
            polyline={selectedMap.polyline}
            hoverIndexStore={hoverIndexStore}
          />
        </div>
      )}

      {selectedMap && (
        <div className="h-[400px] w-full">
          <ElevationChart
            polyline={selectedMap.polyline}
            hoverIndexStore={hoverIndexStore}
          />
        </div>
      )}
    </div>
  );
}
