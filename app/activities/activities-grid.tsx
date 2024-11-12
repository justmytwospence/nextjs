
"use client";

import { useState, type ReactNode } from "react";
import LazyMap from "@/components/lazy-map";
import { Navigation, TrendingUp, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MappableActivity } from "@prisma/client";
import {
  Pagination, PaginationContent, PaginationEllipsis, PaginationItem,
  PaginationLink, PaginationNext, PaginationPrevious
} from "@/components/ui/pagination"
import PleaseSync from "@/components/please-sync";

const ACTIVITY_TYPES = {
  "Ride": "Ride",
  "Run": "Run",
} as const;

export default function ActivitiesGrid({ activities }: { activities: MappableActivity[] }) {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const validActivities = activities.filter(activity => activity.summaryPolyline);

  if (validActivities.length === 0) {
    return <PleaseSync />;
  }

  const filteredActivities = selectedType === "all"
    ? validActivities
    : validActivities.filter(activity => activity.type === selectedType);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
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
      <h1 className="text-3xl font-bold mb-6">My Activities</h1>

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
            {Object.values(ACTIVITY_TYPES).map((value) => (
              <TabsTrigger key={value} value={value}>
                {value}
              </TabsTrigger>
            ))}
          </TabsList>

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

        <div className="mt-6">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {paginatedActivities.map((activity) => (
              <Card
                key={activity.id}
                onClick={() => router.push(`/activities/${activity.id}`)}
                className="group hover:shadow-lg transition-all duration-200 rounded-lg overflow-hidden hover:cursor-pointer"
              >
                <div className="relative">
                  <div className="absolute inset-0 z-10">
                    <LazyMap mappable={activity} interactive={false} />
                  </div>
                  <div className="aspect-[16/9]" />
                </div>
                <div className="relative z-20 bg-gradient-to-t from-background to-transparent p-4">
                  <h3 className="text-xl font-semibold line-clamp-1 mb-2">
                    {activity.name}
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span>{(activity.distance / 1609.34).toFixed(1)}mi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{(activity.movingTime / 60).toFixed(0)}m</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span>{activity.totalElevationGain.toFixed(0)}ft</span>
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