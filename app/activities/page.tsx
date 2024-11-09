import { auth } from "@/auth";
import { queryUserActivities } from "@/lib/db";
import MappablesGrid from "@/components/mappables-grid";
import { baseLogger } from "@/lib/logger";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const activities = await queryUserActivities(session.user.id);
  return <MappablesGrid mappables={activities} type="activities" />;
}
