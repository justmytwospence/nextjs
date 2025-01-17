import type { Account } from "next-auth";
import type { JWT } from "next-auth/jwt";

export async function refreshToken(token: JWT): Promise<JWT> {
  if (!token.refresh_token) throw new TypeError("Missing refresh_token");

  try {
    const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
      method: "POST",
      body: new URLSearchParams({
        client_id: process.env.STRAVA_CLIENT_ID ?? '',
        client_secret: process.env.STRAVA_CLIENT_SECRET ?? '',
        grant_type: "refresh_token",
        refresh_token: token.refresh_token,
      }),
    });

    const tokensOrError = await response.json();
    if (!response.ok) throw tokensOrError;
    const newTokens = tokensOrError;

    console.log("New tokens", newTokens);

    return {
      ...token,
      access_token: newTokens.access_token,
      expires_at: Math.floor(Date.now() / 1000 + newTokens.expires_in),
      // Some providers only issue refresh tokens once, so preserve if we did not get a new one
      refresh_token: newTokens.refresh_token
        ? newTokens.refresh_token
        : token.refresh_token,
    };
  } catch (error) {
    console.error("Error refreshing access_token", error);
    // If we fail to refresh the token, return an error so we can handle it on the page
    token.error = "RefreshTokenError";
    return token;
  }
}