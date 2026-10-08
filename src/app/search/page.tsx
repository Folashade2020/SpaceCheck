import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

export default async function SearchPage() {
  const supabase = await createClient();

  // Public read: only public columns. exact_lat/exact_lng/exact_address are never selected here.
  const { data: properties, error } = await supabase
    .from("property_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Search properties</h1>
      <p className="text-sm text-zinc-600">
        Best Match for You (Fit Score) arrives in Phase 2. For now: newest
        properties with evidence labels.
      </p>

      {error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">
          Database not connected yet: {error.message}. Run supabase/schema.sql
          in your Supabase project.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {(properties ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="rounded-2xl bg-white p-5 shadow-sm hover:shadow"
          >
            <p className="text-xs font-semibold text-zinc-500">
              {display(p.verification_status)} ·{" "}
              {display(p.general_area ?? p.area)}
            </p>
            <h2 className="mt-1 font-semibold">
              {display(p.property_type)} · {display(p.bedrooms)} bed · ₦
              {display(p.rent)}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Flood: {display(p.flood)} · Electricity:{" "}
              {display(p.electricity)} · Water: {display(p.water)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Exact address hidden — general area only.
            </p>
          </Link>
        ))}
      </div>

      {(!properties || properties.length === 0) && !error && (
        <p className="rounded bg-white p-4 text-sm text-zinc-600">
          No properties yet. Insert a test row in Supabase (see README Phase 0
          test) and refresh.
        </p>
      )}
    </div>
  );
}
