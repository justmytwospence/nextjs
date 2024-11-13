/*
  Warnings:

  - You are about to drop the `ApiQuery` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserActivity` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSegment` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `timestamp` on the `UserRoute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ApiQuery" DROP CONSTRAINT "ApiQuery_sessionSessionToken_fkey";

-- DropForeignKey
ALTER TABLE "ApiQuery" DROP CONSTRAINT "ApiQuery_userId_fkey";

-- DropForeignKey
ALTER TABLE "UserActivity" DROP CONSTRAINT "UserActivity_user_id_fkey";

-- DropForeignKey
ALTER TABLE "UserSegment" DROP CONSTRAINT "UserSegment_userRouteId_fkey";

-- DropForeignKey
ALTER TABLE "UserSegment" DROP CONSTRAINT "UserSegment_user_id_fkey";

-- AlterTable
ALTER TABLE "UserRoute" DROP COLUMN "timestamp",
ADD COLUMN     "timestamp" BIGINT NOT NULL,
ALTER COLUMN "updated_at" DROP NOT NULL;

-- DropTable
DROP TABLE "ApiQuery";

-- DropTable
DROP TABLE "UserActivity";

-- DropTable
DROP TABLE "UserSegment";

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
    "segment_id" TEXT,
    "start_date" TIMESTAMP(3),
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
    "sport_type" TEXT,
    "start_date" TIMESTAMP(3),
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

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Segment_id_user_id_key" ON "Segment"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_id_user_id_key" ON "Activity"("id", "user_id");

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "Activity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SegmentEffort" ADD CONSTRAINT "SegmentEffort_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "Segment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Segment" ADD CONSTRAINT "Segment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
