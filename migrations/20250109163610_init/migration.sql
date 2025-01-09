-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_raster";

-- CreateTable
CREATE TABLE "ElevationTile" (
    "rid" SERIAL NOT NULL,
    "rast" raster NOT NULL,

    CONSTRAINT "ElevationTile_pkey" PRIMARY KEY ("rid")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "id_token" TEXT,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "scope" TEXT,
    "session_state" TEXT,
    "token_type" TEXT,
    "type" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "expires" TIMESTAMP(3) NOT NULL,
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Route" (
    "created_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "distance" DOUBLE PRECISION NOT NULL,
    "elevation_gain" DOUBLE PRECISION NOT NULL,
    "estimated_moving_time" DOUBLE PRECISION NOT NULL,
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "polyline" JSONB,
    "private" BOOLEAN NOT NULL,
    "starred" BOOLEAN NOT NULL,
    "sub_type" INTEGER NOT NULL,
    "summary_polyline" JSONB NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "type" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,
    "enriched_at" TIMESTAMP(3),
    "synced_at" TIMESTAMP(3),

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SegmentEffort" (
    "activity_id" TEXT NOT NULL,
    "average_cadence" DOUBLE PRECISION,
    "average_heartrate" DOUBLE PRECISION,
    "average_watts" DOUBLE PRECISION,
    "deviceWatts" BOOLEAN,
    "distance" DOUBLE PRECISION,
    "elapsed_time" INTEGER,
    "end_index" INTEGER,
    "hidden" BOOLEAN,
    "id" TEXT NOT NULL,
    "is_kom" BOOLEAN,
    "kom_rank" INTEGER,
    "max_heartrate" DOUBLE PRECISION,
    "moving_time" INTEGER,
    "name" TEXT NOT NULL,
    "pr_rank" INTEGER,
    "segment_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "start_date_local" TIMESTAMP(3),
    "start_index" INTEGER,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "SegmentEffort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Segment" (
    "activity_type" TEXT,
    "athlete_count" INTEGER,
    "average_grade" DOUBLE PRECISION,
    "city" TEXT,
    "climb_category" INTEGER,
    "country" TEXT,
    "created_at" TIMESTAMP(3),
    "distance" DOUBLE PRECISION,
    "effort_count" INTEGER,
    "elevation_high" DOUBLE PRECISION,
    "elevation_low" DOUBLE PRECISION,
    "hazardous" BOOLEAN,
    "id" TEXT NOT NULL,
    "maximum_grade" DOUBLE PRECISION,
    "name" TEXT,
    "polyline" JSONB,
    "private" BOOLEAN,
    "star_count" INTEGER,
    "state" TEXT,
    "total_elevation_gain" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "achievement_count" INTEGER NOT NULL,
    "athlete_count" INTEGER,
    "average_speed" DOUBLE PRECISION,
    "average_watts" DOUBLE PRECISION,
    "comment_count" INTEGER,
    "commute" BOOLEAN,
    "deviceWatts" BOOLEAN,
    "distance" DOUBLE PRECISION,
    "elapsed_time" INTEGER,
    "elev_high" DOUBLE PRECISION,
    "elev_low" DOUBLE PRECISION,
    "flagged" BOOLEAN,
    "gear_id" TEXT,
    "has_kudoed" BOOLEAN,
    "hide_from_home" BOOLEAN,
    "id" TEXT NOT NULL,
    "kilojoules" DOUBLE PRECISION,
    "kudos_count" INTEGER,
    "manual" BOOLEAN,
    "max_speed" DOUBLE PRECISION,
    "max_watts" INTEGER,
    "moving_time" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "photo_count" INTEGER,
    "private" BOOLEAN,
    "sport_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "start_date_local" TIMESTAMP(3),
    "summary_polyline" JSONB,
    "timezone" TEXT,
    "total_elevation_gain" DOUBLE PRECISION,
    "total_photo_count" INTEGER,
    "trainer" BOOLEAN,
    "type" TEXT,
    "upload_id" TEXT,
    "weightedkaverage_watts" INTEGER,
    "workout_type" INTEGER,
    "calories" DOUBLE PRECISION,
    "description" TEXT,
    "device_name" TEXT,
    "embed_token" TEXT,
    "laps" JSONB,
    "photos" JSONB,
    "polyline" JSONB,
    "splits_metric" JSONB,
    "splits_standard" JSONB,
    "user_id" TEXT NOT NULL,
    "synced_at" TIMESTAMP(3) NOT NULL,
    "enriched_at" TIMESTAMP(3),

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_provider_key" ON "Account"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "Route_id_user_id_key" ON "Route"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Segment_id_user_id_key" ON "Segment"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_id_user_id_key" ON "Activity"("id", "user_id");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "Segment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
