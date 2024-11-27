/*
  Warnings:

  - You are about to drop the `UserRoute` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `syncedAt` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserRoute" DROP CONSTRAINT "UserRoute_user_id_fkey";

-- AlterTable
ALTER TABLE "Activity" ADD COLUMN     "enrichedAt" TIMESTAMP(3),
ADD COLUMN     "syncedAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "UserRoute";

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
    "enrichedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Route_id_user_id_key" ON "Route"("id", "user_id");

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
