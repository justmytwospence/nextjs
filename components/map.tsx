"use client";

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { StravaRoute } from "@prisma/client";

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

const Map = ({ route, interactive = true }: { route: StravaRoute; interactive?: boolean }) => {
  return (
    <MapContainer
      className="map-container"
      style={{ height: '100%', width: '100%' }}
      center={[51.505, -0.09]}
      zoom={13}
      zoomControl={interactive}
      dragging={interactive}
      attributionControl={interactive}
      doubleClickZoom={interactive}
    >
      <TileLayer url='https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=bDE5WHMnFV1P973D59QWuGaq6hebBcjPSyud6vVGYqqi2r4kZyaShdbC3SF2Bc7y' />
      {route.summaryPolyline && <GeoJSONLayer polyline={route.summaryPolyline} />}
    </MapContainer>
  );
};

export default Map;
