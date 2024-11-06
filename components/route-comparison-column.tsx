"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LazyMap from "@/components/lazy-map";
import { queryUserRouteAction } from "@/app/actions/queryUserRoute";
import ElevationChart from "./elevation-chart";

export default function RouteComparisonColumn({ routes, selectedRoute, setSelectedRoute }) {
  return (
    <div className="space-y-6 p-6 bg-background border rounded-lg">
      <Select onValueChange={async (value) => {
        const fullRoute = await queryUserRouteAction(value);
        setSelectedRoute(fullRoute);
      }}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select Route" />
          <SelectValue>
            {selectedRoute ? selectedRoute.name : "Select Route"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {routes.map((route) => (
            <SelectItem key={route.id} value={route.id}>
              {route.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selectedRoute && (
        <div className="h-[300px] w-full mt-4">
          <LazyMap route={selectedRoute} />
        </div>
      )}

      {selectedRoute && (
        <ElevationChart route={selectedRoute} maxGradient={0.1} />
      )}
    </div>
  );
}

