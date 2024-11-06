"use client";

import { useState, type ReactNode } from "react";
import LazyMap from "@/components/lazy-map";
import { Navigation, TrendingUp, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { UserActivity } from "@prisma/client";
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

export default function ActivitiesClient({ initialActivities }: { initialActivities: UserActivity[] }) {
  const [selectedType, setSelectedType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const activityTypes: { [key: string]: string } = {
    "Ride": "Ride",
    "Run": "Run",
  }

  if (initialActivities.length === 0) {
    return (<PleaseSync />)
  }

  const filteredActivities = selectedType === "all"
    ? initialActivities
    : initialActivities.filter(activity => activity.type === selectedType);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
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
            {Object.values(activityTypes).map((type) => (
              <TabsTrigger key={type} value={type}>
                {type}
              </TabsTrigger>
            ))}
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
          <ActivityGrid activities={paginatedActivities} />
        </div>
      </Tabs>
    </div>
  );
}

function ActivityGrid({ activities }: { activities: UserActivity[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {activities.map((activity) => (
        <Card key={activity.id} className="hover:shadow-lg transition-shadow rounded-md bg-background">
          <CardHeader>
            <CardTitle className="text-xl font-semibold line-clamp-1">
              {activity.name}
            </CardTitle>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {(activity.distance / 1609.344).toFixed(1)} mi
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {Math.floor(activity.movingTime / 3600)}h {Math.floor((activity.movingTime % 3600) / 60)}m
                </span>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {Math.round(activity.totalElevationGain * 3.28084).toLocaleString()}ft
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-md">
              <LazyMap route={activity} interactive={false} />
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            {new Date(activity.startDateLocal).toLocaleDateString()}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
