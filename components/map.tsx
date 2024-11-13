"use client";

import { baseLogger } from "@/lib/logger";
import { Mappable } from "@prisma/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { GeoJsonObject, FeatureCollection, Feature, LineString } from "geojson";

type Polyline = {
  coordinates: [number, number][];
  features?: FeatureCollection<LineString>;
};

const GeoJSONLayer = ({
  polyline,
  hoverIndex,
  onHover,
  gradientThreshold,
  gradients = [], // Default to an empty array if gradients is not provided
}: {
  polyline: Polyline; // Use custom type
  hoverIndex: number;
  onHover: (index: number) => void;
  gradientThreshold: number | null;
  gradients: number[];
}) => {
  const map = useMap();

  useEffect(() => {
    if (polyline) {
      // Convert polyline to GeoJSON with gradient properties
      const geoJson: FeatureCollection<LineString> = {
        type: "FeatureCollection",
        features: polyline.coordinates.slice(0, -1).map((coord, i) => ({
          type: "Feature",
          properties: {
            gradient: gradients[i],
          },
          geometry: {
            type: "LineString",
            coordinates: [coord, polyline.coordinates[i + 1]],
          },
        })),
      };

      const geoJsonLayer = L.geoJSON(geoJson, {
        style: (feature) => {
          if (!feature) return {}; // Ensure feature is defined
          const color = window
            .getComputedStyle(document.documentElement)
            .getPropertyValue(
              gradientThreshold !== null &&
                feature.properties.gradient >= gradientThreshold
                ? "--chart-highlight"
                : "--chart-primary"
            );
          return {
            color: `hsl(${color})`,
            weight: 3,
          };
        },
      });

      geoJsonLayer.addTo(map);

      // Add mousemove handler to the map
      const handleMouseMove = (e) => {
        if (!polyline.coordinates) return;

        // Find closest point
        const mousePoint = [e.latlng.lng, e.latlng.lat];
        let minDist = Infinity;
        let closestIndex = -1;

        polyline.coordinates.forEach((coord, index) => {
          const dist = Math.hypot(
            mousePoint[0] - coord[0],
            mousePoint[1] - coord[1]
          );
          if (dist < minDist) {
            minDist = dist;
            closestIndex = index;
          }
        });

        // Only trigger if mouse is close enough to the path
        if (minDist < 0.001) {
          // Adjust threshold as needed
          onHover(closestIndex);
        } else {
          onHover(-1);
        }
      };

      map.on("mousemove", handleMouseMove);
      map.on("mouseout", () => onHover(-1));

      // Add padding to fitBounds for better visibility
      map.fitBounds(geoJsonLayer.getBounds());

      return () => {
        map.removeLayer(geoJsonLayer);
        map.off("mousemove", handleMouseMove);
        map.off("mouseout");
      };
    }
  }, [polyline, map, onHover, gradientThreshold, gradients]);

  // Add circle for hovered point
  useEffect(() => {
    if (hoverIndex >= 0 && polyline?.coordinates) {
      const point = polyline.coordinates[hoverIndex];
      if (point) {
        const circle = L.circle([point[1], point[0]], {
          radius: 50,
          color: "black", // Change circle color to black
          fillColor: "black", // Change circle fill color to black
          fillOpacity: 0.5,
        });
        circle.addTo(map);
        return () => {
          map.removeLayer(circle);
        };
      }
    }
  }, [hoverIndex, polyline, map]);

  return null;
};

export default function Map({
  mappable,
  interactive = true,
  hoverIndex = -1,
  onHover = () => {},
  gradientThreshold = null,
  gradients = [], // Default to an empty array if gradients is not provided
}: {
  mappable: Mappable;
  interactive?: boolean;
  hoverIndex?: number;
  onHover?: (index: number) => void;
  gradientThreshold?: number | null;
  gradients?: number[]; // Make gradients optional
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
      {mappable.summaryPolyline && (
        <GeoJSONLayer
          polyline={mappable.summaryPolyline}
          hoverIndex={hoverIndex}
          onHover={onHover}
          gradientThreshold={gradientThreshold}
          gradients={gradients}
        />
      )}
    </MapContainer>
  );
}
