"use client";

import dynamic from 'next/dynamic';

const LazyMap = dynamic(() => import('@/components/map'), { ssr: false });

export default LazyMap;
