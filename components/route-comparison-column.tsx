'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LazyMap from "@/components/lazy-map";
import { StravaRoute } from "@prisma/client";
import { queryRouteAction } from "@/app/actions/queryRoute";
import ElevationChart from './elevation-chart';

export default function RouteComparisonColumn({ routes }) {
  const [selectedRoute, setSelectedRoute] = useState<StravaRoute | null>(null);

  return (
    <div className="space-y-6 p-6 bg-background border rounded-lg">
      <h2 className="text-2xl font-semibold tracking-tight">Select a Route</h2>

      <Select onValueChange={async (value) => {
        const fullRoute = await queryRouteAction(value);
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

