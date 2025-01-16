import { computeGradient } from "@/lib/geo/geo";
import type { Aspect } from "@/pathfinder";
import type { HoverIndexStore } from "@/store";
import {
  aspectStore,
  hoverIndexStore as defaultHoverIndexStore, 
} from "@/store";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import GeoJSONInteractionLayer from "./leaflet-geojson-interactive-layer";

type GeoJSONLayerProps = {
  polyline: LineString;
  polylineProperties?: FeatureCollection;
  interactive?: boolean;
  hoverIndexStore?: HoverIndexStore;
};

export default function GeoJSONLayer({
  polyline,
  polylineProperties,
  interactive = false,
  hoverIndexStore = defaultHoverIndexStore,
}: GeoJSONLayerProps) {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const { hoveredAspect } = aspectStore();

  // polyline useEffect
  useEffect(() => {
    const computedGradients = computeGradient(polyline.coordinates);
    const features: Feature<LineString>[] = polyline.coordinates
      .slice(0, -1)
      .map((coord, i) => ({
        type: "Feature" as const,
        properties: {
          gradient: computedGradients[i],
          aspect: polylineProperties
            ? (polylineProperties.features[i]?.properties?.aspect as Aspect)
            : null,
        },
        geometry: {
          type: "LineString" as const,
          coordinates: [coord, polyline.coordinates[i + 1]],
        },
      }))
      // Sort features so higher gradients are rendered last (on top)
      .sort(
        (a, b) => (a.properties?.gradient || 0) - (b.properties?.gradient || 0)
      );

    // Create GeoJSON layer
    geoJsonRef.current = L.geoJSON(
      { type: "FeatureCollection", features } as FeatureCollection,
      {
        style: {
          color: "black",
        },
      }
    ).addTo(map);

    // Center and zoom the map to fit the GeoJSON layer
    if (geoJsonRef.current) {
      const bounds = geoJsonRef.current.getBounds();
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    // geoJSON cleanup
    return () => {
      geoJsonRef.current?.remove();
      hoverMarkerRef.current?.remove();
    };

  }, [polyline, hoveredAspect]);

  if (interactive) {
    return (<GeoJSONInteractionLayer polyline={polyline} geoJsonRef={geoJsonRef} hoverIndexStore={hoverIndexStore}/>)
  }

  return null;
}
