import {
  deleteActivity,
  deleteUserAccount,
  queryUserAccount,
  upsertDetailedActivity,
} from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { fetchDetailedActivity } from "@/lib/strava";
import type { WebhookEvent } from "@/lib/strava/schemas/strava-webhook-events";

export default async function processWebhookEvent(event: WebhookEvent) {
  switch (event.object_type) {
    case "activity":
      switch (event.aspect_type) {
        case "create":
        case "update":
          const account = await queryUserAccount(event.owner_id, "strava");
          if (account) {
            const { detailedActivity } = await fetchDetailedActivity(
              account.access_token,
              event.object_id
            );
            return await upsertDetailedActivity(
              event.owner_id,
              detailedActivity
            );
          }
        case "delete":
          return await deleteActivity(event.owner_id, "strava");
      }
      break;
    case "athlete":
      baseLogger.info(
        `Received athlete event: ${JSON.stringify(event, null, 2)}`
      );
      if (event.updates?.authorized === "false") {
        baseLogger.info(`Deauthorizing user with stravaId: ${event.object_id}`);
        try {
          const deletedUser = await deleteUserAccount(
            event.object_id.toString(),
            "strava"
          );
          baseLogger.info(
            `Deleted user and associated data for stravaId: ${event.object_id}`
          );
        } catch (error) {
          baseLogger.error(
            `Failed to deauthorize user with stravaId: ${event.object_id}: ${error}`
          );
        }
      }
      break;
  }
}
