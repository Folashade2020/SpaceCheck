import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";
import { saveProperty, unsaveProperty, requestViewing, updateAvailability } from "./actions";
import ShareButton from "./share-button";

function display(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

export default async function PropertyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; viewing?: string; flagged?: string }>;
}) {
  const { id } = await params;
  const { error: queryError, viewing, flagged } = await searchParams;
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

  // Trust flags (PRD Sec 22): public counts by reason.
  const { data: flags } = await supabase
    .from("listing_reports")
    .select("reason")
    .eq("property_id", id);
  const flagCounts: Record<string, number> = {};
  for (const f of flags ?? []) {
    flagCounts[f.reason] = (flagCounts[f.reason] ?? 0) + 1;
  }
  const totalFlags = Object.values(flagCounts).reduce((a, b) => a + b, 0);

  // Ownership + viewing requests (owners see requests for their properties).
  const isOwner = !!user && property.owner_id === user.id;
  let ownerRequests: { id: string; message: string | null; status: string; created_at: string }[] = [];
  if (isOwner) {
    const { data } = await supabase
      .from("viewing_requests")
      .select("id, message, status, created_at")
      .eq("property_id", id)
      .order("created_at", { ascending: false })
      .limit(20);
    ownerRequests = data ?? [];
  }

  // Save state + share text (PRD Sec 24: share includes score + warnings).
  let isSaved = false;
  if (user) {
    const { data: save } = await supabase
      .from("saves")
      .select("id")
      .eq("user_id", user.id)
      .eq("property_id", id)
      .maybeSingle();
    isSaved = !!save;
  }
  const shareText = [
    `${display(property.property_type)} · ${display(property.bedrooms)} bed · ₦${display(property.rent)} · ${display(property.general_area)}`,
    fit.score !== null
      ? `Fit: ${fit.score}/100 (${fit.confidence} confidence)`
      : "Fit: no score yet",
    fit.reasons.length > 0 ? `Good: ${fit.reasons.slice(0, 2).join("; ")}` : "",
    fit.concerns.length > 0 ? `Watch: ${fit.concerns.slice(0, 2).join("; ")}` : "",
    `SpaceCheck: know what you're moving into.`,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link href="/search" className="text-sm underline">
          ← Back to search
        </Link>
        <div className="flex gap-2">
          <ShareButton text={shareText} />
          {user ? (
            isSaved ? (
              <form action={unsaveProperty.bind(null, id)}>
                <button
                  type="submit"
                  className="rounded-full border px-3 py-1 text-xs hover:bg-zinc-100"
                >
                  ★ Saved
                </button>
              </form>
            ) : (
              <form action={saveProperty.bind(null, id)}>
                <button
                  type="submit"
                  className="rounded-full border px-3 py-1 text-xs hover:bg-zinc-100"
                >
                  ☆ Save
                </button>
              </form>
            )
          ) : (
            <Link
              href="/login"
              className="rounded-full border px-3 py-1 text-xs hover:bg-zinc-100"
            >
              ☆ Save
            </Link>
          )}
        </div>
      </div>
      {queryError && (
        <p className="rounded bg-red-50 p-2 text-sm text-red-700">{queryError}</p>
      )}
      {viewing === "requested" && (
        <p className="rounded bg-green-50 p-2 text-sm text-green-800">
          Viewing requested. The owner/agent will contact you.
        </p>
      )}
      {flagged === "1" && (
        <p className="rounded bg-green-50 p-2 text-sm text-green-800">
          Thanks — your flag is now visible to other renters.
        </p>
      )}
      {totalFlags > 0 && (
        <p className="rounded bg-amber-50 p-2 text-sm text-amber-800">
          ⚠ {totalFlags} user flag{totalFlags > 1 ? "s" : ""}:{" "}
          {Object.entries(flagCounts)
            .map(([reason, n]) => `${n}× ${reason}`)
            .join(" · ")}
        </p>
      )}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500">
          Section 1 — The Property · {display(effectiveStatus)}
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {display(property.property_type)} · {display(property.bedrooms)} bed
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Rent: ₦{display(property.rent)} · Area:{" "}
          {display(property.neighborhood ?? property.general_area)}
          {property.area ? `, ${display(property.area)}` : ""} · Availability:{" "}
          {display(property.availability)}
        </p>
        {property.estate && (
          <p className="mt-1 text-sm text-zinc-600">
            Estate: {display(property.estate)} (text only — no exact pin publicly)
          </p>
        )}
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
          <div className="flex gap-2">
            <Link
              href={`/properties/${id}/report`}
              className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white"
            >
              Report what you found
            </Link>
            <Link
              href={`/properties/${id}/flag`}
              className="rounded-full border px-3 py-1 text-xs hover:bg-zinc-100"
            >
              Flag listing
            </Link>
          </div>
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

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-zinc-500">
          Contact + Viewing
        </p>
        <p className="mt-1 text-sm text-zinc-600">
          Contact: {display(property.contact_name)} · Exact phone/address are
          shared only when the owner accepts your viewing request (privacy first).
        </p>
        {user ? (
          <form action={requestViewing.bind(null, id)} className="mt-3 space-y-2">
            <label className="block text-sm font-medium text-zinc-900">
              Message to owner/agent (optional)
              <textarea
                name="message"
                rows={2}
                placeholder="e.g. Free to inspect Saturday morning"
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </label>
            <button
              type="submit"
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white"
            >
              Request a Viewing
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="mt-3 inline-block rounded-full bg-zinc-900 px-5 py-2 text-sm text-white"
          >
            Log in to request a viewing
          </Link>
        )}
      </div>

      {isOwner && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-zinc-500">
            Owner controls
          </p>
          <form action={updateAvailability.bind(null, id)} className="mt-2 flex gap-2">
            <select
              name="availability"
              defaultValue={String(property.availability ?? "Available")}
              className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="Available">Available</option>
              <option value="Available soon">Available soon</option>
              <option value="No longer available">No longer available</option>
            </select>
            <button
              type="submit"
              className="rounded-full border px-4 py-2 text-sm hover:bg-zinc-100"
            >
              Update
            </button>
          </form>
          <p className="mt-1 text-xs text-zinc-500">
            “No longer available” keeps the page visible for area research (PRD Sec 23).
          </p>
          <h3 className="mt-4 text-sm font-semibold">
            Viewing requests ({ownerRequests.length})
          </h3>
          {ownerRequests.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-600">No requests yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-zinc-600">
              {ownerRequests.map((r) => (
                <li key={r.id} className="rounded border p-2">
                  {r.message ?? "(no message)"} · {r.status} ·{" "}
                  {new Date(r.created_at).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
