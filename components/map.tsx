"use client";

import { baseLogger } from "@/lib/logger";
import { Mappable } from "@prisma/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";

const GeoJSONLayer = ({ polyline }) => {
  const map = useMap();

  useEffect(() => {
    if (polyline) {
      const geoJsonLayer = L.geoJSON(polyline);
      geoJsonLayer.addTo(map);

      // Add padding to fitBounds for better visibility
      map.fitBounds(geoJsonLayer.getBounds());

      // Clean up the layer when the component unmounts
      return () => {
        map.removeLayer(geoJsonLayer)
      };
    }
  }, [polyline, map]);

  return null;
};

export default function Map({
  mappable,
  interactive = true
}: {
  mappable: Mappable;
  interactive?: boolean
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
      {mappable.summaryPolyline && <GeoJSONLayer polyline={mappable.summaryPolyline} />}
    </MapContainer>
  );
};
