/*
  Warnings:

  - You are about to drop the `StravaRoute` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StravaRoute" DROP CONSTRAINT "StravaRoute_user_id_fkey";

-- DropTable
DROP TABLE "StravaRoute";

-- CreateTable
CREATE TABLE "UserRoute" (
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
    "timestamp" TIMESTAMP(3) NOT NULL,
    "summary_polyline" JSONB NOT NULL,
    "type" INTEGER,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "UserRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSegment" (
    "activity_type" TEXT NOT NULL,
    "average_grade" DOUBLE PRECISION NOT NULL,
    "city" TEXT NOT NULL,
    "climb_category" INTEGER NOT NULL,
    "country" TEXT NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "effort_count" INTEGER NOT NULL,
    "elevation_high" DOUBLE PRECISION NOT NULL,
    "elevation_low" DOUBLE PRECISION NOT NULL,
    "end_latlng" TEXT NOT NULL,
    "id" INTEGER NOT NULL,
    "maximum_grade" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "pr_activity_id" INTEGER,
    "pr_date" TIMESTAMP(3) NOT NULL,
    "pr_elapsed_time" INTEGER NOT NULL,
    "private" BOOLEAN NOT NULL,
    "start_latlng" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "athlete_count" INTEGER,
    "created_at" TIMESTAMP(3),
    "hazardous" BOOLEAN,
    "polyline" TEXT,
    "map_resource_state" INTEGER,
    "star_count" INTEGER,
    "starred" BOOLEAN,
    "summary_polyline" TEXT,
    "total_elevation_gain" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3),
    "userRouteId" TEXT,

    CONSTRAINT "UserSegment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserRoute_id_user_id_key" ON "UserRoute"("id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserSegment_id_user_id_key" ON "UserSegment"("id", "user_id");

-- AddForeignKey
ALTER TABLE "UserRoute" ADD CONSTRAINT "UserRoute_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSegment" ADD CONSTRAINT "UserSegment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSegment" ADD CONSTRAINT "UserSegment_userRouteId_fkey" FOREIGN KEY ("userRouteId") REFERENCES "UserRoute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
