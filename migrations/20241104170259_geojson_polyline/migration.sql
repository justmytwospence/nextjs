/*
  Warnings:

  - The `polyline` column on the `UserSegment` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `summary_polyline` column on the `UserSegment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "UserSegment" DROP COLUMN "polyline",
ADD COLUMN     "polyline" JSONB,
DROP COLUMN "summary_polyline",
ADD COLUMN     "summary_polyline" JSONB;
