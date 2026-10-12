import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";
import { saveProperty, unsaveProperty, requestViewing, updateAvailability } from "./actions";
import ShareButton from "./share-button";
import { EvidenceBadge, ScoreRing } from "@/components/ui";

function display(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

function SourceLabel({ source }: { source: string }) {
  const labels: Record<string, string> = {
    owner_agent: "Owner / Agent",
    current_resident: "Current resident",
    former_resident: "Former resident",
    visitor: "Visitor",
  };
  return <>{labels[source] ?? source}</>;
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
    `${display(property.property_type)} · ${display(property.bedrooms)} bed · ₦${display(property.rent)} · ${display(property.neighborhood ?? property.general_area)}`,
    fit.score !== null
      ? `Fit: ${fit.score}/100 (${fit.confidence} confidence)`
      : "Fit: no score yet",
    fit.reasons.length > 0 ? `Good: ${fit.reasons.slice(0, 2).join("; ")}` : "",
    fit.concerns.length > 0 ? `Watch: ${fit.concerns.slice(0, 2).join("; ")}` : "",
    `SpaceCheck: check the space before you commit.`,
  ]
    .filter(Boolean)
    .join("\n");

  const photos: string[] = Array.isArray(property.photos) ? property.photos : [];
  const facts: { label: string; value: unknown }[] = [
    { label: "Flooding", value: property.flood },
    { label: "Electricity", value: property.electricity },
    { label: "Water", value: property.water },
    { label: "Road / access", value: property.road_access },
    { label: "Network", value: property.network_quality },
    { label: "Security features", value: property.security_features },
  ];
  const missing = facts.filter(
    (f) => !f.value || String(f.value).trim() === "" || String(f.value) === "Not provided"
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
        <Link href="/search" style={{ fontSize: "0.87rem", fontWeight: 600, color: "#047857" }}>
          ← Back to results
        </Link>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <ShareButton text={shareText} />
          {user ? (
            isSaved ? (
              <form action={unsaveProperty.bind(null, id)}>
                <button type="submit" className="btn-secondary btn-sm">★ Saved</button>
              </form>
            ) : (
              <form action={saveProperty.bind(null, id)}>
                <button type="submit" className="btn-secondary btn-sm">☆ Save</button>
              </form>
            )
          ) : (
            <Link href="/login" className="btn-secondary btn-sm">☆ Save</Link>
          )}
        </div>
      </div>

      {queryError && (
        <p style={{ borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>{queryError}</p>
      )}
      {viewing === "requested" && (
        <p style={{ borderRadius: 10, background: "#ecfdf5", color: "#065f46", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          Viewing requested. The owner/agent will contact you.
        </p>
      )}
      {flagged === "1" && (
        <p style={{ borderRadius: 10, background: "#ecfdf5", color: "#065f46", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          Thanks — your flag is now visible to other renters.
        </p>
      )}
      {totalFlags > 0 && (
        <p style={{ borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          ⚠ {totalFlags} user flag{totalFlags > 1 ? "s" : ""}:{" "}
          {Object.entries(flagCounts).map(([reason, n]) => `${n}× ${reason}`).join(" · ")}
        </p>
      )}

      {/* Hero */}
      <section className="card" style={{ overflow: "hidden" }}>
        {photos.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 4, background: "#e7e5e4" }}>
            <img src={photos[0]} alt="" style={{ width: "100%", height: 300, objectFit: "cover" }} />
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4 }}>
              {[photos[1], photos[2]].map((src, i) =>
                src ? (
                  <img key={i} src={src} alt="" loading="lazy" style={{ width: "100%", height: 148, objectFit: "cover" }} />
                ) : (
                  <div key={i} style={{ background: "#f5f5f4" }} />
                )
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: "#f5f5f4", padding: "2.2rem", textAlign: "center", color: "#a8a29e", fontWeight: 600, fontSize: "0.9rem" }}>
            No photos yet — inspect in person before deciding.
          </div>
        )}
        <div style={{ padding: "1.3rem 1.4rem" }}>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
            <EvidenceBadge status={effectiveStatus} />
            <span style={{ fontSize: "0.82rem", color: "#78716c", fontWeight: 600 }}>
              {display(property.neighborhood ?? property.general_area)}
              {property.area ? `, ${display(property.area)}` : ""}
              {property.estate ? ` · ${display(property.estate)}` : ""}
            </span>
          </div>
          <h1 style={{ marginTop: "0.5rem", fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            {display(property.property_type)} · {display(property.bedrooms)} bed
            {property.bathrooms ? ` · ${display(property.bathrooms)} bath` : ""}
          </h1>
          <p style={{ marginTop: "0.3rem", fontSize: "1.25rem", fontWeight: 800, color: "#047857" }}>
            ₦{display(property.rent)} <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#78716c" }}>/ year · {display(property.availability)}</span>
          </p>
          <p style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#78716c" }}>
            Exact address and coordinates are never published — general area only.
          </p>
        </div>
      </section>

      {/* Signature intelligence report */}
      <section className="card" style={{ padding: "1.4rem", borderColor: "#047857", borderWidth: 2 }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#047857", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          SpaceCheck intelligence report
        </p>
        {fit.score === null ? (
          <div style={{ marginTop: "0.7rem" }}>
            <p style={{ fontSize: "0.95rem", color: "#57534e" }}>
              {fit.concerns[0] ?? "Not enough information for a reliable score."}
            </p>
            <Link href="/preferences" className="btn-primary btn-sm" style={{ marginTop: "0.7rem" }}>
              Set preferences to get your score
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem", marginTop: "0.8rem" }}>
            <ScoreRing score={fit.score} />
            <div style={{ flex: "1 1 240px" }}>
              <p style={{ fontSize: "0.85rem", color: "#57534e" }}>
                Confidence: <strong>{fit.confidence}</strong> · This measures how
                well the property matches <em>your</em> stated preferences — not
                overall quality or safety.
              </p>
              {fit.reasons.length > 0 && (
                <>
                  <p style={{ marginTop: "0.6rem", fontWeight: 750, fontSize: "0.9rem" }}>Strengths for you</p>
                  <ul style={{ fontSize: "0.88rem", color: "#44403c", lineHeight: 1.65 }}>
                    {fit.reasons.map((r) => <li key={r}>✓ {r}</li>)}
                  </ul>
                </>
              )}
              {fit.concerns.length > 0 && (
                <>
                  <p style={{ marginTop: "0.6rem", fontWeight: 750, fontSize: "0.9rem" }}>Unmet needs & concerns</p>
                  <ul style={{ fontSize: "0.88rem", color: "#92400e", lineHeight: 1.65 }}>
                    {fit.concerns.map((c) => <li key={c}>! {c}</li>)}
                  </ul>
                </>
              )}
            </div>
          </div>
        )}
        {missing.length > 0 && (
          <div style={{ marginTop: "0.9rem", background: "#FFFBEB", border: "1px solid #fde68a", borderRadius: 10, padding: "0.7rem 0.9rem" }}>
            <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#92400e" }}>
              Missing or unverified ({missing.length})
            </p>
            <p style={{ fontSize: "0.83rem", color: "#57534e" }}>
              {missing.map((f) => f.label).join(" · ")} — ask about these on your visit.
            </p>
          </div>
        )}
        <div style={{ marginTop: "0.9rem", background: "#FAF9F6", border: "1px solid #e7e5e4", borderRadius: 10, padding: "0.7rem 0.9rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>Before you pay, verify</p>
          <ul style={{ fontSize: "0.83rem", color: "#57534e", lineHeight: 1.7 }}>
            <li>· Visit after rainfall if flooding matters to you</li>
            <li>· Confirm electricity hours and meter type with residents</li>
            <li>· Test road access and network on your own devices</li>
            <li>· Never pay before a physical inspection</li>
          </ul>
        </div>
      </section>

      {/* Location facts with evidence */}
      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Property & location</h2>
        <dl style={{ marginTop: "0.7rem", display: "grid", gap: "0.55rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", fontSize: "0.88rem" }}>
          {facts.map((f) => (
            <div key={f.label} style={{ border: "1px solid #e7e5e4", borderRadius: 10, padding: "0.6rem 0.75rem" }}>
              <dt style={{ fontSize: "0.75rem", fontWeight: 700, color: "#78716c" }}>{f.label}</dt>
              <dd style={{ marginTop: "0.15rem", fontWeight: 600 }}>{display(f.value)}</dd>
            </div>
          ))}
        </dl>
        {property.nearby_places && (
          <p style={{ marginTop: "0.6rem", fontSize: "0.87rem", color: "#57534e" }}>
            Nearby: {display(property.nearby_places)}
          </p>
        )}
      </section>

      {/* Community */}
      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.6rem", flexWrap: "wrap" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>
            Community intelligence ({reportList.length})
          </h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Link href={`/properties/${id}/report`} className="btn-primary btn-sm">Report visit</Link>
            <Link href={`/properties/${id}/flag`} className="btn-secondary btn-sm">Flag listing</Link>
          </div>
        </div>
        <p style={{ marginTop: "0.35rem", fontSize: "0.83rem", color: "#78716c" }}>
          Reports describe the contributor&apos;s own experience near this property — a report from one estate does not prove conditions street-wide.
        </p>
        {hasConflict && (
          <p style={{ marginTop: "0.6rem", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "0.6rem 0.8rem", fontSize: "0.86rem" }}>
            Conflicting information — verify before deciding. Reports disagree on {floodValues.length > 1 ? "flooding" : "electricity"}.
          </p>
        )}
        {reportList.length === 0 ? (
          <p style={{ marginTop: "0.6rem", fontSize: "0.88rem", color: "#57534e" }}>
            No community reports yet. Be the first to report after visiting.
          </p>
        ) : (
          <ul style={{ marginTop: "0.7rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {reportList.map((r) => (
              <li key={r.id} style={{ border: "1px solid #e7e5e4", borderRadius: 10, padding: "0.75rem 0.9rem", fontSize: "0.87rem" }}>
                <p style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span className="badge badge-brand"><SourceLabel source={String(r.source_type)} /></span>
                  <span style={{ fontSize: "0.78rem", color: "#78716c" }}>
                    {new Date(r.created_at).toLocaleDateString()}
                    {r.listing_accuracy ? ` · Listing: ${display(r.listing_accuracy)}` : ""}
                  </span>
                </p>
                <dl style={{ marginTop: "0.4rem", display: "grid", gap: "0.2rem 0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", color: "#44403c" }}>
                  {r.electricity && <div>Power: {display(r.electricity)}</div>}
                  {r.flood && <div>Flood: {display(r.flood)}</div>}
                  {r.water && <div>Water: {display(r.water)}</div>}
                  {r.road_access && <div>Road: {display(r.road_access)}</div>}
                  {r.network_quality && <div>Network: {display(r.network_quality)}</div>}
                  {r.security_experience && <div>Security: {display(r.security_experience)}</div>}
                </dl>
                {r.comment && <p style={{ marginTop: "0.35rem", color: "#57534e" }}>“{r.comment}”</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contact + owner */}
      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Contact & viewing</h2>
        <p style={{ marginTop: "0.35rem", fontSize: "0.87rem", color: "#57534e" }}>
          Contact: {display(property.contact_name)} · Phone/address are shared only when the owner accepts your request.
        </p>
        {user ? (
          <form action={requestViewing.bind(null, id)} style={{ marginTop: "0.7rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <label className="label">
              Message to owner/agent (optional)
              <textarea name="message" rows={2} placeholder="e.g. Free to inspect Saturday morning" className="input" />
            </label>
            <div><button type="submit" className="btn-primary">Request a Viewing</button></div>
          </form>
        ) : (
          <Link href="/login" className="btn-primary" style={{ marginTop: "0.7rem" }}>
            Log in to request a viewing
          </Link>
        )}
      </section>

      {isOwner && (
        <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
          <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Owner controls</h2>
          <form action={updateAvailability.bind(null, id)} style={{ marginTop: "0.6rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <select name="availability" defaultValue={String(property.availability ?? "Available")} className="input" style={{ marginTop: 0, maxWidth: 240 }}>
              <option value="Available">Available</option>
              <option value="Available soon">Available soon</option>
              <option value="No longer available">No longer available</option>
            </select>
            <button type="submit" className="btn-secondary btn-sm">Update</button>
          </form>
          <h3 style={{ marginTop: "0.9rem", fontWeight: 700, fontSize: "0.9rem" }}>
            Viewing requests ({ownerRequests.length})
          </h3>
          {ownerRequests.length === 0 ? (
            <p style={{ fontSize: "0.87rem", color: "#57534e" }}>No requests yet.</p>
          ) : (
            <ul style={{ marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.87rem" }}>
              {ownerRequests.map((r) => (
                <li key={r.id} style={{ border: "1px solid #e7e5e4", borderRadius: 8, padding: "0.5rem 0.7rem" }}>
                  {r.message ?? "(no message)"} · {r.status} · {new Date(r.created_at).toLocaleDateString()}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
