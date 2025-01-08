-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis_raster";

-- CreateTable
CREATE TABLE "ElevationTile" (
    "rid" TEXT NOT NULL,
    "filename" TEXT,
    "rast" raster NOT NULL,
    "srid" INTEGER,

    CONSTRAINT "ElevationTile_pkey" PRIMARY KEY ("rid")
);
