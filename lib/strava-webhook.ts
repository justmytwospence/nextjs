import { WebhookEvent } from "@/schemas/strava-webhook-events";
import { prisma } from "./prisma";
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
      if (event.updates?.authorized === "false") {
        await prisma.user.delete({
          where: {
            id: String(event.object_id)
          },
          include: {
            accounts: true,
            routes: true,
            segments: true,
          },
        });
        baseLogger.info(`Deleted user and associated data for stravaId: ${event.object_id}`);
      }
      break;
  }
}