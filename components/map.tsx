"use client";

import { computeDistanceMiles, computeGradient } from "@/lib/geo";
import { baseLogger } from "@/lib/logger";
import type { HoverIndexStore } from "@/store";
import {
  hoverIndexStore as defaultHoverIndexStore,
  gradientStore,
} from "@/store";
import { Mappable } from "@prisma/client";
import type { Feature, FeatureCollection, LineString } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

const GeoJSONLayer = ({
  polyline,
  mappableId,
  hoverIndexStore = defaultHoverIndexStore,
}: {
  polyline: { coordinates: [number, number][] };
  mappableId: string;
  hoverIndexStore: HoverIndexStore;
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
        type: "Feature",
        properties: { gradient: computedGradients[i] },
        geometry: {
          type: "LineString",
          coordinates: [coord, polyline.coordinates[i + 1]],
        },
      }));

    // Set map bounds
    const bounds = L.latLngBounds(
      polyline.coordinates.map(([lng, lat]) => [lat, lng])
    );
    map.fitBounds(bounds, { padding: [50, 50] });

    // Create GeoJSON layer
    geoJsonRef.current = L.geoJSON(
      { type: "FeatureCollection", features } as FeatureCollection,
      {
        style: (feature) => ({
          color:
            feature?.properties?.gradient >= (hoveredGradient ?? 0)
              ? "red"
              : "blue",
          weight: 3,
          opacity: 0.8,
        }),
      }
    ).addTo(map);

    // handlers
    const handleMouseMove = (e: L.LeafletMouseEvent) => {
      const mousePoint = L.latLng(e.latlng.lat, e.latlng.lng);
      let minDist = Infinity;
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
  }, [polyline]);

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
    const unsub = hoverIndexStore.subscribe(
      (state) => state.hoverIndex,
      (hoverIndex) => {
        updateHoverPoint(hoverIndex);
      }
    );
    return unsub;
  }, [updateHoverPoint, hoverIndexStore]);

  // respond to hoveredGradient

  const updateGradients = useCallback((hoveredGradient: number | null) => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.setStyle((feature) => ({
      color:
        feature?.properties?.gradient >= (hoveredGradient ?? 0)
          ? "red"
          : "blue",
      weight: 3,
      opacity: 0.8,
    }));
  }, []);

  // hoveredGradient useEffect
  useEffect(() => {
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

export default function Map({
  mappable,
  interactive = true,
  hoverIndexStore = defaultHoverIndexStore,
}: {
  mappable: Mappable;
  interactive?: boolean;
  hoverIndexStore: HoverIndexStore;
}) {
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
    >
      <TileLayer url="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=bDE5WHMnFV1P973D59QWuGaq6hebBcjPSyud6vVGYqqi2r4kZyaShdbC3SF2Bc7y" />
      {mappable.polyline && (
        <GeoJSONLayer
          polyline={mappable.polyline}
          mappableId={mappable.id}
          hoverIndexStore={hoverIndexStore}
        />
      )}
    </MapContainer>
  );
}
