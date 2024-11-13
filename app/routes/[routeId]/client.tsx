"use client";

import ElevationChart from "@/components/elevation-chart";
import GradientCdfChart from "@/components/gradient-cdf-chart";
import LazyMap from "@/components/lazy-map";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { computeGradient } from "@/lib/geo";
import { UserRoute } from "@prisma/client";
import { useMemo, useState } from "react";
import { LineString } from "geojson";

export default function RouteDetail({ mappable }: { mappable: UserRoute }) {
  const [hoverIndex, setHoverIndex] = useState(-1);
  const [gradientThreshold, setGradientThreshold] = useState<number | null>(
    null
  );

  const gradients = useMemo(() => {
    if (
      !mappable.polyline ||
      (mappable.polyline as unknown as LineString).type !== "LineString"
    )
      return [];
    return computeGradient(mappable.polyline as unknown as LineString);
  }, [mappable.polyline]);

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Breadcrumb className="text-sm text-muted-foreground" separator="/">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="hover:text-primary">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/routes" className="hover:text-primary">
              Routes
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="text-primary font-semibold">
              {mappable.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold">{mappable.name}</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="w-full">
          <CardContent className="h-full p-0">
            {mappable.polyline && (
              <div className="h-full w-full rounded-lg overflow-hidden">
                <LazyMap
                  mappable={mappable}
                  hoverIndex={hoverIndex}
                  onHover={setHoverIndex}
                  gradientThreshold={gradientThreshold}
                  gradients={gradients}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent>
              <div className="h-[250px] lg:h-[300px]">
                <ElevationChart
                  mappable={mappable}
                  maxGradient={0.1}
                  onHover={setHoverIndex}
                  hoverIndex={hoverIndex}
                  gradients={gradients}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="h-[250px] lg:h-[300px]">
                <GradientCdfChart
                  routes={[mappable]}
                  onHoverGradient={setGradientThreshold}
                  gradients={[gradients]}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
