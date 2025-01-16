"use client";

import { baseLogger } from "@/lib/logger";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRef, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";

interface LeafletMapProps {
  interactive?: boolean;
  children?: React.ReactNode;
}

export default function LeafletMap(props: LeafletMapProps) {
  const [defaultCenter] = useState<L.LatLng>(L.latLng(39.977, -105.263));
  const mapRef = useRef<L.Map | null>(null);

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
      <TileLayer url="https://tile.jawg.io/jawg-terrain/{z}/{x}/{y}{r}.png?access-token=bDE5WHMnFV1P973D59QWuGaq6hebBcjPSyud6vVGYqqi2r4kZyaShdbC3SF2Bc7y" />
      {props.children}
    </MapContainer>
  );
}
