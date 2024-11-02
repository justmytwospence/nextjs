import prisma from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth from "next-auth"
import StravaProvider from "next-auth/providers/strava"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  debug: false,
  providers: [
    StravaProvider({
      authorization: {
        params: {
          approval_prompt: "force",
          scope: "read_all,profile:read_all,activity:read_all"
        }
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
    })
  ],
  callbacks: {
    async session({ session, user }) {
      const stravaAccount = await prisma.account.findUnique({
        where: {
          userId_provider: {
            userId: user.id,
            provider: "strava"
          }
        },
      })
      if (stravaAccount.expires_at * 1000 < Date.now()) {
        // If the access token has expired, try to refresh it
        try {
          const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
            method: "POST",
            body: new URLSearchParams({
              client_id: process.env.STRAVA_CLIENT_ID!,
              client_secret: process.env.STRAVA_CLIENT_SECRET!,
              grant_type: "refresh_token",
              refresh_token: stravaAccount.refresh_token,
            }),
          })

          const tokensOrError = await response.json()
          if (!response.ok) throw tokensOrError

          const newTokens = tokensOrError as {
            access_token: string
            refresh_token?: string
            expires_at: number
          }

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
          })
        } catch (error) {
          console.error("Error refreshing access_token", error)
          session.error = "RefreshTokenError"
        }
      }
      return session
    },
  },
})
