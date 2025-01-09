ALTER DATABASE postgres SET postgis.gdal_enabled_drivers = 'ENABLE_ALL';
ALTER TABLE "ElevationTile" ADD COLUMN IF NOT EXISTS tile_extent GEOMETRY(POLYGON, 4269) GENERATED ALWAYS AS (ST_Envelope(rast)) STORED; -- covered by tiles
ALTER TABLE "ElevationTile" ADD COLUMN IF NOT EXISTS raster_valued_extent GEOMETRY(MULTIPOLYGON, 4269) GENERATED ALWAYS AS (ST_Polygon(rast, 1)) STORED; -- covered by data
CREATE INDEX ElevationTile_rast_idx ON "ElevationTile" USING GIST(ST_Envelope(rast));
CREATE INDEX ElevationTile_tile_extent_idx ON "ElevationTile" USING GIST(ST_Envelope(tile_extent));
CREATE INDEX ElevationTile_raster_valued_extent_idx ON "ElevationTile" USING GIST(ST_Envelope(raster_valued_extent));

-- Drop existing trigger and functions
DROP TRIGGER IF EXISTS manage_raster_indexes_trigger ON "ElevationTile";
DROP FUNCTION IF EXISTS manage_raster_indexes();
DROP FUNCTION IF EXISTS reindex_raster_tables_concurrently();

-- Add maintenance function for manual reindexing
CREATE OR REPLACE FUNCTION maintain_raster_indexes() RETURNS void AS $$
BEGIN
    SET maintenance_work_mem = '1GB';
    SET work_mem = '256MB';
    
    REINDEX INDEX CONCURRENTLY ElevationTile_rast_idx;
    REINDEX INDEX CONCURRENTLY ElevationTile_tile_extent_idx;
    REINDEX INDEX CONCURRENTLY ElevationTile_raster_valued_extent_idx;
    
    ANALYZE "ElevationTile";
    
    RESET maintenance_work_mem;
    RESET work_mem;
END;
$$ LANGUAGE plpgsql;