import { prisma } from "@/lib/prisma";
import { refreshToken } from "@/lib/strava";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { default as NextAuth, Session, type DefaultSession } from "next-auth";
import StravaProvider from "next-auth/providers/strava";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: false,
  providers: [
    StravaProvider({
      authorization: {
        params: {
          approval_prompt: "force",
          scope: "read_all,profile:read_all,activity:read_all",
        },
      },
      clientId: process.env.STRAVA_CLIENT_ID,
      clientSecret: process.env.STRAVA_CLIENT_SECRET,
      profile(profile) {
        return {
          id: String(profile.id),
          name: `${profile.firstname} ${profile.lastname}`,
          // Strava doesn't return email fields so we need to add them for authjs
          email: null,
          emailVerified: null,
          image: profile.profile,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }: { session: Session; user: any }) {
      session.user.id = user.id;
      await refreshToken(user.id);
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-authjs.session-token"
        : "authjs.session-token",
    },
  }
});
