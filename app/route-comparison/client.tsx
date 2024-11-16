"use client";

import GradientCdfChart from "@/components/gradient-cdf-chart";
import RouteComparisonColumn from "@/components/route-comparison-column";
import { Card, CardContent } from "@/components/ui/card";
import { Mappable } from "@prisma/client";
import { useMemo, useState } from "react";

export default function RouteComparison({ mappables }) {
  const [selectedMappable1, setSelectedMappable1] = useState<Mappable | null>(
    null
  );
  const [selectedMappable2, setSelectedMappable2] = useState<Mappable | null>(
    null
  );

  const selectedRoutes = useMemo(
    () =>
      [selectedMappable1, selectedMappable2].filter(
        (route): route is Mappable => route !== null
      ),
    [selectedMappable1, selectedMappable2]
  );

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
        <Card className="max-w-7xl mx-auto px-4 h-[500px] w-full lg:col-span-2">
          <CardContent className="h-full">
            <GradientCdfChart mappables={selectedRoutes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
