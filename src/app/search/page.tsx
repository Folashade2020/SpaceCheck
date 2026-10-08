import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

export default async function SearchPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let prefs = null;
  if (user) {
    const { data } = await supabase
      .from("preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) {
      prefs = {
        areas: Array.isArray(data.areas) ? data.areas : [],
        budget_min: data.budget_min ?? null,
        budget_max: data.budget_max ?? null,
        property_type: data.property_type ?? null,
        priorities: (Array.isArray(data.priorities) ? data.priorities : []) as PriorityKey[],
      };
    }
  }

  // Public read: only public columns. exact_lat/exact_lng/exact_address are never selected here.
  const { data: properties, error } = await supabase
    .from("property_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  const ranked = (properties ?? [])
    .map((p) => ({ property: p, fit: calculateFitScore(p, prefs) }))
    .sort((a, b) => (b.fit.score ?? -1) - (a.fit.score ?? -1));

  const hasPrefs = prefs && (prefs.areas.length > 0 || prefs.priorities.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {hasPrefs ? "Best Match for You" : "Search properties"}
        </h1>
        <div className="flex gap-2">
          <Link
            href="/preferences"
            className="rounded-full border px-4 py-2 text-sm hover:bg-zinc-100"
          >
            {hasPrefs ? "Edit preferences" : "Set preferences"}
          </Link>
          <Link
            href="/submit"
            className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white"
          >
            List a property
          </Link>
        </div>
      </div>
      <p className="text-sm text-zinc-600">
        {hasPrefs
          ? "Ranked by your personal Fit Score. Score and confidence shown separately — missing info lowers confidence."
          : "Set preferences to see Best Match for You with personal Fit Scores."}
      </p>

      {error && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">
          Database not connected yet: {error.message}. Run supabase/schema.sql
          in your Supabase project.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {ranked.map(({ property: p, fit }) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="rounded-2xl bg-white p-5 shadow-sm hover:shadow"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-500">
                {display(p.verification_status)} ·{" "}
                {display(p.general_area ?? p.area)}
              </p>
              {fit.score !== null ? (
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-xs text-white">
                  {fit.score}/100 · {fit.confidence}
                </span>
              ) : (
                <span className="rounded-full border px-2 py-0.5 text-xs text-zinc-500">
                  No score
                </span>
              )}
            </div>
            <h2 className="mt-1 font-semibold">
              {display(p.property_type)} · {display(p.bedrooms)} bed · ₦
              {display(p.rent)}
            </h2>
            <p className="mt-2 text-sm text-zinc-600">
              Flood: {display(p.flood)} · Electricity:{" "}
              {display(p.electricity)} · Water: {display(p.water)}
            </p>
            {fit.concerns[0] && (
              <p className="mt-1 text-xs text-amber-700">{fit.concerns[0]}</p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
              Exact address hidden — general area only.
            </p>
          </Link>
        ))}
      </div>

      {(!properties || properties.length === 0) && !error && (
        <p className="rounded bg-white p-4 text-sm text-zinc-600">
          No properties yet. List one via “List a property”.
        </p>
      )}
    </div>
  );
}
