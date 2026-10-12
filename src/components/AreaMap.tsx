"use client";

import { MapContainer, TileLayer, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { approxCoordsFor } from "@/lib/locations";

export interface MapProperty {
  id: string;
  property_type?: string | null;
  bedrooms?: number | null;
  rent?: number | null;
  neighborhood?: string | null;
  general_area?: string | null;
  area?: string | null;
  estate?: string | null;
  score?: number | null;
}

// Approximate area circles only — center is the neighborhood centroid,
// radius 600m. Never an exact house pin (privacy first).
export default function AreaMap({ properties }: { properties: MapProperty[] }) {
  const points = properties
    .map((p) => ({
      property: p,
      center: approxCoordsFor(p.neighborhood ?? p.general_area, p.area),
    }))
    .filter((x) => x.center !== null);

  const center =
    points.length > 0
      ? (points[0].center as { lat: number; lng: number })
      : { lat: 6.5244, lng: 3.3792 }; // Lagos fallback

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={11}
        scrollWheelZoom={false}
        style={{ height: "420px", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.map(({ property: p, center: c }) => (
          <Circle
            key={p.id}
            center={[c!.lat, c!.lng]}
            radius={600}
            pathOptions={{ color: "#047857", weight: 2, fillColor: "#047857", fillOpacity: 0.18 }}
          >
            <Popup>
              <strong>
                {p.property_type ?? "Property"} · {p.bedrooms ?? "?"} bed
              </strong>
              <br />₦{p.rent ?? "Not provided"} ·{" "}
              {p.neighborhood ?? p.general_area ?? ""}
              {p.score != null ? (
                <>
                  <br />
                  Fit: {p.score}/100
                </>
              ) : null}
              <br />
              <Link href={`/properties/${p.id}`}>Open details</Link>
            </Popup>
          </Circle>
        ))}
      </MapContainer>
      <p className="px-4 py-2 text-xs text-zinc-500">
        Circles show approximate neighborhoods (~600m), not exact houses.{" "}
        {properties.length - points.length > 0 &&
          `${properties.length - points.length} listing(s) without a mappable area are list-only.`}
      </p>
    </div>
  );
}
