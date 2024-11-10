import { auth } from "@/auth";
import { queryUserRoute } from "@/lib/db";
import { notFound } from "next/navigation";
import RouteDetail from "./client";

export default async function RoutePage({ params }) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { routeId } = await params

  const route = await queryUserRoute(session.user.id, routeId);
  if (!route) {
    notFound();
  }

  return <RouteDetail mappable={route} />;
}