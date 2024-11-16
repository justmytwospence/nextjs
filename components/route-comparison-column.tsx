"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LazyMap from "@/components/lazy-map";
import { queryUserRouteAction } from "@/app/actions/queryUserRoute";
import { queryActivityAction } from "@/app/actions/queryActivity";
import ElevationChart from "@/components/elevation-chart";
import { Mappable } from "@prisma/client";
import { useMemo } from "react";
import { createHoverIndexStore, createGradientStore } from "@/store";

export default function RouteComparisonColumn({
  mappables,
  selectedMappable,
  setSelectedMappable,
}: {
  mappables: { id: string; name: string; type: string }[];
  selectedMappable: Mappable | null;
  setSelectedMappable: (mappable: Mappable | null) => void;
}) {
  const routes = mappables.filter((m) => m.type === "route");
  const activities = mappables.filter((m) => m.type === "activity");

  const hoverIndexStore = useMemo(() => createHoverIndexStore(), []);

  return (
    <div className="space-y-6 p-6 bg-background border rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Select Route</label>
          <Select
            onValueChange={async (value) => {
              const fullMappable = await queryUserRouteAction(value);
              setSelectedMappable(fullMappable);
            }}
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
          <label className="text-sm font-medium mb-2 block">
            Select Activity
          </label>
          <Select
            onValueChange={async (value) => {
              const fullMappable = await queryActivityAction(value);
              setSelectedMappable(fullMappable);
            }}
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

      {selectedMappable && (
        <div className="h-[300px] w-full mt-4">
          <LazyMap
            mappable={selectedMappable}
            hoverIndexStore={hoverIndexStore}
          />
        </div>
      )}

      {selectedMappable && (
        <div className="h-[400px] w-full">
          <ElevationChart
            mappable={selectedMappable}
            hoverIndexStore={hoverIndexStore}
          />
        </div>
      )}
    </div>
  );
}
