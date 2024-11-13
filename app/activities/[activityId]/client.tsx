"use client";

import ElevationChart from "@/components/elevation-chart";
import LazyMap from "@/components/lazy-map";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MappableActivity } from "@prisma/client";
import { Navigation, TrendingUp } from "lucide-react";

export default function ActivityDetail({
  activity,
}: {
  activity: MappableActivity;
}) {
  return (
    <div className="container mx-auto p-6">
      <Breadcrumb className="mb-6 text-sm text-muted-foreground" separator="/">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="hover:text-primary">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/activities" className="hover:text-primary">
              Activities
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="#" className="text-primary font-semibold">
              {activity.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6">{activity.name}</h1>

      <p className="mb-6">{activity.description}</p>

      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          <span>{(activity.distance / 1609.344).toFixed(1)} mi</span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span>{Math.round(activity.totalElevationGain)} ft</span>
        </div>
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          <span>{(activity.movingTime / 60).toFixed(0)} min</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(activity.polyline || activity.summaryPolyline) && (
          <div className="h-[400px] lg:h-[600px] rounded-lg overflow-hidden">
            <LazyMap mappable={activity} />
          </div>
        )}

        {activity.polyline && (
          <div className="h-[200px] lg:h-[600px]">
            <ElevationChart mappable={activity} maxGradient={0.1} />
          </div>
        )}
      </div>
    </div>
  );
}
