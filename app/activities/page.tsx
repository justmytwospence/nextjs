import { auth } from "@/auth";
import { queryMappableActivities } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { redirect } from "next/navigation";
import ActivitiesGrid from "./activities-grid";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }
  const activities = await queryMappableActivities(session.user.id);
  return <ActivitiesGrid activities={activities} />;
}
