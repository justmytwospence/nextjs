"use client";

import CourseComparisonColumn from "@/components/course-comparison-column";
import GradientCdfChart from "@/components/gradient-cdf-chart";
import { Card, CardContent } from "@/components/ui/card";
import { baseLogger } from "@/lib/logger";
import type { Mappable, MappableItem } from "@prisma/client";
import { useMemo, useState } from "react";
import { fetchActivity } from "../actions/fetchActivity";
import { fetchRoute } from "../actions/fetchRoute";

export default function RouteComparison({
  routes,
  activities,
}: {
  routes: MappableItem[];
  activities: MappableItem[];
}) {
  const [selectedMap1, setSelectedMap1] = useState<Mappable | null>(null);
  const [selectedMap2, setSelectedMap2] = useState<Mappable | null>(null);

  const selectedMaps = useMemo(() => {
    return [selectedMap1, selectedMap2].filter((map) => map !== null);
  }, [selectedMap1, selectedMap2]);

  function createHandleRouteSelection(setSelectedMapFn) {
		return async function handleRouteSelection(routeId) {
			fetchRoute(routeId).then(setSelectedMapFn);
		};
  }
  
  function createHandleActivitySelection(setSelectedMapFn) {
		return async function handleActivitySelection(routeId) {
			fetchActivity(routeId).then(setSelectedMapFn);
		};
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <CourseComparisonColumn
        routes={routes}
        activities={activities}
        selectedMap={selectedMap1}
        handleRouteSelection={createHandleRouteSelection(setSelectedMap1)}
        handleActivitySelection={createHandleActivitySelection(setSelectedMap1)}
        handle
      />
      <CourseComparisonColumn
        routes={routes}
        activities={activities}
        selectedMap={selectedMap2}
        handleRouteSelection={createHandleRouteSelection(setSelectedMap2)}
        handleActivitySelection={createHandleActivitySelection(setSelectedMap2)}
      />
      {selectedMaps.length > 0 ? (
        <Card className="max-w-7xl mx-auto px-4 h-[500px] w-full lg:col-span-2">
          <CardContent className="h-full">
            <GradientCdfChart mappables={selectedMaps} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
