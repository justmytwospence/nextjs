import { queryUserAccount } from "@/lib/db";
import { baseLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";

export async function refreshToken(userId: string) {
  const stravaAccount = await queryUserAccount(userId, "strava");
  if (!stravaAccount || !stravaAccount.expires_at) {
    baseLogger.error(`No Strava account found for user ${userId}`);
    throw new Error("No Strava account found");
  }

  if (stravaAccount.expires_at * 1000 < Date.now()) {
    try {
      if (!stravaAccount.refresh_token) {
        return;
      }

      const response = await fetch(
        "https://www.strava.com/api/v3/oauth/token",
        {
          method: "POST",
          body: new URLSearchParams({
            client_id: process.env.STRAVA_CLIENT_ID!,
            client_secret: process.env.STRAVA_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: stravaAccount.refresh_token,
          }),
        }
      );

      const tokensOrError = await response.json();
      if (!response.ok) {
        throw tokensOrError;
      }

      const newTokens = tokensOrError as {
        access_token: string;
        refresh_token?: string;
        expires_at: number;
      };

      await prisma.account.update({
        data: {
          access_token: newTokens.access_token,
          expires_at: newTokens.expires_at,
          refresh_token: newTokens.refresh_token ?? stravaAccount.refresh_token,
        },
        where: {
          provider_providerAccountId: {
            provider: "strava",
            providerAccountId: stravaAccount.providerAccountId,
          },
        },
      });
    } catch (error) {
      return;
    }
  }
  return;
}