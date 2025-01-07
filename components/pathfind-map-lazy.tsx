"use client";

import dynamic from "next/dynamic";

const LazyPathfindMap = dynamic(() => import("@/components/pathfind-map"), { ssr: false });
export default LazyPathfindMap;
