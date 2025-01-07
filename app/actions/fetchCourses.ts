"use server";

import { auth } from "@/auth";
import {
  queryActivityCountsByType,
  queryMappableActivities,
  queryRouteCountsByType,
  queryRoutes,
} from "@/lib/db";
import { toCourse } from "@/types/transformers";
import type { Course } from "@prisma/client";

type CourseType = "routes" | "activities";

export async function fetchCourses(
  courseType: CourseType,
  filterType?: string,
  page = 1,
  perPage = 24
): Promise<{
  courses: Course[];
  countsTotal: number;
  countsByType: Record<string, number>;
}> {
  const session = await auth();
  if (!session) throw new Error("Not authenticated");

  switch (courseType) {
    case "routes": {
      const routes = await queryRoutes(
        session.user.id,
        page,
        perPage,
        filterType
      );
      const routeCountsByType = await queryRouteCountsByType(session.user.id);
      const routeCountsTotal = Object.values(routeCountsByType).reduce(
        (acc, count) => acc + count,
        0
      );

      return {
        courses: routes.map(toCourse),
        countsByType: routeCountsByType,
        countsTotal: routeCountsTotal,
      };
    }

    case "activities": {
      const activities = await queryMappableActivities(
        session.user.id,
        page,
        perPage,
        filterType
      );
      const activityCountsByType = await queryActivityCountsByType(
        session.user.id,
        true
      );
      const activityCountsTotal = Object.values(activityCountsByType).reduce(
        (acc, count) => acc + count,
        0
      );

      return {
        courses: activities.map(toCourse),
        countsByType: activityCountsByType,
        countsTotal: activityCountsTotal,
      };
    }

    default:
      throw new Error("Invalid course type");
  }
}
