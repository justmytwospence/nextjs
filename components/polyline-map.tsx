"use client";

import type { Bounds } from "@/app/actions/findPath";
import { computeDistanceMiles, computeGradient } from "@/lib/geo/geo";
import { baseLogger } from "@/lib/logger";
import type { Aspect } from "@/pathfinder";
import type { HoverIndexStore } from "@/store";
import {
  aspectStore,
  hoverIndexStore as defaultHoverIndexStore,
  gradientStore,
} from "@/store";
import type { Feature, FeatureCollection, LineString, Point } from "geojson";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import GeoRasterLayer from "georaster-layer-for-leaflet";
import type GeoTIFF from "geotiff";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

interface PolylineMapProps {
  polyline: LineString | null;
  polylineProperties?: FeatureCollection | null;
  interactive?: boolean;
  hoverIndexStore?: HoverIndexStore;
  onMapClick?: (point: Point) => Point;
  onMapMove?: (bounds: Bounds) => Bounds;
  markers?: Point[];
  clickable?: boolean;
  onCenterChange?: (center: L.LatLng) => void;
  center?: [number, number];
  azimuthRaster?: GeoTIFF | null;
  excludedAspects?: Aspect[];
}

export default function PolylineMap(props: PolylineMapProps) {
  const [defaultCenter] = useState<L.LatLng>(L.latLng(39.977, -105.263));
  const mapRef = useRef<L.Map | null>(null);

  // Watch for center prop changes
  useEffect(() => {
    if (props.center && mapRef.current) {
      const [lng, lat] = props.center;
      mapRef.current.setView([lat, lng], 13, {
        animate: true,
        duration: 1,
      });
    }
  }, [props.center]);

  // initial useEffect
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          mapRef.current?.setView(
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

  return (
    <MapContainer
      className="map-container"
      style={{ height: "100%", width: "100%" }}
      center={defaultCenter}
      zoom={13}
      zoomControl={props.interactive}
      scrollWheelZoom={props.interactive}
      dragging={props.interactive}
      attributionControl={props.interactive}
      doubleClickZoom={props.interactive}
      ref={mapRef}
    >
      <MapContent {...props} />
    </MapContainer>
  );
}

function MapContent({
  polyline,
  polylineProperties,
  interactive = true,
  hoverIndexStore = defaultHoverIndexStore,
  onMapClick,
  onMapMove,
  markers = [],
  clickable = true,
  onCenterChange,
  azimuthRaster,
  excludedAspects
}: PolylineMapProps) { // Update props type
  const map = useMap();
  const bounds = polyline
    ? L.latLngBounds(polyline.coordinates.map(([lng, lat]) => [lat, lng]))
    : null;

  // Move event handlers outside conditions
  const mapEvents = useMapEvents({
    click(e) {
      if (onMapClick && clickable) {
        const point: Point = {
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat],
        };
        onMapClick(point);
      }
    },
    moveend() {
      if (onMapMove) {
        const bounds = map.getBounds();
        const nw = bounds.getNorthWest();
        const sw = bounds.getSouthWest();
        onMapMove({
          north: nw.lat,
          south: sw.lat,
          east: nw.lng,
          west: sw.lng,
        } as Bounds);
      }
    },
  });

  // Add method to center map
  const centerMap = useCallback(
    (lat: number, lng: number, zoom?: number) => {
      const newZoom = zoom || map.getZoom();
      map.setView([lat, lng], newZoom, {
        animate: true,
        duration: 1,
      });
      onCenterChange?.(L.latLng(lat, lng));
    },
    [map, onCenterChange]
  );

  // Add to component's ref
  useEffect(() => {
    if (map) {
      // @ts-ignore - adding custom property
      map.centerMap = centerMap;
    }
  }, [map, centerMap]);

  // Add initialization effect for onMapMove
  useEffect(() => {
    if (onMapMove) {
      const bounds = map.getBounds();
      const nw = bounds.getNorthWest();
      const se = bounds.getSouthEast();
      onMapMove({
        north: nw.lat,
        south: se.lat,
        east: se.lng,
        west: nw.lng,
      } as Bounds);
    }
  }, [map, onMapMove]);

  // Add effect to center map on markers when they change
  useEffect(() => {
    if (markers.length > 1) {
      const markerBounds = L.latLngBounds(
        markers.map((marker) => [marker.coordinates[1], marker.coordinates[0]])
      );
      map.fitBounds(markerBounds, { padding: [100, 100] });
    }
  }, [markers, map]);

  // Add GeoRasterLayer via useEffect
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

      const geoRasterLayer = new GeoRasterLayer({
        georaster: azimuthRaster,
        opacity: 0.5,
        pixelValuesToColorFn: values => {
          const aspectDegrees = values[0];
          const cardinalAspect = aspectToCardinal(aspectDegrees);
          return excludedAspects?.includes(cardinalAspect) ? '#ff0000' : 'transparent';
        }
      });

      geoRasterLayer.addTo(map);

      return () => {
        geoRasterLayer.remove();
      };
    }
  }, [azimuthRaster, excludedAspects, map]);

  return (
    <>
      <TileLayer url="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=bDE5WHMnFV1P973D59QWuGaq6hebBcjPSyud6vVGYqqi2r4kZyaShdbC3SF2Bc7y" />
      {polyline === null && (
        <Polyline
          positions={markers.map((point) => [
            point.coordinates[1],
            point.coordinates[0],
          ])}
          pathOptions={{ color: "blue", weight: 2, opacity: 0.5 }}
        />
      )}
      {markers.map((position) => (
        <CircleMarker
          key={`${position.coordinates[0]}-${position.coordinates[1]}`}
          center={[position.coordinates[1], position.coordinates[0]]}
          radius={8}
          pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.7 }}
        />
      ))}
      {polyline && (
        <GeoJSONLayer
          polyline={polyline}
          polylineProperties={
            polylineProperties || { type: "FeatureCollection", features: [] }
          }
          hoverIndexStore={hoverIndexStore}
          interactive={interactive}
          bounds={bounds}
        />
      )}
    </>
  );
}

const GeoJSONLayer = ({
  polyline,
  polylineProperties,
  hoverIndexStore,
  interactive = true,
  bounds,
}: {
  polyline: LineString;
  polylineProperties: FeatureCollection;
  hoverIndexStore: HoverIndexStore;
  interactive?: boolean;
  bounds: L.LatLngBounds | null;
}) => {
  const map = useMap();
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const hoverMarkerRef = useRef<L.Marker | null>(null);
  const { setHoverIndex } = hoverIndexStore();
  const { hoveredGradient } = gradientStore();
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
          const matchesAspect = hoveredAspect
            ? feature?.properties?.aspect === hoveredAspect
            : false;

          return {
            color: matchesAspect
              ? "#ff6b6b"
              : isHighGradient
              ? "#ff6b6b"
              : "#4475ff",
            weight: matchesAspect ? 4 : 3,
            opacity: matchesAspect ? 1 : 0.8,
            zIndex: matchesAspect ? 2000 : isHighGradient ? 1000 : 1,
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
  }, [polyline, interactive, bounds, hoveredAspect]);

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
  const highlightGradients = useCallback(
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
        highlightGradients(hoveredGradient);
      }
    );
    return unsub;
  }, [highlightGradients, gradientStore]);

  // respond to hoveredAspect
  const highlightAspect = useCallback(
    (hoveredAspect: Aspect | null) => {
      if (!geoJsonRef.current || !interactive) return;
      geoJsonRef.current.setStyle((feature) => ({
        color:
          feature?.properties?.aspect >= (hoveredAspect ?? 0)
            ? "#ff6b6b"
            : "#4475ff",
        weight: 3,
        opacity: 0.8,
      }));
    },
    [interactive]
  );

  // hoveredAspect useEffect
  useEffect(() => {
    if (!interactive) return;
    const unsub = aspectStore.subscribe(
      (state) => state.hoveredAspect,
      (hoveredAspect) => {
        highlightAspect(hoveredAspect);
      }
    );
    return unsub;
  }, [highlightAspect, aspectStore]);

  return null;
};
