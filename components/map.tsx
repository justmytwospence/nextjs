"use client";

import { baseLogger } from "@/lib/logger";
import { Mappable } from "@prisma/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useCallback, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type { FeatureCollection, Feature, LineString } from "geojson";
import { useStore } from "@/store"; // Import the store instance
import { computeGradient, computeDistanceMiles } from "@/lib/geo";

const GeoJSONLayer = ({
  polyline,
  mappableId,
}: {
  polyline: { coordinates: [number, number][] };
  mappableId: string;
}) => {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const hoverCircleRef = useRef<L.Circle | null>(null);
  const { setHoverIndex, hoveredGradient } = useStore();

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
      { type: "FeatureCollection", features },
      {
        style: (feature) => ({
          color:
            feature?.properties?.gradient >= hoveredGradient ? "red" : "blue",
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

      console.log(`Hovering over ${closestIndex} on map`);
      setHoverIndex(minDist < 100 ? closestIndex : -1);
    };

    map.on("mousemove", handleMouseMove);
    map.on("mouseout", () => setHoverIndex(-1));

    // geoJSON cleanup
    return () => {
      geoJsonRef.current?.remove();
      hoverCircleRef.current?.remove();
      map.off("mousemove", handleMouseMove);
      map.off("mouseout");
    };
  }, [polyline]);

  // respond to hoverIndex

  const updateHoverPoint = useCallback(
    (index: number) => {
      if (index < 0 || !polyline.coordinates[index]) {
        hoverCircleRef.current?.remove();
        hoverCircleRef.current = null;
        return;
      }

      const point = polyline.coordinates[index];
      if (!hoverCircleRef.current) {
        hoverCircleRef.current = L.circle([point[1], point[0]], {
          radius: 50,
          color: "black",
          fillColor: "black",
          fillOpacity: 0.5,
        }).addTo(map);
      } else {
        hoverCircleRef.current.setLatLng([point[1], point[0]]);
      }
    },
    [polyline]
  );

  // hoverIndex useEffect
  useEffect(() => {
    console.log("Subscribing to hoverIndex on map");
    const unsub = useStore.subscribe(
      (state) => state.hoverIndex,
      (hoverIndex) => {
        console.log(`Receiving hoverIndex: ${hoverIndex} on map`);
        updateHoverPoint(hoverIndex);
      }
    );
    return unsub;
  }, [updateHoverPoint]);

  // respond to hoveredGradient

  const updateGradients = useCallback((hoveredGradient: number | null) => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.setStyle((feature) => ({
      color: feature?.properties?.gradient >= hoveredGradient ? "red" : "blue",
      weight: 3,
      opacity: 0.8,
    }));
  }, []);

  // hoveredGradient useEffect
  useEffect(() => {
    const unsub = useStore.subscribe(
      (state) => state.hoveredGradient,
      (hoveredGradient) => {
        updateGradients(hoveredGradient);
      }
    );
    return unsub;
  }, [updateGradients]);
  return null;
};

export default function Map({
  mappable,
  interactive = true,
}: {
  mappable: Mappable;
  interactive?: boolean;
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
        <GeoJSONLayer polyline={mappable.polyline} mappableId={mappable.id} />
      )}
    </MapContainer>
  );
}
