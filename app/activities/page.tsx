import { auth } from "@/auth";
import { queryUserActivities } from "@/lib/db";
import ActivitiesClient from "./client";
import { createSessionLogger } from "@/lib/logger";

export default async function ActivitiesPage() {
  const session = await auth();
  if (!session) {
    return null;
  }
  const sessionLogger = createSessionLogger(session);
  const initialActivities = await queryUserActivities(session);
  sessionLogger.info(`Found ${initialActivities.length} activities`);

  return <ActivitiesClient initialActivities={initialActivities} />;
}
