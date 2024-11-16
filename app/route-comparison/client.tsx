"use client";

import GradientCdfChart from "@/components/gradient-cdf-chart";
import RouteComparisonColumn from "@/components/route-comparison-column";
import { Card, CardContent } from "@/components/ui/card";
import { computeGradient } from "@/lib/geo";
import { Mappable } from "@prisma/client";
import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/store";

export default function RouteComparison({ mappables }) {
  const [selectedMappable1, setSelectedMappable1] = useState<Mappable | null>(
    null
  );
  const [selectedMappable2, setSelectedMappable2] = useState<Mappable | null>(
    null
  );
  const { setGradients } = useStore();

  const selectedRoutes = useMemo(
    () =>
      [selectedMappable1, selectedMappable2].filter(
        (route): route is Mappable => route !== null
      ),
    [selectedMappable1, selectedMappable2]
  );

  const computedGradients = useMemo(
    () =>
      selectedRoutes.map((route) =>
        route.polyline ? computeGradient(route.polyline) : []
      ),
    [selectedRoutes]
  );

  // Only update gradients when computedGradients actually changes
  useEffect(() => {
    setGradients(computedGradients);
  }, [computedGradients]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <RouteComparisonColumn
        mappables={mappables}
        selectedMappable={selectedMappable1}
        setSelectedMappable={setSelectedMappable1}
      />
      <RouteComparisonColumn
        mappables={mappables}
        selectedMappable={selectedMappable2}
        setSelectedMappable={setSelectedMappable2}
      />
      {selectedRoutes.length > 0 && (
        <Card className="max-w-7xl mx-auto px-4 h-[500px] w-full">
          <CardContent className="h-full">
            <GradientCdfChart routes={selectedRoutes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
