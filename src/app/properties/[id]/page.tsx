import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";

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
    .select("id, source_type, electricity, flood, water, road_access, network_quality, security_experience, listing_accuracy, comment, created_at")
    .eq("property_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  const reportList = reports ?? [];

  // Effective verification label (derived, no DB write so visitors can contribute under RLS).
  const effectiveStatus =
    reportList.length >= 2
      ? "Community reported"
      : reportList.length === 1
        ? "Reported by users"
        : String(property.verification_status ?? "Limited information");

  // Conflict detection (PRD Sec 10): show disagreements, never call anyone a liar.
  function distinct(values: unknown[]) {
    const seen = new Set<string>();
    for (const v of values) {
      const s = String(v ?? "").trim().toLowerCase();
      if (s && s !== "not provided") seen.add(s);
    }
    return [...seen];
  }
  const floodValues = distinct([
    property.flood,
    ...reportList.map((r) => r.flood),
  ]);
  const electricityValues = distinct([
    property.electricity,
    ...reportList.map((r) => r.electricity),
  ]);
  const hasConflict = floodValues.length > 1 || electricityValues.length > 1;

  // Personal fit (PRD Sec 12-13): score + confidence separate, never invented.
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
  const fit = calculateFitScore(property, prefs);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500">
          Section 1 — The Property · {display(effectiveStatus)}
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
          Section 2 — Your Property Fit
        </p>
        {fit.score === null ? (
          <p className="mt-1 text-sm text-zinc-600">
            {fit.concerns[0] ?? "Not enough information."}{" "}
            <Link href="/preferences" className="underline">
              Set preferences
            </Link>
          </p>
        ) : (
          <>
            <p className="mt-1 text-2xl font-bold">
              {fit.score}/100{" "}
              <span className="text-sm font-normal text-zinc-500">
                Confidence: {fit.confidence}
              </span>
            </p>
            {fit.reasons.length > 0 && (
              <>
                <p className="mt-2 text-sm font-semibold">Why this matches you</p>
                <ul className="list-disc pl-5 text-sm text-zinc-600">
                  {fit.reasons.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </>
            )}
            {fit.concerns.length > 0 && (
              <>
                <p className="mt-2 text-sm font-semibold">Things to consider</p>
                <ul className="list-disc pl-5 text-sm text-amber-700">
                  {fit.concerns.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
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
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-zinc-500">
            Section 4 — What People Say ({reportList.length})
          </p>
          <Link
            href={`/properties/${id}/report`}
            className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white"
          >
            Report what you found
          </Link>
        </div>
        {hasConflict && (
          <p className="mt-2 rounded bg-amber-50 p-2 text-sm text-amber-800">
            Conflicting information — verify before deciding. Reports disagree
            on {floodValues.length > 1 ? "flooding" : "electricity"}.
          </p>
        )}
        {reportList.length === 0 && (
          <p className="mt-1 text-sm text-zinc-600">
            No community reports yet. Be the first to report after visiting.
          </p>
        )}
        <ul className="mt-2 space-y-2 text-sm">
          {reportList.map((r) => (
            <li key={r.id} className="rounded border border-zinc-200 p-3">
              <p>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-semibold">
                  {display(r.source_type)}
                </span>{" "}
                {r.listing_accuracy && (
                  <span className="text-xs text-zinc-500">
                    Listing accuracy: {display(r.listing_accuracy)}
                  </span>
                )}
              </p>
              <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[13px] text-zinc-700">
                {r.electricity && <div>Electricity: {display(r.electricity)}</div>}
                {r.flood && <div>Flood: {display(r.flood)}</div>}
                {r.water && <div>Water: {display(r.water)}</div>}
                {r.road_access && <div>Road: {display(r.road_access)}</div>}
                {r.network_quality && <div>Network: {display(r.network_quality)}</div>}
                {r.security_experience && (
                  <div>Security: {display(r.security_experience)}</div>
                )}
              </dl>
              {r.comment && (
                <p className="mt-1 text-zinc-600">“{r.comment}”</p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
