import { WebhookEvent } from "@/schemas/strava-webhook-events";
import { prisma } from "@/lib/prisma";
import { baseLogger } from "@/lib/logger";
import { fetchDetailedActivity } from "./strava-api";
import { upsertUserActivity } from "@/lib/db";

export default async function processWebhookEvent(event: WebhookEvent) {
  switch (event.object_type) {
    case "activity":
      switch (event.aspect_type) {
        case "create":
          const account = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: "strava",
                providerAccountId: String(event.owner_id),
              },
            }
          })
          const detailedActivity = await fetchDetailedActivity(event.owner_id, event.object_id);
          return await upsertUserActivity(event.owner_id, detailedActivity);
        case "update":
          // TODO: Update activity in database
          break;
        case "delete":
          // TODO: Remove activity from database
          break;
      }
      break;
    case "athlete":
      baseLogger.info(`Received athlete event: ${JSON.stringify(event, null, 2)}`);
      if (event.updates?.authorized === "false") {
        baseLogger.info(`Deauthorizing user with stravaId: ${event.object_id}`);
        try {
          const deletedUser = await prisma.account.delete({
            where: {
              provider_providerAccountId: {
                provider: "strava",
                providerAccountId: String(event.object_id),
              },
            }
          });
          baseLogger.info(`Deleted user and associated data for stravaId: ${event.object_id}`);
        } catch (error) {
          baseLogger.error(`Failed to deauthorize user with stravaId: ${event.object_id}: ${error}`);
        }
      }
      break;
  }
}