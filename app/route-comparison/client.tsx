"use client";

import GradientCdfChart from "@/components/gradient-cdf-chart";
import RouteComparisonColumn from "@/components/route-comparison-column";
import { Card, CardContent } from "@/components/ui/card";
import { baseLogger } from "@/lib/logger";
import type { Mappable, MappableItem } from "@prisma/client";
import { useMemo, useState } from "react";
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

  function createHandleMapSelection(setSelectedMapFn) {
		return async function handleMapSelection(routeId) {
			fetchRoute(routeId).then(setSelectedMapFn);
		};
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RouteComparisonColumn
        routes={routes}
        activities={activities}
        selectedMap={selectedMap1}
        handleMapSelection={createHandleMapSelection(setSelectedMap1)}
      />
      <RouteComparisonColumn
        routes={routes}
        activities={activities}
        selectedMap={selectedMap2}
        handleMapSelection={createHandleMapSelection(setSelectedMap2)}
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
