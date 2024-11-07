import { auth } from "@/auth";
import { queryUserActivities } from "@/lib/db";
import ActivitiesClient from "./client";
import { baseLogger } from "@/lib/logger";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const initialActivities = await queryUserActivities(session.user.id);
  baseLogger.info(`Found ${initialActivities.length} activities`);

  return <ActivitiesClient initialActivities={initialActivities} />;
}
