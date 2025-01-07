"use client";

import dynamic from "next/dynamic";

const LazyPolylineMap = dynamic(() => import("@/components/polyline-map"), { ssr: false });
export default LazyPolylineMap;
