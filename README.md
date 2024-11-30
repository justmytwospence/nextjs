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

- [x] Set up database
- [x] Implement authentication
- [x] Integrate Strava API for fetching routes
- [x] Add maps using Leaflet and React Leaflet
- [x] Implement logging with Winston
- [x] Ensure type safety with TypeScript and Zod
- [x] Set up deployment pipeline
- [x] Create route comparison tools
- [x] Implement logic for dealing with Strava rate limits
- [x] Implement webhook for account deletion per API terms
- [x] Refactor functions to take userId instead of session
- [x] Handle rate limiting using the headers from Strava
- [x] Implement webhook for new activites
- [x] Split sync into route and activity
- [x] Sync SegmentEffort and Segment models
- [X] Map brushed linking
- [X] add isEnriched flag to data models
- [X] Show mappable activities in the Routes page
- [X] Exclude current filter from dropdown
- [X] Exclude current sort from dropdown
- [X] use React Portal for syncing toasts
- [X] Implement sort order toggle
- [X] Fix pagination
- [ ] Add activities to course comparison
- [ ] Add Streams model
- [ ] Sync Activity streams
- [ ] Implement pace by gradient chart
- [ ] Show streams in Activity page
- [ ] Show sortable Segments
- [ ] Segment search by activity
- [ ] Segment search by location
- [ ] Increase athlete headcount
- [ ] Integrate weather
