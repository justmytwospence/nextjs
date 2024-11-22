import { fetchActivity } from "@/app/actions/fetchActivity";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import ActivityDetail from "./client";

export default async function RoutePage({ params }) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const { activityId } = await params;

  const activity = await fetchActivity(activityId);
  if (!activity) {
    notFound();
  }

  return <ActivityDetail activity={activity} />;
}
