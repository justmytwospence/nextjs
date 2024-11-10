import { auth } from "@/auth";
import { queryUserActivity } from "@/lib/db";
import { notFound } from "next/navigation";
import RouteDetail from "./client";

export default async function RoutePage({ params }) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { activityId } = await params;

  const activity = await queryUserActivity(session.user.id, activityId);
  if (!activity) {
    notFound();
  }

  return <RouteDetail mappable={activity} />;
}