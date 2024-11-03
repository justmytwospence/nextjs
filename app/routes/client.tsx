'use client';

import { useState } from "react";
import LazyMap from "@/components/lazy-map";
import { Navigation, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { StravaRoute } from "@prisma/client";

export default function RoutesClient({ initialRoutes }: { initialRoutes: StravaRoute[] }) {
  const [selectedType, setSelectedType] = useState('all');

  const routeTypes = {
    1: 'Ride',
    2: 'Run',
    5: 'Ride',
  }
  const filteredRoutes = selectedType === 'all'
    ? initialRoutes
    : initialRoutes.filter(route => route.type.toString() === selectedType);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Routes</h1>

      <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {Array.from(new Set(Object.values(routeTypes))).map((label) => {
            const type = Object.keys(routeTypes).find(key => routeTypes[key] === label);
            return (
              <TabsTrigger key={type} value={type}>
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          <RouteGrid routes={filteredRoutes} />
        </div>
      </Tabs>
    </div>
  );
}

function RouteGrid({ routes }: { routes: StravaRoute[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {routes.map((route) => (
        <Card key={route.id} className="hover:shadow-lg transition-shadow rounded-md bg-background">
          <CardHeader>
            <CardTitle className="text-xl font-semibold line-clamp-1">
              {route.name}
            </CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {(route.distance / 1609.344).toFixed(1)} mi
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {Math.round(route.elevationGain * 3.28084).toLocaleString()}ft
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-md">
              <LazyMap route={route} interactive={false} />
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            {new Date(route.createdAt).toLocaleDateString()}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
