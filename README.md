# Strava Tools

Advanced route analysis and comparison tools for Strava users. Work in Progress.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Authentication:** NextAuth.js v5
- **Database:** PostgreSQL (Neon) with Prisma ORM
- **Styling:** Tailwind CSS, shadcn/ui
- **Maps:** Leaflet, React Leaflet
- **Charts:** Chart.js, Recharts
- **API Integration:** Strava API
- **Logging:** Winston
- **Type Safety:** TypeScript, Zod

### Branches/Deployment

- **Production**: The `main` branch is automatically deployed to $DOMAIN and migrations are run against the production database.
- **Staging**: The `staging` branch is automatically deployed to the staging.$DOMAIN and migrations are run against the staging database.
