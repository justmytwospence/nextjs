'use client';

import { useState, type ReactNode } from "react";
import LazyMap from "@/components/lazy-map";
import { Navigation, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserRoute } from "@prisma/client";
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

export default function RoutesClient({ initialRoutes }: { initialRoutes: UserRoute[] }) {
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const routeTypes: { [key: string]: string } = {
    1: 'Ride',
    2: 'Trail Run',
    5: 'Run',
  }

  if (initialRoutes.length === 0) {
    return (<PleaseSync />)
  }

  const filteredRoutes = selectedType === 'all'
    ? initialRoutes
    : initialRoutes.filter(route => (route.type ?? '').toString() === selectedType);

  const totalPages = Math.ceil(filteredRoutes.length / itemsPerPage);
  const paginatedRoutes = filteredRoutes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const generatePaginationItems = (): ReactNode[] => {
    const items: ReactNode[] = [];
    const maxVisible = 10;
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    for (let i = startPage; i <= endPage; i++) {
      items.push(
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
      items.unshift(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    return items;
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
        <div className="flex justify-between items-center mb-4">
          <TabsList className="h-10">
            <TabsTrigger value="all">All</TabsTrigger>
            {Array.from(new Set(Object.values(routeTypes))).map((label: string) => {
              const type = Object.keys(routeTypes).find(key => routeTypes[key] === label) ?? 'all';
              return (
                <TabsTrigger key={type} value={type}>
                  {label}
                </TabsTrigger>
              );
            })}
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
          <RouteGrid routes={paginatedRoutes} />
        </div>
      </Tabs>
    </div>
  );
}

function RouteGrid({ routes }: { routes: UserRoute[] }) {
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
