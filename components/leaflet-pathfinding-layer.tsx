import type { Bounds } from "@/app/actions/findPath";
import { baseLogger } from "@/lib/logger";
import type { Point } from "geojson";
import L from "leaflet";
import { useCallback, useEffect, useRef } from "react";
import { CircleMarker, Polyline, useMap, useMapEvents } from "react-leaflet";

interface LeafletPathfindingLayerProps {
  markers: Point[];
  showLine?: boolean;
  onMapClick?: (point: Point) => Point;
  onBoundsChange?: (newBounds: Bounds) => Bounds;
}

export default function LeafletPathfindingLayer({
  markers,
  showLine,
  onMapClick,
  onBoundsChange,
}: LeafletPathfindingLayerProps) {
  const map = useMap();

  // Center on user's location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setView(
            [position.coords.latitude, position.coords.longitude],
            13
          );
        },
        (error) => {
          baseLogger.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  const mapEvents = useMapEvents({
    click(e) {
      if (onMapClick) {
        const point: Point = {
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat],
        };
        onMapClick(point);
      }
    },
    moveend() {
      if (onBoundsChange) {
        const bounds = map.getBounds();
        const nw = bounds.getNorthWest();
        const se = bounds.getSouthEast();
        onBoundsChange({
          north: nw.lat,
          south: se.lat,
          east: se.lng,
          west: nw.lng,
        } as Bounds);
      }
    },
  });

  // Center the map on the markers when they change
  useEffect(() => {
    if (markers.length > 1) {
      const markerBounds = L.latLngBounds(
        markers.map((marker) => [marker.coordinates[1], marker.coordinates[0]])
      );
      map.fitBounds(markerBounds, { padding: [100, 100] });
    }
  }, [markers, map]);

  // Add initialization effect for onMapMove
  useEffect(() => {
    if (onBoundsChange) {
      const bounds = map.getBounds();
      const nw = bounds.getNorthWest();
      const se = bounds.getSouthEast();
      onBoundsChange({
        north: nw.lat,
        south: se.lat,
        east: se.lng,
        west: nw.lng,
      } as Bounds);
    }
  }, [map, onBoundsChange]);

  return (
    <>
      {markers.map((position) => (
        <CircleMarker
          key={`${position.coordinates[0]}-${position.coordinates[1]}`}
          center={[position.coordinates[1], position.coordinates[0]]}
          radius={8}
          pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.7 }}
        />
      ))}
      {showLine && (
        <Polyline
          positions={markers.map((point) => [
            point.coordinates[1],
            point.coordinates[0],
          ])}
          pathOptions={{ color: "blue", weight: 2 }}
        />
      )}
    </>
  );
}
