
import { HttpError } from "@/lib/errors";
import { baseLogger } from "@/lib/logger";
import { streamManager } from "./stream-utils";

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retryCount = 0
): Promise<T> {
  const MAX_RETRIES = 5;
  const BASE_DELAY = 15000;

  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof HttpError) || error.status !== 429 || retryCount >= MAX_RETRIES) {
      baseLogger.error("Non rate-limit error or max retries exceeded, throwing error...");
      throw error;
    }

    if (!error.rateLimit) {
      baseLogger.error("Rate limit exceeded, but no rate limit headers found");
      throw error;
    }

    baseLogger.info(`Rate limit headers: ${JSON.stringify(error.rateLimit, null, 2)}`);

    if (error.rateLimit?.long?.readUsage > error.rateLimit?.long?.readLimit) {
      baseLogger.error("Daily rate limit exceeded, please try again tomorrow");
      await streamManager.send({
        type: "complete",
        error: "Daily rate limit exceeded, please try again tomorrow"
      });
      throw error;
    }

    const delay = BASE_DELAY * Math.pow(2, retryCount);
    const shortTermUsage = error.rateLimit?.short?.readUsage || 0;
    const shortTermLimit = error.rateLimit?.short?.readLimit || 0;
    baseLogger.warn(`Rate limited by Strava, waiting ${delay / 1000} seconds before retry ${retryCount + 1}... Short term usage: ${shortTermUsage}/${shortTermLimit}`);
    await streamManager.send({
      type: "update_message",
      message: `Rate limited by Strava (${shortTermUsage} / ${shortTermLimit} in the last 15 minutes), waiting ${delay / 1000} seconds before retry ${retryCount + 1}...`,
    });
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(operation, retryCount + 1);
  }
}