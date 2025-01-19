import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Account, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import authConfig from "./auth.config";
import { refreshToken } from "./lib/strava";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async jwt({ token, account, user }: { token: JWT; account: Account | null; user: User }) {
      if (user) {
        token.id = user.id;
      }
      if (account) { 
        // First-time login: add the token stuff to the JWT
        token = {
          ...token,
          access_token: account.access_token || token.access_token,
          expires_at: account.expires_at || token.expires_at,
          refresh_token: account.refresh_token || token.refresh_token,
        };
      } else if (Date.now() < token.expires_at * 1000) {
        // Subsequent logins, but the `access_token` is still valid
        return token;
      } else {
        return refreshToken(token);
      }
      return token;
    },

    async session({ session, token }) {
      session.access_token = token.access_token;
      session.error = token.error;
      session.user.id = token.id;
      return session;
    },
  },
});