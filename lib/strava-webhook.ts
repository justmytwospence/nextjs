import { WebhookEvent } from "@/schemas/strava-webhook-events";
import { prisma } from "@/lib/prisma";
import { baseLogger } from "@/lib/logger";

export default async function processWebhookEvent(event: WebhookEvent) {
  switch (event.object_type) {
    case "activity":
      switch (event.aspect_type) {
        case "create":
          // TODO: Store new activity in database
          break;
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