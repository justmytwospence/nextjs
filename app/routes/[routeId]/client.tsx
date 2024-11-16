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
import { UserRoute } from "@prisma/client";

export default function RouteDetail({ mappable }: { mappable: UserRoute }) {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="w-full aspect-square">
          <CardContent className="h-full p-0">
            {mappable.polyline && (
              <div className="h-full w-full rounded-lg overflow-hidden">
                <LazyMap mappable={mappable} />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-rows-2 gap-6">
          <Card className="h-full">
            <CardContent className="h-full">
              <div className="h-full">
                <ElevationChart mappable={mappable} />
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="h-full p-0">
              <div className="h-full">
                <GradientCdfChart mappables={[mappable]} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
