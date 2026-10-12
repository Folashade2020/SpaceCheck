"use client";

import dynamic from "next/dynamic";
import type { MapProperty } from "./AreaMap";

const AreaMap = dynamic(() => import("./AreaMap"), {
  ssr: false,
  loading: () => (
    <p className="rounded-2xl bg-white p-4 text-sm text-zinc-600">
      Loading map…
    </p>
  ),
});

export default function MapView({ properties }: { properties: MapProperty[] }) {
  return <AreaMap properties={properties} />;
}
