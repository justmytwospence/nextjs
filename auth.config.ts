import type { NextAuthConfig } from "next-auth";
import StravaProvider from "next-auth/providers/strava";

// all the configuration that can run in the edge runtime
export default {
  debug: false,
  session: { strategy: "jwt" },
  providers: [
    StravaProvider({
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      authorization: {
        params: {
          approval_prompt: "force",
          scope: "read_all,profile:read_all,activity:read_all",
        },
      },
      profile(profile) {
        return {
          id: String(profile.id),
          name: `${profile.firstname} ${profile.lastname}`,
          email: null, // Strava doesn't return email fields so we need to add them for authjs
          emailVerified: null,
          image: profile.profile,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;
