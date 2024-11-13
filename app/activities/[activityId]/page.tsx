import { auth } from "@/auth";
import { queryActivity } from "@/lib/db";
import { notFound } from "next/navigation";
import ActivityDetail from "./client";

export default async function RoutePage({ params }) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { activityId } = await params;

  const activity = await queryActivity(session.user.id, activityId);
  if (!activity) {
    notFound();
  }

  return <ActivityDetail activity={activity} />;
}
