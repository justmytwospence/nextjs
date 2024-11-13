"use client";

import GradientCdfChart from "@/components/gradient-cdf-chart";
import RouteComparisonColumn from "@/components/route-comparison-column";
import { Mappable } from "@prisma/client";
import { useState } from "react";

export default function RouteComparison({ mappables }) {
  const [selectedMappable1, setSelectedMappable1] = useState<Mappable | null>(
    null
  );
  const [selectedMappable2, setSelectedMappable2] = useState<Mappable | null>(
    null
  );

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
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
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <div className="h-[400px] w-full">
          <GradientCdfChart
            selectedRoute1={selectedMappable1}
            selectedRoute2={selectedMappable2}
          />
        </div>
      </div>
    </>
  );
}
