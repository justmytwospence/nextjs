import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type Session, type User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import authConfig from "./auth.config";
import { refreshToken } from "./lib/strava";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
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
