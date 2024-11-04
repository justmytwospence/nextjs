"use client";

import { useState } from 'react';
import GradientCdfChart from "@/components/gradient-cdf-chart";
import RouteComparisonColumn from "@/components/route-comparison-column";
import { UserRoute } from "@prisma/client";

export default function RouteComparison({ routes }) {
  const [selectedRoute1, setSelectedRoute1] = useState<UserRoute | null>(null);
  const [selectedRoute2, setSelectedRoute2] = useState<UserRoute | null>(null);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <RouteComparisonColumn
          routes={routes}
          selectedRoute={selectedRoute1}
          setSelectedRoute={setSelectedRoute1}
        />
        <RouteComparisonColumn
          routes={routes}
          selectedRoute={selectedRoute2}
          setSelectedRoute={setSelectedRoute2}
        />
      </div>
      <div className="max-w-7xl mx-auto px-4">
        <GradientCdfChart selectedRoute1={selectedRoute1} selectedRoute2={selectedRoute2} />
      </div>
    </>
  )
}