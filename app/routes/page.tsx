"use client";

import { fetchRoutes } from "@/app/actions/fetchRoutes";
import LazyMap from "@/components/lazy-map";
import SyncRoutesButton from "@/components/sync-routes-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Spinner } from "@/components/ui/spinner";
import { baseLogger } from "@/lib/logger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import type { LineString } from "geojson";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
  ChevronDown,
  Navigation,
  TrendingUp,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { type ReactNode, useEffect, useMemo, useState } from "react";

type SortOption = {
  label: string;
  value: string;
  icon: JSX.Element;
};

type SortDirection = "asc" | "desc";

export default function RoutesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Handle unauthenticated state
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("created");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const itemsPerPage = 24;

  const sortOptions: SortOption[] = [
    {
      label: "Created",
      value: "created",
      icon:
        sortDir === "asc" ? (
          <ArrowUpWideNarrow className="h-4 w-4" />
        ) : (
          <ArrowDownWideNarrow className="h-4 w-4" />
        ),
    },
    { label: "Name", value: "name", icon: <ArrowUpDown className="h-4 w-4" /> },
    {
      label: "Distance",
      value: "distance",
      icon: <ArrowUpDown className="h-4 w-4" />,
    },
    {
      label: "Elevation",
      value: "elevation",
      icon: <ArrowUpDown className="h-4 w-4" />,
    },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ["routes", selectedType, currentPage],
    queryFn: () => fetchRoutes(selectedType, currentPage, itemsPerPage),
    placeholderData: (prev) => prev,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });

  const queryClient = useQueryClient();

  const prefetchRoutes = useCallback(
    (type: string, page: number) => {
      baseLogger.info(`Prefetching routes for type ${type} and page ${page}`);
      queryClient.prefetchQuery({
        queryKey: ["routes", type, page],
        queryFn: () => fetchRoutes(type, page, itemsPerPage),
      });
    },
    [queryClient]
  );

  // Sort current page data
  const sortedRoutes = useMemo(() => {
    const routes = data?.routes || [];
    return [...routes].sort((a, b) => {
      const aVal =
        sortBy === "name"
          ? a.name
          : sortBy === "distance"
          ? a.distance
          : sortBy === "elevation"
          ? a.elevationGain
          : sortBy === "created"
          ? new Date(a.createdAt).getTime()
          : a.name;

      const bVal =
        sortBy === "name"
          ? b.name
          : sortBy === "distance"
          ? b.distance
          : sortBy === "elevation"
          ? b.elevationGain
          : sortBy === "created"
          ? new Date(b.createdAt).getTime()
          : b.name;

      if (sortDir === "asc") {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });
  }, [data?.routes, sortBy, sortDir]);

  const totalRoutes = data?.routeCountsTotal || 0;
  const routeCounts = data?.routeCountsByType || {};
  const totalRoutesForType =
    selectedType === "all" ? totalRoutes : routeCounts[selectedType] || 0;
  const totalPages = Math.ceil(totalRoutesForType / itemsPerPage);

  useEffect(() => {
    if (currentPage < totalPages) {
      prefetchRoutes(selectedType, currentPage + 1);
    }
  }, [currentPage, totalPages, selectedType, prefetchRoutes]);

  // Get unique route types from the routeCounts
  const routeTypes = Object.keys(routeCounts);
  const routeTypeLabels = {
    "1": "Ride",
    "2": "Trail Run",
    "4": "Hike",
    "5": "Run",
    "6": "Gravel",
    _all: "All",
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Routes</h1>
        <SyncRoutesButton />
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <Spinner className="h-8 w-8" />
        </div>
      ) : !totalRoutes ? (
        <div className="flex items-center justify-center h-screen">
          <SyncRoutesButton />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="flex space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    {routeTypeLabels[selectedType] || "All"}{" "}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSelectedType("all")}>
                    {routeTypeLabels._all}
                  </DropdownMenuItem>
                  {routeTypes.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => setSelectedType(type)}
                      onMouseEnter={() => prefetchRoutes(type, currentPage)}
                    >
                      {routeTypeLabels[type]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Sort by{" "}
                    {
                      sortOptions.find((option) => option.value === sortBy)
                        ?.label
                    }{" "}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {sortOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setSortDir(sortDir === "asc" ? "desc" : "asc");
                      }}
                    >
                      {option.label} {option.icon}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex justify-end">
              <Pagination>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={`cursor-pointer ${currentPage === 1 ? "disabled-class" : ""}`}
                >
                  Previous
                </PaginationPrevious>
                <PaginationContent>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <PaginationItem
                        key={page}
                        onMouseEnter={() => prefetchRoutes(selectedType, page)}
                        className={page === currentPage ? "active-class" : ""}
                      >
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          className={`${
                            page === currentPage ? "bg-blue-500 text-white" : ""
                          } cursor-pointer`}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                </PaginationContent>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={`cursor-pointer ${currentPage === totalPages ? "disabled-class" : ""}`}
                >
                  Next
                </PaginationNext>
              </Pagination>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sortedRoutes.map((route) => (
              <Link href={`/routes/${route.id}`} key={route.id}>
                <Card className="group hover:shadow-lg transition-all duration-200 rounded-lg overflow-hidden hover:cursor-pointer">
                  <div className="h-48 w-full">
                      <LazyMap
                        polyline={route.summaryPolyline}
                        interactive={false}
                      />
                  </div>
                  <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">{route.name}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {(route.distance / 1609.34).toFixed(1)}mi
                        </span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {Math.round(
                            route.elevationGain * 3.28084
                          ).toLocaleString()}
                          ft
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
