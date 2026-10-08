import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

function display(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: property, error } = await supabase
    .from("property_public")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !property) {
    notFound();
  }

  const { data: reports } = await supabase
    .from("reports")
    .select("id, source_type, electricity, flood, water, road_access, network_quality, listing_accuracy, comment, created_at")
    .eq("property_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500">
          Section 1 — The Property · {display(property.verification_status)}
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {display(property.property_type)} · {display(property.bedrooms)} bed
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Rent: ₦{display(property.rent)} · Area:{" "}
          {display(property.general_area)} · Availability:{" "}
          {display(property.availability)}
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          Privacy: exact address and exact coordinates are never shown publicly.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500">
          Section 2 — Your Property Fit (Phase 2)
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          Limited information — not enough data to calculate a reliable score
          yet.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500">
          Section 3 — About the Location
        </p>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <div>Flood: {display(property.flood)}</div>
          <div>Electricity: {display(property.electricity)}</div>
          <div>Water: {display(property.water)}</div>
          <div>Road: {display(property.road_access)}</div>
          <div>Network: {display(property.network_quality)}</div>
          <div>Security features: {display(property.security_features)}</div>
        </dl>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500">
          Section 4 — What People Say
        </p>
        {(reports ?? []).length === 0 && (
          <p className="mt-1 text-sm text-zinc-600">
            No community reports yet. Be the first to report after visiting.
          </p>
        )}
        <ul className="mt-2 space-y-2 text-sm">
          {(reports ?? []).map((r) => (
            <li key={r.id} className="rounded border p-2">
              <span className="font-semibold">{display(r.source_type)}</span> ·{" "}
              {display(r.comment)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
