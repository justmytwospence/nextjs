import { computeGradient } from "@/lib/geo/geo";
import type { Aspect } from "@/pathfinder";
import type { HoverIndexStore } from "@/store";
import {
  aspectStore,
  createHoverIndexStore,
  hoverIndexStore as defaultHoverIndexStore,
  gradientStore,
} from "@/store";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

type GeoJsonInteractionLayerProps = {
  polyline: LineString;
  geoJsonRef: React.RefObject<L.GeoJSON | null>;
  hoverIndexStore: HoverIndexStore;
};

export default function GeoJsonInteractionLayer({
  polyline,
  geoJsonRef,
  hoverIndexStore,
}: GeoJsonInteractionLayerProps) {
  const map = useMap();
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const { setHoverIndex } = hoverIndexStore();
  const { hoveredGradient } = gradientStore();
  const { hoveredAspect } = aspectStore();

  const handleMouseMove = (e: L.LeafletMouseEvent) => {
    const mousePoint = L.latLng(e.latlng.lat, e.latlng.lng);
    let minDist = Number.POSITIVE_INFINITY;
    let closestIndex = -1;

    for (let i = 0; i < polyline.coordinates.length; i++) {
      const coord = polyline.coordinates[i];
      const point = L.latLng(coord[1], coord[0]);
      const dist = mousePoint.distanceTo(point);
      if (dist < minDist) {
        minDist = dist;
        closestIndex = i;
      }
    }

    setHoverIndex(minDist < 100 ? closestIndex : -1);
  };

  map.on("mousemove", handleMouseMove);
  map.on("mouseout", () => setHoverIndex(-1));

  // respond to hoverIndex
  const updateHoverPoint = useCallback(
    (index: number) => {
      if (index < 0 || !polyline.coordinates[index]) {
        hoverMarkerRef.current?.remove();
        hoverMarkerRef.current = null;
        return;
      }

      const point = polyline.coordinates[index];
      if (!hoverMarkerRef.current) {
        hoverMarkerRef.current = L.marker([point[1], point[0]], {
          icon: L.divIcon({
            className: "hover-marker",
            html: '<div class="marker-inner"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6],
          }),
        }).addTo(map);
      } else {
        hoverMarkerRef.current.setLatLng([point[1], point[0]]);
      }
    },
    [map, polyline]
  );

  // hoverIndex useEffect
  useEffect(() => {
    const unsub = hoverIndexStore.subscribe((state) => {
      updateHoverPoint(state.hoverIndex);
    });
    return unsub;
  }, [updateHoverPoint, hoverIndexStore]);

  // respond to hoveredGradient
  const highlightGradients = useCallback((hoveredGradient: number | null) => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle((feature) => ({
        color:
          feature?.properties?.gradient >= (hoveredGradient ?? 0)
            ? "orange"
            : "black",
        weight: 3,
        opacity: 1,
      }));
    }
  }, [geoJsonRef]);

  // hoveredGradient useEffect
  useEffect(() => {
    const unsub = gradientStore.subscribe(
      (state) => state.hoveredGradient,
      (hoveredGradient) => {
        highlightGradients(hoveredGradient);
      }
    );
    return unsub;
  }, [highlightGradients]);

  // respond to hoveredAspect
  const highlightAspect = useCallback((hoveredAspect: Aspect | null) => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle((feature) => ({
        color:
          feature?.properties?.aspect as Aspect === (hoveredAspect ?? 0)
            ? "orange"
            : "black",
        weight: 3,
        opacity: 1,
      }));
    }
  }, [geoJsonRef]);

  // hoveredAspect useEffect
  useEffect(() => {
    const unsub = aspectStore.subscribe(
      (state) => state.hoveredAspect,
      (hoveredAspect) => {
        highlightAspect(hoveredAspect);
      }
    );
    return unsub;
  }, [highlightAspect]);

  return null;
}
