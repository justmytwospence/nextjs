import { prisma } from "@/lib/prisma";
import type GeoTIFF from "geotiff";
import { fromArrayBuffer } from "geotiff";

export async function uploadGeoTIFFToPostGIS(arrayBuffer: ArrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  const hexLiteral = buffer.toString("hex")
  console.log(`hexLiteral: ${hexLiteral}`)
  await prisma.$executeRaw`
    INSERT INTO "ElevationTile" (rast)
    VALUES (
      ST_FromGDALRaster(decode(${hexLiteral}, 'hex')), 
    );`
}
