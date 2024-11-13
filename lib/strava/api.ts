
import { queryUserAccount } from "@/lib/db";
import { HttpError, type RateLimit } from "@/lib/errors";
import { baseLogger } from "@/lib/logger";

/**
 * Makes an authenticated request to the Strava API
 * @private
 */
export async function makeStravaRequest(
  userId: string,
  endpoint: string,
  params: URLSearchParams = new URLSearchParams()
): Promise<Response> {
  const userAccount = await queryUserAccount(userId, "strava");

  if (!userAccount?.access_token) {
    baseLogger.error("No Strava access token found");
    throw new Error("No Strava access token found");
  }

  const url = new URL(`https://www.strava.com/api/v3${endpoint}`);
  params.forEach((value, key) => url.searchParams.append(key, value));

  baseLogger.info(`Fetching from URL: ${url.toString()}`);
  const response = await fetch(url.toString(), {
    headers: { "Authorization": `Bearer ${userAccount.access_token}` }
  });

  if (response.status === 429) {
    const rateLimit: RateLimit = {
      short: {
        usage: Number(response.headers.get("X-RateLimit-Usage")?.split(",")[0]),
        limit: Number(response.headers.get("X-RateLimit-Limit")?.split(",")[0]),
        readUsage: Number(response.headers.get("X-ReadRateLimit-Usage")?.split(",")[0]),
        readLimit: Number(response.headers.get("X-ReadRateLimit-Limit")?.split(",")[0])
      },
      long: {
        usage: Number(response.headers.get("X-RateLimit-Usage")?.split(",")[1]),
        limit: Number(response.headers.get("X-RateLimit-Limit")?.split(",")[1]),
        readUsage: Number(response.headers.get("X-ReadRateLimit-Usage")?.split(",")[1]),
        readLimit: Number(response.headers.get("X-ReadRateLimit-Limit")?.split(",")[1])
      }
    };

    throw new HttpError(429, "Rate limit exceeded", rateLimit);
  }

  if (!response.ok) {
    baseLogger.error(`${response.status} ${response.statusText}`);
    throw new HttpError(response.status, response.statusText);
  }

  return response;
}