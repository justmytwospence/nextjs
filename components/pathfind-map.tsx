"use client";

import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Point } from "geojson";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import { useGeolocation } from "react-use";

interface PathfindMapProps {
  markers: Point[];
  onMapClick: (point: Point) => void;
}

export default function PathfindMap({ markers, onMapClick }: PathfindMapProps) {
  const center: L.LatLngExpression = [39.977, -105.263];

  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        const point: Point = {
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat],
        };
        onMapClick(point);
      },
    });
    return null;
  };

  return (
    <MapContainer
      className="map-container"
      style={{ height: "100%", width: "100%" }}
      center={center}
      zoom={13}
      zoomControl={true}
      scrollWheelZoom={true}
      dragging={true}
      attributionControl={true}
      doubleClickZoom={true}
      maxBoundsViscosity={1.0}
    >
      <TileLayer url="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=bDE5WHMnFV1P973D59QWuGaq6hebBcjPSyud6vVGYqqi2r4kZyaShdbC3SF2Bc7y" />
      <MapClickHandler />
      {markers.map((position) => (
        <Marker
          key={`${position.coordinates[0]}-${position.coordinates[1]}`}
          position={
            new L.LatLng(position.coordinates[1], position.coordinates[0])
          }
        />
      ))}
    </MapContainer>
  );
}
