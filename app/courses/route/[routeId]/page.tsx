import { fetchRoute } from "@/app/actions/fetchRoute";
import { auth } from "@/auth";
import { toCourse } from "@/types/transformers";
import { notFound } from "next/navigation";
import CourseDetail from "../../course-detail";

export default async function RoutePage({ params }) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { routeId } = await params;

  const enrichedRoute = await fetchRoute(routeId);

  if (!enrichedRoute) {
    notFound();
  }

  const enrichedCourse = toCourse(enrichedRoute);

  return <CourseDetail course={enrichedCourse} />;
}
