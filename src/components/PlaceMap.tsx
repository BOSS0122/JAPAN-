"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./MapCanvas";

// Leaflet touches `window` at import time, so it must stay off the server.
const MapCanvas = dynamic(() => import("./MapCanvas"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-lagoon-soft" />,
});

export function PlaceMap({
  points,
  path,
}: {
  points: MapPoint[];
  path?: [number, number][];
}) {
  return <MapCanvas points={points} path={path} />;
}
