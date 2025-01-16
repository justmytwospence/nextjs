"use client";

import dynamic from "next/dynamic";

const LazyPolylineMap = dynamic(() => import("@/components/leaflet-map"), { ssr: false });
export default LazyPolylineMap;
