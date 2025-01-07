import { prisma } from "@/lib/prisma";
import { refreshToken } from "@/lib/strava";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { default as NextAuth, type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import StravaProvider from "next-auth/providers/strava";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: false,
  session: {
    strategy: "jwt",
  },
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
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: User }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: any }) {
      session.user.id = token.id;
      await refreshToken(token.id);
      return session;
    },
  },
});
