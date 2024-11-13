"use client";

import GradientCdfChart from "@/components/gradient-cdf-chart";
import RouteComparisonColumn from "@/components/route-comparison-column";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeGradient } from "@/lib/geo";
import { Mappable } from "@prisma/client";
import { useMemo, useState } from "react";

export default function RouteComparison({ mappables }) {
  const [selectedMappable1, setSelectedMappable1] = useState<Mappable | null>(
    null
  );
  const [selectedMappable2, setSelectedMappable2] = useState<Mappable | null>(
    null
  );
  const [hoverIndex1, setHoverIndex1] = useState(-1);
  const [hoverIndex2, setHoverIndex2] = useState(-1);
  const [gradientThreshold, setGradientThreshold] = useState<number | null>(
    null
  );

  const selectedRoutes = [selectedMappable1, selectedMappable2].filter(
    (route): route is Mappable => route !== null
  );

  // Calculate gradients for both routes
  const gradients = useMemo(
    () =>
      selectedRoutes.map((route) =>
        route.polyline ? computeGradient(route.polyline) : []
      ),
    [selectedRoutes]
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <RouteComparisonColumn
            mappables={mappables}
            selectedMappable={selectedMappable1}
            setSelectedMappable={setSelectedMappable1}
            hoverIndex={hoverIndex1}
            onHover={setHoverIndex1}
            gradientThreshold={gradientThreshold}
            gradients={gradients[0] || []}
          />
          <RouteComparisonColumn
            mappables={mappables}
            selectedMappable={selectedMappable2}
            setSelectedMappable={setSelectedMappable2}
            hoverIndex={hoverIndex2}
            onHover={setHoverIndex2}
            gradientThreshold={gradientThreshold}
            gradients={gradients[1] || []}
          />
        </div>
        {selectedRoutes.length > 0 && (
          <Card className="max-w-7xl mx-auto px-4 h-[500px] w-full mt-8">
            <CardContent className="h-full">
              <GradientCdfChart
                routes={selectedRoutes}
                onHoverGradient={setGradientThreshold}
                gradients={gradients}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
