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
CREATE TABLE "UserRoute" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "distance" DOUBLE PRECISION NOT NULL,
    "elevation_gain" DOUBLE PRECISION NOT NULL,
    "estimated_moving_time" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "polyline" JSONB,
    "private" BOOLEAN NOT NULL,
    "starred" BOOLEAN NOT NULL,
    "sub_type" INTEGER NOT NULL,
    "summary_polyline" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "type" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "UserRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSegment" (
    "id" INTEGER NOT NULL,
    "activity_type" TEXT NOT NULL,
    "average_grade" DOUBLE PRECISION NOT NULL,
    "city" TEXT,
    "climb_category" INTEGER NOT NULL,
    "country" TEXT,
    "distance" DOUBLE PRECISION NOT NULL,
    "effort_count" INTEGER NOT NULL DEFAULT 0,
    "elevation_high" DOUBLE PRECISION NOT NULL,
    "elevation_low" DOUBLE PRECISION NOT NULL,
    "maximum_grade" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL,
    "state" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "athlete_count" INTEGER,
    "created_at" TIMESTAMP(3),
    "hazardous" BOOLEAN,
    "map_resource_state" INTEGER,
    "polyline" JSONB,
    "pr_activity_id" INTEGER,
    "pr_date" TIMESTAMP(3),
    "pr_elapsed_time" INTEGER,
    "star_count" INTEGER,
    "starred" BOOLEAN,
    "summary_polyline" JSONB,
    "total_elevation_gain" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3),
    "userRouteId" TEXT,

    CONSTRAINT "UserSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" TEXT NOT NULL,
    "achievement_count" INTEGER NOT NULL,
    "athlete_count" INTEGER NOT NULL,
    "average_speed" DOUBLE PRECISION,
    "average_watts" DOUBLE PRECISION,
    "comment_count" INTEGER NOT NULL,
    "commute" BOOLEAN NOT NULL,
    "deviceWatts" BOOLEAN,
    "distance" DOUBLE PRECISION NOT NULL,
    "elapsed_time" INTEGER NOT NULL,
    "elevation_high" DOUBLE PRECISION,
    "elevation_low" DOUBLE PRECISION,
    "flagged" BOOLEAN NOT NULL,
    "gear_id" TEXT,
    "has_kudoed" BOOLEAN NOT NULL,
    "hide_from_home" BOOLEAN NOT NULL,
    "kilojoules" DOUBLE PRECISION,
    "kudos_count" INTEGER NOT NULL,
    "manual" BOOLEAN NOT NULL,
    "max_speed" DOUBLE PRECISION,
    "max_watts" INTEGER,
    "moving_time" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "photo_count" INTEGER NOT NULL,
    "private" BOOLEAN NOT NULL,
    "sport_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "start_date_local" TIMESTAMP(3) NOT NULL,
    "summary_polyline" JSONB,
    "timezone" TEXT NOT NULL,
    "total_elevation_gain" DOUBLE PRECISION NOT NULL,
    "total_photo_count" INTEGER NOT NULL,
    "trainer" BOOLEAN NOT NULL,
    "type" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "weighted_average_watts" INTEGER,
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

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiQuery" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "provider" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionSessionToken" TEXT,

    CONSTRAINT "ApiQuery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_userId_provider_key" ON "Account"("userId", "provider");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "UserRoute_id_user_id_key" ON "UserRoute"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserSegment_id_user_id_key" ON "UserSegment"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserActivity_id_user_id_key" ON "UserActivity"("id", "user_id");

-- CreateIndex
CREATE INDEX "ApiQuery_provider_createdAt_idx" ON "ApiQuery"("provider", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRoute" ADD CONSTRAINT "UserRoute_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSegment" ADD CONSTRAINT "UserSegment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSegment" ADD CONSTRAINT "UserSegment_userRouteId_fkey" FOREIGN KEY ("userRouteId") REFERENCES "UserRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiQuery" ADD CONSTRAINT "ApiQuery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiQuery" ADD CONSTRAINT "ApiQuery_sessionSessionToken_fkey" FOREIGN KEY ("sessionSessionToken") REFERENCES "Session"("sessionToken") ON DELETE SET NULL ON UPDATE CASCADE;
