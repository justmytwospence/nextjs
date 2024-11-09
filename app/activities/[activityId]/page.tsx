import { auth } from "@/auth";
import { queryUserActivity } from "@/lib/db";
import { notFound } from "next/navigation";
import RouteDetail from "./client";

export default async function RoutePage({
  params,
}: {
  params: { routeId: string };
}) {
  const session = await auth();
  if (!session) {
    return null;
  }

  const activity = await queryUserActivity(session.user.id, params.routeId);
  if (!activity) {
    notFound();
  }

  return <RouteDetail route={activity} />;
}