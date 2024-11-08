import { deleteUserAccount, deleteUserActivity, upsertUserActivity } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { WebhookEvent } from "@/schemas/strava-webhook-events";
import { fetchDetailedActivity } from "./strava-api";

export default async function processWebhookEvent(event: WebhookEvent) {
  switch (event.object_type) {
    case "activity":
      switch (event.aspect_type) {
        case "create":
        case "update":
          const detailedActivity = await fetchDetailedActivity(event.owner_id, event.object_id);
          return await upsertUserActivity(event.owner_id, detailedActivity);
        case "delete":
          return await deleteUserActivity(event.owner_id, "strava");
      }
      break;
    case "athlete":
      baseLogger.info(`Received athlete event: ${JSON.stringify(event, null, 2)}`);
      if (event.updates?.authorized === "false") {
        baseLogger.info(`Deauthorizing user with stravaId: ${event.object_id}`);
        try {
          const deletedUser = await deleteUserAccount(event.object_id.toString(), "strava");
          baseLogger.info(`Deleted user and associated data for stravaId: ${event.object_id}`);
        } catch (error) {
          baseLogger.error(`Failed to deauthorize user with stravaId: ${event.object_id}: ${error}`);
        }
      }
      break;
  }
}