"use client";

import { computeDistanceMiles, computeGradient } from "@/lib/geo";
import { baseLogger } from "@/lib/logger";
import type { HoverIndexStore } from "@/store";
import {
  hoverIndexStore as defaultHoverIndexStore,
  gradientStore,
} from "@/store";
import type { Feature, FeatureCollection, LineString } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

export default function Map({
  polyline,
  interactive = true,
  hoverIndexStore = defaultHoverIndexStore,
}: {
  polyline: LineString;
  interactive?: boolean;
  hoverIndexStore?: HoverIndexStore;
}) {
  baseLogger.debug(`Rendering map with ${polyline}`);
  const bounds = L.latLngBounds(
    polyline.coordinates.map(([lng, lat]) => [lat, lng])
  );

  return (
    <MapContainer
      className="map-container"
      style={{ height: "100%", width: "100%" }}
      center={[51.505, -0.09]}
      zoom={13}
      zoomControl={interactive}
      scrollWheelZoom={interactive}
      dragging={interactive}
      attributionControl={interactive}
      doubleClickZoom={interactive}
      maxBoundsViscosity={1.0} 
    >
      <TileLayer url="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=bDE5WHMnFV1P973D59QWuGaq6hebBcjPSyud6vVGYqqi2r4kZyaShdbC3SF2Bc7y" />
      <GeoJSONLayer
        polyline={polyline}
        hoverIndexStore={hoverIndexStore}
        interactive={interactive}
        bounds={bounds} // Pass bounds to GeoJSONLayer
      />
    </MapContainer>
  );
}

const GeoJSONLayer = ({
  polyline,
  hoverIndexStore,
  interactive = true,
  bounds,
}: {
  polyline: LineString;
  hoverIndexStore: HoverIndexStore;
  interactive?: boolean;
  bounds: L.LatLngBounds;
}) => {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const { setHoverIndex } = hoverIndexStore();
  const { hoveredGradient } = gradientStore();

  // polyline useEffect
  useEffect(() => {
    const computedGradients = computeGradient(polyline.coordinates);
    const features: Feature<LineString>[] = polyline.coordinates
      .slice(0, -1)
      .map((coord, i) => ({
        type: "Feature" as const,
        properties: { gradient: computedGradients[i] },
        geometry: {
          type: "LineString" as const,
          coordinates: [coord, polyline.coordinates[i + 1]],
        },
      }))
      // Sort features so higher gradients are rendered last (on top)
      .sort(
        (a, b) => (a.properties?.gradient || 0) - (b.properties?.gradient || 0)
      );

    map.fitBounds(bounds, { padding: interactive ? [20, 20] : [5, 5] });
    map.setMaxBounds(bounds.pad(interactive ? 0.2 : 0.05));

    // Create GeoJSON layer
    geoJsonRef.current = L.geoJSON(
      { type: "FeatureCollection", features } as FeatureCollection,
      {
        style: (feature) => {
          if (!interactive) {
            return {
              color: "#4475ff", // Use single color when not interactive
              weight: 3,
              opacity: 0.8,
              zIndex: 1,
            };
          }
          const isHighGradient =
            feature?.properties?.gradient >= (hoveredGradient ?? 0);
          return {
            color: isHighGradient ? "#ff6b6b" : "#4475ff",
            weight: 3,
            opacity: 0.8,
            zIndex: isHighGradient ? 1000 : 1, // Higher z-index for red segments
          };
        },
      }
    ).addTo(map);

    // handlers
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

    // geoJSON cleanup
    return () => {
      geoJsonRef.current?.remove();
      hoverMarkerRef.current?.remove();
      map.off("mousemove", handleMouseMove);
      map.off("mouseout");
    };
  }, [polyline, interactive, bounds]);

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
    [polyline]
  );

  // hoverIndex useEffect
  useEffect(() => {
    if (!interactive) return;
    const unsub = hoverIndexStore.subscribe((state) => {
      updateHoverPoint(state.hoverIndex);
    });
    return unsub;
  }, [updateHoverPoint, hoverIndexStore]);

  // respond to hoveredGradient

  const updateGradients = useCallback(
    (hoveredGradient: number | null) => {
      if (!geoJsonRef.current || !interactive) return;
      geoJsonRef.current.setStyle((feature) => ({
        color:
          feature?.properties?.gradient >= (hoveredGradient ?? 0)
            ? "#ff6b6b"
            : "#4475ff",
        weight: 3,
        opacity: 0.8,
      }));
    },
    [interactive]
  );

  // hoveredGradient useEffect
  useEffect(() => {
    if (!interactive) return;
    const unsub = gradientStore.subscribe(
      (state) => state.hoveredGradient,
      (hoveredGradient) => {
        updateGradients(hoveredGradient);
      }
    );
    return unsub;
  }, [updateGradients, gradientStore]);
  return null;
};
