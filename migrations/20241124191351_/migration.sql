/*
  Warnings:

  - You are about to drop the column `enrichedAt` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `syncedAt` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `enrichedAt` on the `Route` table. All the data in the column will be lost.
  - You are about to drop the column `syncedAt` on the `Route` table. All the data in the column will be lost.
  - Added the required column `synced_at` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "enrichedAt",
DROP COLUMN "syncedAt",
ADD COLUMN     "enriched_at" TIMESTAMP(3),
ADD COLUMN     "synced_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Route" DROP COLUMN "enrichedAt",
DROP COLUMN "syncedAt",
ADD COLUMN     "enriched_at" TIMESTAMP(3),
ADD COLUMN     "synced_at" TIMESTAMP(3);
