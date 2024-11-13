import { auth } from "@/auth";
import { queryMappableActivities } from "@/lib/db";
import ActivitiesGrid from "./activities-grid";
import { baseLogger } from "@/lib/logger";
import { redirect } from "next/navigation";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  const activities = await queryMappableActivities(session.user.id);
  return <ActivitiesGrid activities={activities} />;
}
