import type { Session as NextAuthSession } from "next-auth"

declare global {
  interface Session extends NextAuthSession {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    error?: "RefreshTokenError"
  }
}
