import { StravaHttpError } from "./api";
import { baseLogger } from "../logger";

export function withRetry(maxRetries: number = 5, baseDelay: number = 15000) {
  return function <T>(fn: (...args: any[]) => Promise<T>) {
    return async function (...args: any[]): Promise<T> {
      let retryCount = 0;

      const attempt = async (): Promise<T> => {
        try {
          return await fn(...args);
        } catch (error) {
          if (
            !(error instanceof StravaHttpError) ||
            error.status !== 429 ||
            retryCount >= maxRetries
          ) {
            baseLogger.error(
              "Non rate-limit error or max retries exceeded, throwing error..."
            );
            throw error;
          }

          if (!error.rateLimit) {
            baseLogger.error(
              "Rate limit exceeded, but no rate limit headers found"
            );
            throw error;
          }

          if (
            error.rateLimit?.long?.readUsage > error.rateLimit?.long?.readLimit
          ) {
            baseLogger.error(
              "Daily rate limit exceeded, please try again tomorrow"
            );
            throw error;
          }

          const delay = baseDelay * Math.pow(2, retryCount);
          const shortTermUsage = error.rateLimit?.short?.readUsage || 0;
          const shortTermLimit = error.rateLimit?.short?.readLimit || 0;

          baseLogger.warn(
            `Rate limited by Strava, waiting ${delay / 1000
            } seconds before retry ${retryCount + 1}... ` +
            `Short term usage: ${shortTermUsage}/${shortTermLimit}`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          retryCount++;
          return attempt();
        }
      };

      return attempt();
    };
  };
}
