"use client";

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';

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
        map.removeLayer(geoJsonLayer);
      };
    }
  }, [polyline, map]);

  return null;
};

const Map = ({ route }) => {
  return (
    <MapContainer
      className="map-container"
      style={{ height: '100%', width: '100%' }}
      center={[51.505, -0.09]}
      zoom={13}
    >
      <TileLayer url='https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=bDE5WHMnFV1P973D59QWuGaq6hebBcjPSyud6vVGYqqi2r4kZyaShdbC3SF2Bc7y' />
      {route.summaryPolyline && <GeoJSONLayer polyline={route.summaryPolyline} />}
    </MapContainer>
  );
};

export default Map;
