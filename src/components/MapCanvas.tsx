"use client";

import { useEffect } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
  /** Stop number on a planned course; omitted for a plain pin. */
  index?: number;
}

/** Inline SVG pin — avoids Leaflet's default image assets entirely. */
function pinIcon(color: string, index?: number) {
  const badge =
    index != null
      ? `<text x="16" y="21" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="system-ui, sans-serif">${index}</text>`
      : `<circle cx="16" cy="16" r="5" fill="#fff"/>`;
  return L.divIcon({
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
    html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 41C16 41 30 25.5 30 16A14 14 0 1 0 2 16C2 25.5 16 41 16 41Z" fill="${color}" stroke="#241b3a" stroke-width="2"/>
      ${badge}
    </svg>`,
  });
}

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }
    map.fitBounds(
      L.latLngBounds(points.map((p) => [p.lat, p.lng] as [number, number])),
      { padding: [36, 36] },
    );
  }, [map, points]);
  return null;
}

export default function MapCanvas({
  points,
  path,
}: {
  points: MapPoint[];
  path?: [number, number][];
}) {
  const center: [number, number] = points.length
    ? [points[0].lat, points[0].lng]
    : [35.68, 139.76];

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {path && path.length > 1 && (
        <Polyline positions={path} pathOptions={{ color: "#7c4dff", weight: 4, dashArray: "8 8" }} />
      )}
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={pinIcon(p.color, p.index)}>
          <Popup>
            <strong>{p.label}</strong>
          </Popup>
        </Marker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}
