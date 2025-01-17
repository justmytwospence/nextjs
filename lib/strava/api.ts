import { queryUserAccount } from "@/lib/db";
import { baseLogger } from "@/lib/logger";

export interface RateLimit {
  short: {
    usage: number;
    limit: number;
    readUsage: number;
    readLimit: number;
  };
  long: {
    usage: number;
    limit: number;
    readUsage: number;
    readLimit: number;
  };
}

export class StravaHttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public rateLimit?: RateLimit
  ) {
    super(message);
    this.name = "StravaHttpError";
  }
}

/**
 * Makes an authenticated request to the Strava API
 * @private
 */
export async function makeStravaRequest(
  access_token: string,
  endpoint: string,
  params: URLSearchParams = new URLSearchParams()
): Promise<Response> {
  const url = new URL(`https://www.strava.com/api/v3${endpoint}`);
  params.forEach((value, key) => url.searchParams.append(key, value));

  baseLogger.info(`Fetching from URL: ${url.toString()}`);
  baseLogger.debug(`Access token: ${access_token}`);
  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  if (response.status === 429) {
    const rateLimit: RateLimit = {
      short: {
        usage: Number(response.headers.get("X-RateLimit-Usage")?.split(",")[0]),
        limit: Number(response.headers.get("X-RateLimit-Limit")?.split(",")[0]),
        readUsage: Number(
          response.headers.get("X-ReadRateLimit-Usage")?.split(",")[0]
        ),
        readLimit: Number(
          response.headers.get("X-ReadRateLimit-Limit")?.split(",")[0]
        ),
      },
      long: {
        usage: Number(response.headers.get("X-RateLimit-Usage")?.split(",")[1]),
        limit: Number(response.headers.get("X-RateLimit-Limit")?.split(",")[1]),
        readUsage: Number(
          response.headers.get("X-ReadRateLimit-Usage")?.split(",")[1]
        ),
        readLimit: Number(
          response.headers.get("X-ReadRateLimit-Limit")?.split(",")[1]
        ),
      },
    };

    let errorMessage: string;
    if (rateLimit.long.readUsage > rateLimit.long.readLimit) {
      errorMessage = `Daily rate limit exceeded: ${rateLimit.long.readUsage}/${rateLimit.long.readLimit}`;
    } else if (rateLimit.short.readUsage > rateLimit.short.readLimit) {
      errorMessage = `Rate limit exceeded: ${rateLimit.short.readUsage}/${rateLimit.short.readLimit}`;
    } else {
      errorMessage = response.statusText;
    }
    baseLogger.error(errorMessage);
    throw new StravaHttpError(429, errorMessage, rateLimit);
  }

  if (!response.ok) {
    baseLogger.error(`${response.status} ${response.statusText}`);
    throw new StravaHttpError(response.status, response.statusText);
  }

  return response;
}