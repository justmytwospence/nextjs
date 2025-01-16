import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, account, user } ) {
      if (user) {
        token.id = user.id;
      }
      if (account) { // First-time login, save the `access_token`, its expiry and the `refresh_token`
        console.log("First-time login")
        return {
          ...token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          refresh_token: account.refresh_token,
        };
        // biome-ignore lint/style/noUselessElse: <explanation>
      } else if (Date.now() < token.expires_at * 1000) { // Subsequent logins, but the `access_token` is still valid
        console.log("Access token still valid")
        return token;
        // biome-ignore lint/style/noUselessElse: <explanation>
      } else { // Subsequent logins, but the `access_token` has expired, try to refresh it
        console.log("Token expired, refreshing...")
        if (!token.refresh_token) throw new TypeError("Missing refresh_token");

        try {
          const response = await fetch(
            "https://www.strava.com/api/v3/oauth/token",
            {
              method: "POST",
              body: new URLSearchParams({
                client_id: process.env.STRAVA_CLIENT_ID,
                client_secret: process.env.STRAVA_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: token.refresh_token
              }),
            }
          );

          const tokensOrError = await response.json();
          if (!response.ok) throw tokensOrError;
          const newTokens = tokensOrError

          console.log("Successfully refreshed token")

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
    },

    async session({ session, token }) {
      session.error = token.error;
      session.user.id = token.id
      return session;
    },
  },
});