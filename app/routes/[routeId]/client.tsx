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
import { Card, CardContent } from "@/components/ui/card";
import type { EnrichedRoute, Route } from "@prisma/client";

export default function RouteDetail({ route }: { route: EnrichedRoute }) {
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
              {route.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold">{route.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="w-full aspect-[2/1] lg:aspect-square">
          <CardContent className="h-full p-0">
            {route.polyline && (
              <div className="h-full w-full rounded-lg overflow-hidden">
                <LazyMap polyline={route.polyline} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-rows-2 gap-6">
          <Card className="h-[350px] lg:h-full">
            <CardContent className="h-full">
              <div className="h-full">
                <ElevationChart polyline={route.polyline} />
              </div>
            </CardContent>
          </Card>

          <Card className="h-[350px] lg:h-full">
            <CardContent className="h-full p-0">
              <div className="h-full">
                <GradientCdfChart mappables={[route]} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
