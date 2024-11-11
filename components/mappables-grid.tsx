"use client";

import { useState, type ReactNode } from "react";
import LazyMap from "@/components/lazy-map";
import { Navigation, TrendingUp, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRoute, UserActivity } from "@prisma/client";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import PleaseSync from "@/components/please-sync";

type Mappable = UserRoute | UserActivity;

interface MappablesGridProps {
  mappables: Mappable[];
  type: "routes" | "activities";
}

export default function MappablesGrid({ mappables, type }: MappablesGridProps) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const typeConfig = {
    routes: {
      title: "My Routes",
      types: {
        "1": "Ride",
        "2": "Trail Run",
        "5": "Run",
      },
      getType: (item: UserRoute) => (item.type ?? "").toString(),
    },
    activities: {
      title: "My Activities",
      types: {
        "Ride": "Ride",
        "Run": "Run",
      },
      getType: (item: UserActivity) => item.type,
    }
  };

  const config = typeConfig[type];

  // Add a safety filter for items with summaryPolyline
  const validMappables = mappables.filter(item => item.summaryPolyline);

  if (validMappables.length === 0) {
    return (<PleaseSync />);
  }

  const filteredItems = selectedType === "all"
    ? validMappables
    : validMappables.filter(item => {
      const itemType = type === "routes"
        ? typeConfig.routes.getType(item as UserRoute)
        : typeConfig.activities.getType(item as UserActivity);
      return itemType === selectedType;
    });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePaginationItems = (): ReactNode[] => {
    const mappables: ReactNode[] = [];
    const maxVisible = 10;
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    for (let i = startPage; i <= endPage; i++) {
      mappables.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentPage(i);
            }}
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (startPage > 1) {
      mappables.unshift(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      mappables.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    return mappables;
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{config.title}</h1>

      <Tabs
        value={selectedType}
        onValueChange={(value) => {
          setSelectedType(value);
          setCurrentPage(1);
        }}
        className="mb-6"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="h-10">
            <TabsTrigger value="all">All</TabsTrigger>
            {type === "routes"
              ? Array.from(new Set(Object.values(config.types))).map((label: string) => {
                const value = Object.keys(config.types).find(key => config.types[key] === label) ?? "all";
                return (
                  <TabsTrigger key={value} value={value}>
                    {label}
                  </TabsTrigger>
                );
              })
              : Object.values(config.types).map((value) => (
                <TabsTrigger key={value} value={value}>
                  {value}
                </TabsTrigger>
              ))
            }
          </TabsList>

          <div className="ml-auto">
            <Pagination>
              <PaginationContent className="flex items-center">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(p => Math.max(1, p - 1));
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {generatePaginationItems()}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(p => Math.min(totalPages, p + 1));
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>

        <div className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {paginatedItems.map((item) => {
              const isRoute = "elevationGain" in item;
              return (
                <Card
                  key={item.id}
                  onClick={() => {
                    switch (type) {
                      case "routes":
                        router.push(`/routes/${item.id}`);
                        break;
                      case "activities":
                        router.push(`/activities/${item.id}`);
                        break;
                    }
                  }}
                  className="group hover:shadow-lg transition-all duration-200 rounded-lg overflow-hidden hover:cursor-pointer"
                >
                  <div className="relative">
                    <div className="absolute inset-0 z-10">
                      <LazyMap mappable={item} interactive={false} />
                    </div>
                    <div className="aspect-[16/9]" />
                  </div>
                  <div className="relative z-20 bg-gradient-to-t from-background to-transparent p-4">
                    <h3 className="text-xl font-semibold line-clamp-1 mb-2">
                      {item.name}
                    </h3>
                    <div className={`grid ${isRoute ? "grid-cols-2" : "grid-cols-3"} gap-2`}>
                      <div className="flex items-center gap-2">
                        <Navigation className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {(item.distance / 1609.344).toFixed(1)} mi
                        </span>
                      </div>
                      {!isRoute && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {Math.floor((item as UserActivity).movingTime / 3600)}h {Math.floor(((item as UserActivity).movingTime % 3600) / 60)}m
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 justify-end">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {Math.round((isRoute ? item.elevationGain : item.totalElevationGain) * 3.28084).toLocaleString()}ft
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
