import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";

function display(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

function firstName(email: string | null | undefined) {
  if (!email) return "there";
  const prefix = email.split("@")[0];
  const part = prefix.split(/[._\-+0-9]+/).filter(Boolean)[0] ?? prefix;
  return part.charAt(0).toUpperCase() + part.slice(1);
}

function rolePill(role: string | null | undefined) {
  // Honest labels only — we have no owner-verification program.
  if (role === "owner_agent") return "Owner Account";
  if (role === "community") return "Community Account";
  return "Renter Account";
}

function requestStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "confirmed" || s === "scheduled")
    return { label: s === "scheduled" ? "Viewing Scheduled" : "Viewing Confirmed", bg: "#ecfdf5", fg: "#065f46", dot: "#047857" };
  if (s === "cancelled" || s === "declined" || s === "action")
    return { label: "Needs Action", bg: "#fef2f2", fg: "#b91c1c", dot: "#dc2626" };
  return { label: "Pending Agent Confirmation", bg: "#fffbeb", fg: "#92400e", dot: "#d97706" };
}

function HouseBookmarkArt() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
      <path d="M14 32 36 14l22 18" stroke="#047857" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="20" y="32" width="32" height="24" rx="4" stroke="#047857" strokeWidth="4" />
      <path d="M48 22v-8h8v14" stroke="#00A86B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="31" y="43" width="10" height="13" rx="2" fill="#A7F3D0" />
    </svg>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  const { data: prefRow } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();
  const prefs = prefRow
    ? {
        areas: Array.isArray(prefRow.areas) ? prefRow.areas : [],
        budget_min: prefRow.budget_min ?? null,
        budget_max: prefRow.budget_max ?? null,
        property_type: prefRow.property_type ?? null,
        priorities: (Array.isArray(prefRow.priorities) ? prefRow.priorities : []) as PriorityKey[],
      }
    : null;

  const { data: myReports } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .limit(50);

  const { data: savedRows } = await supabase
    .from("saves")
    .select("property_id")
    .eq("user_id", user.id)
    .limit(20);

  const savedIds = (savedRows ?? []).map((s) => s.property_id);
  let savedProps: {
    id: string; property_type: string | null; bedrooms: number | null; rent: number | null;
    neighborhood: string | null; general_area: string | null; area: string | null;
    photos: string[] | null; flood: string | null; electricity: string | null;
  }[] = [];
  if (savedIds.length > 0) {
    const { data } = await supabase
      .from("property_public")
      .select("id, property_type, bedrooms, rent, neighborhood, general_area, area, photos, flood, electricity")
      .in("id", savedIds);
    savedProps = (data ?? []) as typeof savedProps;
  }

  const { data: myRequests } = await supabase
    .from("viewing_requests")
    .select("id, property_id, status, message, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const requestPropIds = [...new Set((myRequests ?? []).map((r) => r.property_id))];
  let propById = new Map<string, (typeof savedProps)[number]>();
  if (requestPropIds.length > 0) {
    const { data } = await supabase
      .from("property_public")
      .select("id, property_type, bedrooms, rent, neighborhood, general_area, area, photos, flood, electricity")
      .in("id", requestPropIds);
    propById = new Map(((data ?? []) as typeof savedProps).map((p) => [p.id, p]));
  }

  const pendingCount = (myRequests ?? []).filter((r) => r.status === "pending").length;
  const metrics = [
    { icon: "♡", label: "Saved Spaces", value: String(savedProps.length), sub: savedProps.length === 1 ? "1 home shortlisted" : "homes shortlisted", href: "#saved", link: "Browse saved" },
    { icon: "◷", label: "Viewing Requests", value: String(myRequests?.length ?? 0), sub: pendingCount > 0 ? `${pendingCount} pending` : "all settled", href: "#requests", link: "View activity", badge: pendingCount > 0 ? `${pendingCount} Pending` : undefined },
    { icon: "✦", label: "Intelligence Reports", value: String(myReports?.length ?? 0), sub: "reports you contributed", href: "/search", link: "Keep exploring" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      {/* Greeting */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.6rem" }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.01em" }}>
            Welcome back, {firstName(profile?.email ?? user.email)} 👋
          </h1>
          <p style={{ marginTop: "0.25rem", fontSize: 14, color: "#57534e" }}>
            {profile?.email ?? user.email}{" "}
            <span className="badge badge-brand" style={{ fontSize: 12, marginLeft: "0.35rem" }}>
              {rolePill(profile?.role)}
            </span>
          </p>
        </div>
        <Link href="/search" className="btn-primary" style={{ background: "#00A86B", boxShadow: "0 6px 16px rgb(0 168 107 / 0.35)" }}>
          Explore Properties →
        </Link>
      </div>

      {/* Metric cards */}
      <div style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))" }}>
        {metrics.map((m) => (
          <div key={m.label} className="card" style={{ padding: "1.1rem 1.2rem", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgb(0 0 0 / 0.05)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: "#ecfdf5", color: "#047857", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {m.icon}
              </span>
              {m.badge && (
                <span className="badge badge-warn" style={{ fontSize: 12 }}>{m.badge}</span>
              )}
            </div>
            <p style={{ marginTop: "0.7rem", fontSize: 26, fontWeight: 800, lineHeight: 1 }}>{m.value}</p>
            <p style={{ fontSize: 14, fontWeight: 700 }}>{m.label}</p>
            <p style={{ fontSize: 12, color: "#78716c" }}>{m.sub}</p>
            <Link href={m.href} style={{ marginTop: "0.5rem", display: "inline-block", fontSize: 13, fontWeight: 700, color: "#047857" }}>
              {m.link} →
            </Link>
          </div>
        ))}
      </div>

      {/* Saved */}
      <section id="saved" className="card" style={{ padding: "1.3rem 1.4rem", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgb(0 0 0 / 0.05)", scrollMarginTop: 80 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>Saved spaces ({savedProps.length})</h2>
        {savedProps.length === 0 ? (
          <div style={{ marginTop: "0.8rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "0.7rem", padding: "1.4rem 1rem", background: "#FAF9F6", borderRadius: 12 }}>
            <HouseBookmarkArt />
            <p style={{ fontSize: 14, color: "#44403c", maxWidth: 460, lineHeight: 1.6 }}>
              No saved spaces yet. Save properties while searching to compare flood risk, power scores, and credibility side-by-side.
            </p>
            <Link href="/search" className="btn-primary btn-sm">Browse Lagos Listings</Link>
          </div>
        ) : (
          <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
            {savedProps.map((p) => {
              const fit = calculateFitScore(p, prefs);
              const thumb = Array.isArray(p.photos) && p.photos[0] ? p.photos[0] : null;
              return (
                <Link key={p.id} href={`/properties/${p.id}`} className="card" style={{ overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgb(0 0 0 / 0.05)" }}>
                  {thumb ? (
                    <img src={thumb} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ aspectRatio: "16/9", background: "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8a29e", fontSize: 12, fontWeight: 600 }}>No photo yet</div>
                  )}
                  <div style={{ padding: "0.75rem 0.9rem" }}>
                    <p style={{ fontWeight: 800, fontSize: 15 }}>
                      {display(p.bedrooms)}-bed {display(p.property_type)}
                      {fit.score !== null && <span style={{ color: "#047857" }}> · {fit.score}</span>}
                    </p>
                    <p style={{ fontSize: 13, color: "#57534e" }}>
                      {display(p.neighborhood ?? p.general_area)}{p.area ? `, ${display(p.area)}` : ""} · ₦{p.rent ?? "?"}
                    </p>
                    <p style={{ fontSize: 12, color: "#78716c" }}>
                      ⚡ {display(p.electricity)} · 🌊 {display(p.flood)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Requests */}
      <section id="requests" className="card" style={{ padding: "1.3rem 1.4rem", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgb(0 0 0 / 0.05)", scrollMarginTop: 80 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700 }}>My viewing requests ({myRequests?.length ?? 0})</h2>
        {(myRequests ?? []).length === 0 ? (
          <p style={{ marginTop: "0.5rem", fontSize: 14, color: "#57534e" }}>
            No requests yet. Open a property and tap Request a Viewing.
          </p>
        ) : (
          <div style={{ marginTop: "0.8rem", display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
            {(myRequests ?? []).map((r) => {
              const p = propById.get(r.property_id);
              const st = requestStatus(r.status);
              const thumb = p && Array.isArray(p.photos) && p.photos[0] ? p.photos[0] : null;
              return (
                <div key={r.id} className="card" style={{ overflow: "hidden", border: "1px solid #E5E7EB", boxShadow: "0 4px 12px rgb(0 0 0 / 0.05)" }}>
                  <div style={{ display: "flex", gap: "0.7rem", padding: "0.8rem" }}>
                    {thumb ? (
                      <img src={thumb} alt="" loading="lazy" style={{ width: 84, height: 84, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 84, height: 84, borderRadius: 10, background: "#f5f5f4", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8a29e", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>No photo</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <Link href={`/properties/${r.property_id}`} style={{ fontWeight: 800, fontSize: 14, color: "#1c1917" }}>
                        {p ? `${display(p.bedrooms)}-bed ${display(p.property_type)}` : "Property"}
                      </Link>
                      <p style={{ fontSize: 12, color: "#57534e" }}>
                        {p ? `${display(p.neighborhood ?? p.general_area)}${p.area ? `, ${display(p.area)}` : ""}` : "Details unavailable"}
                      </p>
                      <span className="badge" style={{ fontSize: 12, marginTop: "0.3rem", background: st.bg, color: st.fg }}>
                        <span style={{ width: 7, height: 7, borderRadius: "50%", background: st.dot, display: "inline-block" }} />
                        {st.label}
                      </span>
                    </div>
                  </div>
                  {p && (
                    <p style={{ padding: "0 0.8rem 0.8rem", fontSize: 12, color: "#57534e" }}>
                      ⚡ {display(p.electricity)} · 🌊 {display(p.flood)} · {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div style={{ display: "flex", gap: "0.8rem", fontSize: 13, flexWrap: "wrap" }}>
        <Link href="/onboarding" style={{ color: "#047857", fontWeight: 600 }}>Change role</Link>
        <Link href="/preferences" style={{ color: "#047857", fontWeight: 600 }}>Edit preferences</Link>
        <Link href="/submit" style={{ color: "#047857", fontWeight: 600 }}>List a property</Link>
      </div>
    </div>
  );
}
