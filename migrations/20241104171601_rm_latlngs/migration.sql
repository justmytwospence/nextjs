/*
  Warnings:

  - You are about to drop the column `end_latlng` on the `UserSegment` table. All the data in the column will be lost.
  - You are about to drop the column `start_latlng` on the `UserSegment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "UserSegment" DROP COLUMN "end_latlng",
DROP COLUMN "start_latlng";
