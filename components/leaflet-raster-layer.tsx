
import type { Aspect } from "@/pathfinder";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import type GeoTIFF from "geotiff";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

interface LeafletRasterLayerProps {
  azimuthRaster: GeoTIFF | null;
  excludedAspects: Aspect[];
}

export default function LeafletRasterLayer({
  azimuthRaster,
  excludedAspects,
}: LeafletRasterLayerProps) {
  const map = useMap();
  const geoRasterLayerRef = useRef<GeoRasterLayer | null>(null);

  useEffect(() => {
    if (azimuthRaster) {
      const aspectToCardinal = (aspect: number): Aspect => {
        if (aspect >= 337.5 || aspect < 22.5) return "North" as Aspect;
        if (aspect >= 22.5 && aspect < 67.5) return "Northeast" as Aspect;
        if (aspect >= 67.5 && aspect < 112.5) return "East" as Aspect;
        if (aspect >= 112.5 && aspect < 157.5) return "Southeast" as Aspect;
        if (aspect >= 157.5 && aspect < 202.5) return "South" as Aspect;
        if (aspect >= 202.5 && aspect < 247.5) return "Southwest" as Aspect;
        if (aspect >= 247.5 && aspect < 292.5) return "West" as Aspect;
        if (aspect >= 292.5 && aspect < 337.5) return "Northwest" as Aspect;
        return "Flat" as Aspect;
      };

      geoRasterLayerRef.current = new GeoRasterLayer({
        georaster: azimuthRaster,
        opacity: 0.5,
        pixelValuesToColorFn: (values) => {
          const aspectDegrees = values[0];
          const cardinalAspect = aspectToCardinal(aspectDegrees);
          return excludedAspects.includes(cardinalAspect) ? "#ff0000" : "transparent";
        },
      });

      geoRasterLayerRef.current.addTo(map);

      return () => {
        geoRasterLayerRef.current?.remove();
      };
    }
  }, [azimuthRaster, excludedAspects, map]);

  return null;
};