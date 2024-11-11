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

## Environment variables

```
DATABASE_URL=""
STRAVA_CLIENT_ID=""
STRAVA_CLIENT_SECRET=""
AUTH_SECRET="" # Added by `npx auth`. 
STRAVA_WEBHOOK_VERIFY_TOKEN=""
```

## Branches/Deployment

- **Production**: The `main` branch is automatically deployed to $DOMAIN and migrations are run against the production database.
- **Staging**: The `staging` branch is automatically deployed to the staging.$DOMAIN and migrations are run against the staging database.

## TODO
- [X] Set up database
- [X] Implement authentication
- [X] Integrate Strava API for fetching routes
- [X] Add maps using Leaflet and React Leaflet
- [X] Implement logging with Winston
- [X] Ensure type safety with TypeScript and Zod
- [X] Set up deployment pipeline
- [X] Create route comparison tools 
- [X] Implement logic for dealing with Strava rate limits
- [X] Implement webhook for account deletion per API terms
- [X] Refactor functions to take userId instead of session
- [X] Handle rate limiting using the headers from Strava
- [X] Implement webhook for new activites
- [X] Split sync into route and activity 
- [ ] Sync UserSegment and Segment models
- [ ] Increase athlete headcount
- [ ] Reattach to existing syncs
- [ ] Map brushed linking
- [ ] Write unit and integration tests
- [ ] Create segment sniper tool