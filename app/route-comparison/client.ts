'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { LazyMap } from "@/components/lazy-map";
import ElevationChart from "@/components/elevation-chart";

export default function RouteComparisonClient({ routes, routeFetcher }) {
  const [selectedRoute1, setSelectedRoute1] = useState(null);
  const [selectedRoute2, setSelectedRoute2] = useState(null);
  const [route1, setRoute1] = useState(null);
  const [route2, setRoute2] = useState(null);
  const [isLoading1, setIsLoading1] = useState(false);
  const [isLoading2, setIsLoading2] = useState(false);

  useEffect(() => {
    async function fetchRoute() {
      if (selectedRoute1) {
        setIsLoading1(true);
        try {
          const data = await routeFetcher(selectedRoute1.id);
          setRoute1(data);
        } catch (error) {
          console.error('Error fetching route 1:', error);
        }
        setIsLoading1(false);
      }
    }
    fetchRoute();
  }, [selectedRoute1, routeFetcher]);

  useEffect(() => {
    async function fetchRoute() {
      if (selectedRoute2) {
        setIsLoading2(true);
        try {
          const data = await routeFetcher(selectedRoute2.id);
          setRoute2(data);
        } catch (error) {
          console.error('Error fetching route 2:', error);
        }
        setIsLoading2(false);
      }
    }
    fetchRoute();
  }, [selectedRoute2, routeFetcher]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6">
      {[
        { selected: selectedRoute1, setSelected: setSelectedRoute1, details: route1, isLoading: isLoading1, title: "Route 1" },
        { selected: selectedRoute2, setSelected: setSelectedRoute2, details: route2, isLoading: isLoading2, title: "Route 2" }
      ].map((column, i) => (
        <div key={i} className="space-y-6 p-6 bg-background border rounded-lg">
          <h2 className="text-2xl font-semibold tracking-tight">{column.title}</h2>

          <Select onValueChange={(value) => column.setSelected(routes.find(r => r.id === value))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select Route">
                {column.selected?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {column.selected && (
            <>
              <Separator className="my-4" />
              <div className="rounded-lg bg-muted/50 p-4 space-y-4">
                <h3 className="font-medium mb-2">{column.selected.name}</h3>
                {column.isLoading ? (
                  <div className="h-[300px] w-full flex items-center justify-center bg-muted">
                    <Spinner className="h-8 w-8 text-muted-foreground" />
                  </div>
                ) : column.details && (
                  <>
                    <div className="h-[300px] w-full">
                      <LazyMap stravaRoute={column.details} />
                    </div>
                    <div className="h-[200px] w-full">
                      <ElevationChart
                        stravaRoute={column.details}
                        maxGradient={0.1}
                      />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
