import Link from "next/link";
import MapView from "@/components/MapView";
import { createClient } from "@/lib/supabase/server";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";
import { EmptyState, EvidenceBadge } from "@/components/ui";

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

function scoreBand(score: number | null) {
  if (score === null) return { bg: "#f5f5f4", fg: "#57534e", label: "No score" };
  if (score >= 75) return { bg: "#ecfdf5", fg: "#065f46", label: `${score}/100` };
  if (score >= 50) return { bg: "#fffbeb", fg: "#92400e", label: `${score}/100` };
  return { bg: "#fef2f2", fg: "#b91c1c", label: `${score}/100` };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; sort?: string }>;
}) {
  const { view, q, sort } = await searchParams;
  const isMap = view === "map";
  const query = (q ?? "").trim();
  const sortMode = sort ?? "best";
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
    .limit(40);

  const ql = query.toLowerCase();
  const filtered = (properties ?? []).filter((p) => {
    if (!ql) return true;
    return [p.neighborhood, p.general_area, p.area, p.estate, p.property_type]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(ql));
  });

  const ranked = filtered
    .map((p) => ({ property: p, fit: calculateFitScore(p, prefs) }))
    .sort((a, b) => {
      if (sortMode === "cheap")
        return (a.property.rent ?? Infinity) - (b.property.rent ?? Infinity);
      if (sortMode === "new") return 0; // already newest-first from query
      return (b.fit.score ?? -1) - (a.fit.score ?? -1);
    });

  const hasPrefs = prefs && (prefs.areas.length > 0 || prefs.priorities.length > 0);
  const link = (over: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (isMap) sp.set("view", "map");
    if (query) sp.set("q", query);
    if (sortMode !== "best") sp.set("sort", sortMode);
    for (const [k, v] of Object.entries(over)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    const s = sp.toString();
    return `/search${s ? `?${s}` : ""}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "0.7rem" }}>
        <div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
            {hasPrefs ? "Best Match for You" : "Search properties"}
          </h1>
          <p style={{ fontSize: "0.87rem", color: "#57534e" }}>
            {ranked.length} result{ranked.length === 1 ? "" : "s"}
            {query ? (
              <>
                {" "}for “{query}” (<Link href="/search" style={{ color: "#047857", fontWeight: 600 }}>clear</Link>)
              </>
            ) : null}
            {" "}· Scores are personal fit, shown with confidence.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href={link({ view: "" })} className={`btn-secondary btn-sm ${!isMap ? "" : ""}`} style={!isMap ? { background: "#1c1917", color: "#fff", borderColor: "#1c1917" } : undefined}>
            List
          </Link>
          <Link href={link({ view: "map" })} className="btn-secondary btn-sm" style={isMap ? { background: "#1c1917", color: "#fff", borderColor: "#1c1917" } : undefined}>
            Map
          </Link>
          <Link href="/submit" className="btn-primary btn-sm">
            + List a property
          </Link>
        </div>
      </div>

      <form action="/search" method="get" className="card" style={{ padding: "0.8rem", display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}>
        {isMap && <input type="hidden" name="view" value="map" />}
        <input
          name="q"
          defaultValue={query}
          placeholder="Neighbourhood, district, estate or type…"
          aria-label="Search properties"
          className="input"
          style={{ marginTop: 0, flex: "1 1 220px" }}
        />
        <select name="sort" defaultValue={sortMode} aria-label="Sort results" className="input" style={{ marginTop: 0, flex: "0 1 170px" }}>
          <option value="best">Sort: Best match</option>
          <option value="new">Sort: Newest</option>
          <option value="cheap">Sort: Cheapest</option>
        </select>
        <button type="submit" className="btn-primary btn-sm">Search</button>
        {!hasPrefs && (
          <Link href="/preferences" style={{ fontSize: "0.83rem", fontWeight: 600, color: "#047857" }}>
            Set preferences for personal scores →
          </Link>
        )}
      </form>

      {error && (
        <p style={{ borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          Database not connected yet: {error.message}. Run supabase/schema.sql in your Supabase project.
        </p>
      )}

      {isMap ? (
        <MapView
          properties={ranked.map(({ property: p, fit }) => ({
            id: p.id,
            property_type: p.property_type,
            bedrooms: p.bedrooms,
            rent: p.rent,
            neighborhood: p.neighborhood,
            general_area: p.general_area,
            area: p.area,
            estate: p.estate,
            score: fit.score,
          }))}
        />
      ) : ranked.length === 0 && !error ? (
        <EmptyState
          title={query ? `No matches for “${query}”` : "No properties yet"}
          body={query ? "Try a broader neighbourhood or clear the search." : "Be the first to list a property in your area."}
          action={
            <>
              {query && <Link href="/search" className="btn-secondary btn-sm">Clear search</Link>}
              <Link href="/submit" className="btn-primary btn-sm">List a property</Link>
            </>
          }
        />
      ) : (
        <div style={{ display: "grid", gap: "0.9rem", gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))" }}>
          {ranked.map(({ property: p, fit }) => {
            const band = scoreBand(fit.score);
            const photos: string[] = Array.isArray(p.photos) ? p.photos : [];
            return (
              <Link key={p.id} href={`/properties/${p.id}`} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ position: "relative", background: "#e7e5e4", aspectRatio: "16/9", overflow: "hidden" }}>
                  {photos[0] ? (
                    <img src={photos[0]} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8a29e", fontSize: "0.82rem", fontWeight: 600 }}>
                      No photo yet
                    </div>
                  )}
                  <span className="badge" style={{ position: "absolute", top: 10, right: 10, background: band.bg, color: band.fg, borderColor: "transparent" }}>
                    {band.label}{fit.score !== null ? ` · ${fit.confidence}` : ""}
                  </span>
                </div>
                <div style={{ padding: "0.95rem 1.05rem 1.1rem", display: "flex", flexDirection: "column", gap: "0.4rem", flex: 1 }}>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                    <EvidenceBadge status={String(p.verification_status ?? "Limited information")} />
                    <span style={{ fontSize: "0.78rem", color: "#78716c", fontWeight: 600 }}>
                      {display(p.neighborhood ?? p.general_area)}{p.area ? `, ${display(p.area)}` : ""}
                    </span>
                  </div>
                  <h2 style={{ fontWeight: 750, fontSize: "1.02rem" }}>
                    {display(p.property_type)} · {display(p.bedrooms)} bed
                  </h2>
                  <p style={{ fontWeight: 800, color: "#047857" }}>
                    ₦{display(p.rent)} <span style={{ fontWeight: 500, color: "#78716c", fontSize: "0.8rem" }}>/ year</span>
                  </p>
                  {p.estate && <p style={{ fontSize: "0.82rem", color: "#57534e" }}>{display(p.estate)}</p>}
                  <p style={{ fontSize: "0.83rem", color: "#57534e", lineHeight: 1.55 }}>
                    Flood: {display(p.flood)} · Power: {display(p.electricity)} · Water: {display(p.water)}
                  </p>
                  {fit.reasons[0] && <p style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 600 }}>✓ {fit.reasons[0]}</p>}
                  {fit.concerns[0] && <p style={{ fontSize: "0.8rem", color: "#92400e" }}>! {fit.concerns[0]}</p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
