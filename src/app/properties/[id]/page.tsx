import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";
import { saveProperty, unsaveProperty, requestViewing, updateAvailability, confirmViewingRequest, declineViewingRequest } from "./actions";
import ShareButton from "./share-button";
import NdpaConsent from "@/components/NdpaConsent";
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

  // Privacy guard (NDPA): exact address + phone come from the base table,
  // which RLS restricts to the owner and confirmed renters only.
  // Everyone else sees the public view (no exact address, no phone).
  let privateContact: { exact_address: string | null; contact_phone: string | null } = {
    exact_address: null,
    contact_phone: null,
  };
  let myViewingStatus: string | null = null;
  if (user && !isOwner) {
    const { data: mine } = await supabase
      .from("viewing_requests")
      .select("status")
      .eq("property_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    myViewingStatus = mine?.status ?? null;
  }
  if (isOwner || myViewingStatus === "confirmed") {
    const { data: priv } = await supabase
      .from("properties")
      .select("exact_address, contact_phone")
      .eq("id", id)
      .maybeSingle();
    if (priv) {
      privateContact = {
        exact_address: priv.exact_address ?? null,
        contact_phone: priv.contact_phone ?? null,
      };
    }
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
    `${display(property.property_type)} Â· ${display(property.bedrooms)} bed Â· â‚¦${display(property.rent)} Â· ${display(property.neighborhood ?? property.general_area)}`,
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
        <Link href="/search" style={{ fontSize: "0.87rem", fontWeight: 600, color: "#00a86b" }}>
          â† Back to results
        </Link>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <ShareButton text={shareText} />
          {user ? (
            isSaved ? (
              <form action={unsaveProperty.bind(null, id)}>
                <button type="submit" className="btn-secondary btn-sm">â˜… Saved</button>
              </form>
            ) : (
              <form action={saveProperty.bind(null, id)}>
                <button type="submit" className="btn-secondary btn-sm">â˜† Save</button>
              </form>
            )
          ) : (
            <Link href="/login" className="btn-secondary btn-sm">â˜† Save</Link>
          )}
        </div>
      </div>

      {queryError && (
        <p style={{ borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>{queryError}</p>
      )}
      {viewing === "requested" && (
        <p style={{ borderRadius: 10, background: "#ecfdf5", color: "#007a4d", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          Viewing requested. The owner/agent will contact you.
        </p>
      )}
      {flagged === "1" && (
        <p style={{ borderRadius: 10, background: "#ecfdf5", color: "#007a4d", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          Thanks â€” your flag is now visible to other renters.
        </p>
      )}
      {totalFlags > 0 && (
        <p style={{ borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          âš  {totalFlags} user flag{totalFlags > 1 ? "s" : ""}:{" "}
          {Object.entries(flagCounts).map(([reason, n]) => `${n}Ã— ${reason}`).join(" Â· ")}
        </p>
      )}

      {/* Hero */}
      <section className="card" style={{ overflow: "hidden" }}>
        {photos.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 4, background: "#e2e8f0" }}>
            <img src={photos[0]} alt="" style={{ width: "100%", height: 300, objectFit: "cover" }} />
            <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4 }}>
              {[photos[1], photos[2]].map((src, i) =>
                src ? (
                  <img key={i} src={src} alt="" loading="lazy" style={{ width: "100%", height: 148, objectFit: "cover" }} />
                ) : (
                  <div key={i} style={{ background: "#f1f5f9" }} />
                )
              )}
            </div>
          </div>
        ) : (
          <div style={{ background: "#f1f5f9", padding: "2.2rem", textAlign: "center", color: "#94a3b8", fontWeight: 600, fontSize: "0.9rem" }}>
            No photos yet â€” inspect in person before deciding.
          </div>
        )}
        <div style={{ padding: "1.3rem 1.4rem" }}>
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", alignItems: "center" }}>
            <EvidenceBadge status={effectiveStatus} />
            <span style={{ fontSize: "0.82rem", color: "#64748b", fontWeight: 600 }}>
              {display(property.neighborhood ?? property.general_area)}
              {property.area ? `, ${display(property.area)}` : ""}
              {property.estate ? ` Â· ${display(property.estate)}` : ""}
            </span>
          </div>
          <h1 style={{ marginTop: "0.5rem", fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            {display(property.property_type)} Â· {display(property.bedrooms)} bed
            {property.bathrooms ? ` Â· ${display(property.bathrooms)} bath` : ""}
          </h1>
          <p style={{ marginTop: "0.3rem", fontSize: "1.25rem", fontWeight: 800, color: "#00a86b" }}>
            â‚¦{display(property.rent)} <span style={{ fontSize: "0.82rem", fontWeight: 500, color: "#64748b" }}>/ year Â· {display(property.availability)}</span>
          </p>
          {Number.isFinite(Number(property.rent)) && (
            <p style={{ fontSize: "0.82rem", color: "#64748b" }}>
              â‰ˆ â‚¦{Math.round(Number(property.rent) / 12).toLocaleString("en-NG")}/month equivalent (estimate â€” confirm payment terms with the lister)
            </p>
          )}
          <p style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#64748b" }}>
            Exact address and coordinates are never published â€” general area only.
          </p>
        </div>
      </section>

      {/* Signature intelligence report + facts + community */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", minWidth: 0 }}>
      <section className="card" style={{ padding: "1.4rem", borderColor: "#00a86b", borderWidth: 2 }}>
        <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#00a86b", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          SpaceCheck intelligence report
        </p>
        {fit.score === null ? (
          <div style={{ marginTop: "0.7rem" }}>
            <p style={{ fontSize: "0.95rem", color: "#475569" }}>
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
              <p style={{ fontSize: "0.85rem", color: "#475569" }}>
                Confidence: <strong>{fit.confidence}</strong> Â· This measures how
                well the property matches <em>your</em> stated preferences â€” not
                overall quality or safety.
              </p>
              {fit.reasons.length > 0 && (
                <>
                  <p style={{ marginTop: "0.6rem", fontWeight: 750, fontSize: "0.9rem" }}>Strengths for you</p>
                  <ul style={{ fontSize: "0.88rem", color: "#334155", lineHeight: 1.65 }}>
                    {fit.reasons.map((r) => <li key={r}>âœ“ {r}</li>)}
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
            <p style={{ fontSize: "0.83rem", color: "#475569" }}>
              {missing.map((f) => f.label).join(" Â· ")} â€” ask about these on your visit.
            </p>
          </div>
        )}
        <div style={{ marginTop: "0.9rem", background: "#F8FAFC", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.7rem 0.9rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700 }}>Before you pay, verify</p>
          <ul style={{ fontSize: "0.83rem", color: "#475569", lineHeight: 1.7 }}>
            <li>Â· Visit after rainfall if flooding matters to you</li>
            <li>Â· Confirm electricity hours and meter type with residents</li>
            <li>Â· Test road access and network on your own devices</li>
            <li>Â· Never pay before a physical inspection</li>
          </ul>
        </div>
      </section>

      {/* Location facts with evidence */}
      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <h2 style={{ fontWeight: 800, fontSize: "1.1rem" }}>Property & location</h2>
        <dl style={{ marginTop: "0.7rem", display: "grid", gap: "0.55rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", fontSize: "0.88rem" }}>
          {facts.map((f) => (
            <div key={f.label} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.6rem 0.75rem" }}>
              <dt style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b" }}>{f.label}</dt>
              <dd style={{ marginTop: "0.15rem", fontWeight: 600 }}>{display(f.value)}</dd>
            </div>
          ))}
        </dl>
        {property.nearby_places && (
          <p style={{ marginTop: "0.6rem", fontSize: "0.87rem", color: "#475569" }}>
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
        <p style={{ marginTop: "0.35rem", fontSize: "0.83rem", color: "#64748b" }}>
          Reports describe the contributor&apos;s own experience near this property â€” a report from one estate does not prove conditions street-wide.
        </p>
        {hasConflict && (
          <p style={{ marginTop: "0.6rem", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", padding: "0.6rem 0.8rem", fontSize: "0.86rem" }}>
            Conflicting information â€” verify before deciding. Reports disagree on {floodValues.length > 1 ? "flooding" : "electricity"}.
          </p>
        )}
        {reportList.length === 0 ? (
          <p style={{ marginTop: "0.6rem", fontSize: "0.88rem", color: "#475569" }}>
            No community reports yet. Be the first to report after visiting.
          </p>
        ) : (
          <ul style={{ marginTop: "0.7rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {reportList.map((r) => (
              <li key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.75rem 0.9rem", fontSize: "0.87rem" }}>
                <p style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                  <span className="badge badge-brand"><SourceLabel source={String(r.source_type)} /></span>
                  <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {new Date(r.created_at).toLocaleDateString()}
                    {r.listing_accuracy ? ` Â· Listing: ${display(r.listing_accuracy)}` : ""}
                  </span>
                </p>
                <dl style={{ marginTop: "0.4rem", display: "grid", gap: "0.2rem 0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", color: "#334155" }}>
                  {r.electricity && <div>Power: {display(r.electricity)}</div>}
                  {r.flood && <div>Flood: {display(r.flood)}</div>}
                  {r.water && <div>Water: {display(r.water)}</div>}
                  {r.road_access && <div>Road: {display(r.road_access)}</div>}
                  {r.network_quality && <div>Network: {display(r.network_quality)}</div>}
                  {r.security_experience && <div>Security: {display(r.security_experience)}</div>}
                </dl>
                {r.comment && <p style={{ marginTop: "0.35rem", color: "#475569" }}>â€œ{r.comment}â€</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Contact + viewing (sticky booking card on desktop) */}
      </div>
      <aside style={{ position: "sticky", top: 76, display: "flex", flexDirection: "column", gap: "1rem" }}>
      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <p style={{ fontSize: "1.3rem", fontWeight: 800 }}>â‚¦{display(property.rent)} <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#64748b" }}>/ year</span></p>
        <p style={{ fontSize: "0.83rem", color: "#475569" }}>
          {display(property.neighborhood ?? property.general_area)}{property.area ? `, ${display(property.area)}` : ""}
        </p>
        <h2 style={{ fontWeight: 800, fontSize: "1rem", marginTop: "0.7rem" }}>Contact & viewing</h2>
        <p style={{ marginTop: "0.35rem", fontSize: "0.87rem", color: "#475569" }}>
          Contact: {display(property.contact_name)}
        </p>
        {privateContact.contact_phone || privateContact.exact_address ? (
          <div style={{ marginTop: "0.5rem", background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
            <p style={{ fontWeight: 700, color: "#007a4d" }}>ðŸ”“ Shared with you {isOwner ? "(you listed this property)" : "(viewing confirmed)"}</p>
            {privateContact.contact_phone && <p>Phone: {display(privateContact.contact_phone)}</p>}
            {privateContact.exact_address && <p>Exact address: {display(privateContact.exact_address)}</p>}
          </div>
        ) : (
          <p style={{ marginTop: "0.35rem", fontSize: "0.83rem", color: "#64748b" }}>
            Phone and exact street address stay private until the owner confirms your viewing request (NDPA).
          </p>
        )}
        {myViewingStatus && !isOwner && (
          <p style={{ marginTop: "0.4rem", fontSize: "0.83rem", fontWeight: 700, color: myViewingStatus === "confirmed" ? "#007a4d" : "#92400e" }}>
            Your request: {myViewingStatus === "confirmed" ? "Confirmed âœ“" : myViewingStatus === "declined" ? "Declined" : "Pending agent confirmation"}
          </p>
        )}
        {user ? (
          <form action={requestViewing.bind(null, id)} style={{ marginTop: "0.7rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <label className="label">
              Message to owner/agent (optional)
              <textarea name="message" rows={2} placeholder="e.g. Free to inspect Saturday morning" className="input" />
            </label>
            <NdpaConsent />
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
          <h2 style={{ fontWeight: 800, fontSize: "1rem" }}>Owner controls</h2>
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
            <p style={{ fontSize: "0.87rem", color: "#475569" }}>No requests yet.</p>
          ) : (
            <ul style={{ marginTop: "0.4rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.87rem" }}>
              {ownerRequests.map((r) => (
                <li key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "0.5rem 0.7rem" }}>
                  <p>{r.message ?? "(no message)"} Â· {r.status} Â· {new Date(r.created_at).toLocaleDateString()}</p>
                  {r.status === "pending" && (
                    <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.4rem" }}>
                      <form action={confirmViewingRequest.bind(null, id, r.id)}>
                        <button type="submit" className="btn-primary btn-sm">Confirm</button>
                      </form>
                      <form action={declineViewingRequest.bind(null, id, r.id)}>
                        <button type="submit" className="btn-secondary btn-sm">Decline</button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      </aside>
      </div>
    </div>
  );
}
