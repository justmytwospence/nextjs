"use client";

import ElevationChart from "@/components/elevation-chart";
import LazyMap from "@/components/lazy-map";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { Activity, MappableActivity } from "@prisma/client";
import { Navigation, TrendingUp } from "lucide-react";

export default function ActivityDetail({
  activity,
}: {
  activity: Activity;
}) {

  if (!("polyline" in activity)) {
    return null;
  }
  const mappableActivity = activity as MappableActivity;

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
              {mappableActivity.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-3xl font-bold mb-6">{mappableActivity.name}</h1>

      <p className="mb-6">{mappableActivity.description}</p>

      <div className="flex items-center gap-4 mb-8">
        {mappableActivity.distance !== null && (
          <div className="flex items-center gap-2">
            <Navigation className="h-4 w-4 text-muted-foreground" />
            <span>{(mappableActivity.distance / 1609.344).toFixed(1)} mi</span>
          </div>
        )}
        {mappableActivity.totalElevationGain !== null && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span>{Math.round(mappableActivity.totalElevationGain)} ft</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          <span>{(mappableActivity.movingTime / 60).toFixed(0)} min</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {(mappableActivity.polyline || mappableActivity.summaryPolyline) && (
          <div className="h-[400px] lg:h-[600px] rounded-lg overflow-hidden">
            <LazyMap polyline={mappableActivity.polyline} />
          </div>
        )}

        {mappableActivity.polyline && (
          <div className="h-[200px] lg:h-[600px]">
            <ElevationChart polyline={mappableActivity.polyline} />
          </div>
        )}
      </div>
    </div>
  );
}
