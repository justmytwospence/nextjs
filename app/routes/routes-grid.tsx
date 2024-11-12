"use client";

import { useState, type ReactNode } from "react";
import LazyMap from "@/components/lazy-map";
import { Navigation, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRoute } from "@prisma/client";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination"
import PleaseSync from "@/components/please-sync";

const ROUTE_TYPES = {
  "1": "Ride",
  "2": "Trail Run",
  "5": "Run",
} as const;

export default function RoutesGrid({ routes }: { routes: UserRoute[] }) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const validRoutes = routes.filter(route => route.summaryPolyline);

  if (validRoutes.length === 0) {
    return <PleaseSync />;
  }

  const filteredRoutes = selectedType === "all"
    ? validRoutes
    : validRoutes.filter(route => (route.type ?? "").toString() === selectedType);

  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const paginatedRoutes = filteredRoutes.slice(
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
      <h1 className="text-3xl font-bold mb-6">My Routes</h1>

      <Tabs
        value={selectedType}
        onValueChange={(value) => {
          setSelectedType(value);
          setCurrentPage(1);
        }}
        className="mb-6"
      >
        <div className="flex flex-wrap gap-4 mb-4 sm:flex-nowrap sm:justify-between items-center">
          <TabsList className="h-10 w-full sm:w-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            {Array.from(new Set(Object.values(ROUTE_TYPES))).map((label: string) => {
              const value = Object.entries(ROUTE_TYPES).find(([_, v]) => v === label)?.[0] ?? "all";
              return (
                <TabsTrigger key={value} value={value}>
                  {label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="w-full flex justify-center sm:w-auto">
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
            {paginatedRoutes.map((route) => (
              <Card
                key={route.id}
                onClick={() => router.push(`/routes/${route.id}`)}
                className="group hover:shadow-lg transition-all duration-200 rounded-lg overflow-hidden hover:cursor-pointer"
              >
                <div className="relative">
                  <div className="absolute inset-0 z-10">
                    <LazyMap mappable={route} interactive={false} />
                  </div>
                  <div className="aspect-[16/9]" />
                </div>
                <div className="relative z-20 bg-gradient-to-t from-background to-transparent p-4">
                  <h3 className="text-xl font-semibold line-clamp-1 mb-2">
                    {route.name}
                  </h3>
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
                        {Math.round(route.elevationGain * 3.28084).toLocaleString()}ft
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}