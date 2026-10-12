import Link from "next/link";
import MapView from "@/components/MapView";
import { createClient } from "@/lib/supabase/server";
import { calculateFitScore, type PriorityKey } from "@/lib/fitScore";
import { saveProperty, unsaveProperty } from "@/app/properties/[id]/actions";
import { EmptyState, EvidenceBadge } from "@/components/ui";
import { PROPERTY_TYPES } from "@/lib/locations";

function display(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }
  return String(value);
}

function naira(n: number | null | undefined) {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return "Not provided";
  return `â‚¦${Number(n).toLocaleString("en-NG")}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; q?: string; sort?: string; type?: string; beds?: string; max?: string }>;
}) {
  const { view, q, sort, type, beds, max } = await searchParams;
  const isMap = view === "map";
  const query = (q ?? "").trim();
  const typeF = (type ?? "").trim();
  const bedsF = beds ? Number(beds) : null;
  const maxF = max && Number.isFinite(Number(max)) ? Number(max) : null;
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
    .limit(60);

  const ql = query.toLowerCase();
  const filtered = (properties ?? []).filter((p) => {
    if (ql && ![p.neighborhood, p.general_area, p.area, p.estate, p.property_type].filter(Boolean).some((v) => String(v).toLowerCase().includes(ql))) return false;
    if (typeF && String(p.property_type ?? "").toLowerCase() !== typeF.toLowerCase()) return false;
    if (bedsF !== null && Number.isFinite(bedsF) && Number(p.bedrooms) < bedsF) return false;
    if (maxF !== null && p.rent !== null && p.rent !== undefined && Number(p.rent) > maxF) return false;
    return true;
  });

  const ranked = filtered
    .map((p) => ({ property: p, fit: calculateFitScore(p, prefs) }))
    .sort((a, b) => {
      if (sortMode === "cheap") return (a.property.rent ?? Infinity) - (b.property.rent ?? Infinity);
      if (sortMode === "new") return 0;
      return (b.fit.score ?? -1) - (a.fit.score ?? -1);
    });

  let savedSet = new Set<string>();
  if (user) {
    const { data: saves } = await supabase.from("saves").select("property_id").eq("user_id", user.id).limit(100);
    savedSet = new Set((saves ?? []).map((s) => s.property_id));
  }

  const hasPrefs = prefs && (prefs.areas.length > 0 || prefs.priorities.length > 0);
  const link = (over: Record<string, string>) => {
    const sp = new URLSearchParams();
    if (isMap) sp.set("view", "map");
    if (query) sp.set("q", query);
    if (typeF) sp.set("type", typeF);
    if (bedsF !== null && Number.isFinite(bedsF as number)) sp.set("beds", String(bedsF));
    if (maxF !== null) sp.set("max", String(maxF));
    if (sortMode !== "best") sp.set("sort", sortMode);
    for (const [k, v] of Object.entries(over)) {
      if (v) sp.set(k, v);
      else sp.delete(k);
    }
    const s = sp.toString();
    return `/search${s ? `?${s}` : ""}`;
  };
  const activeFilters = [query && `â€œ${query}â€`, typeF, bedsF ? `${bedsF} bed` : "", maxF ? `â‰¤ â‚¦${maxF.toLocaleString("en-NG")}` : ""].filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
          {hasPrefs ? "Best Match for You" : "Rentals in Lagos"}
        </h1>
        <p style={{ fontSize: "0.87rem", color: "#475569" }}>
          {ranked.length} home{ranked.length === 1 ? "" : "s"}
          {activeFilters.length > 0 ? <> Â· {activeFilters.join(" Â· ")} (<Link href="/search" style={{ color: "#00a86b", fontWeight: 600 }}>clear all</Link>)</> : " Â· all areas"}
        </p>
      </div>

      {/* Zillow-style filter bar */}
      <form action="/search" method="get" className="card" style={{ padding: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.55rem", alignItems: "end" }}>
        {isMap && <input type="hidden" name="view" value="map" />}
        <label style={{ flex: "2 1 180px", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
          LOCATION OR ESTATE
          <input name="q" defaultValue={query} placeholder="Opebi, Sangotedo, estateâ€¦" aria-label="Location" className="input" />
        </label>
        <label style={{ flex: "1 1 140px", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
          TYPE
          <select name="type" defaultValue={typeF} className="input">
            <option value="">All types</option>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label style={{ flex: "0 1 90px", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
          BEDS
          <select name="beds" defaultValue={bedsF !== null ? String(bedsF) : ""} className="input">
            <option value="">Any</option>
            {[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}+</option>)}
          </select>
        </label>
        <label style={{ flex: "1 1 130px", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
          MAX / YEAR (â‚¦)
          <input name="max" type="number" defaultValue={maxF ?? ""} placeholder="e.g. 2000000" className="input" />
        </label>
        <label style={{ flex: "0 1 130px", fontSize: "0.75rem", fontWeight: 700, color: "#475569" }}>
          SORT
          <select name="sort" defaultValue={sortMode} className="input">
            <option value="best">Best match</option>
            <option value="new">Newest</option>
            <option value="cheap">Cheapest</option>
          </select>
        </label>
        <button type="submit" className="btn-primary btn-sm">Apply</button>
      </form>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
        <Link href={link({ view: "" })} className="btn-secondary btn-sm" style={!isMap ? { background: "#1e293b", color: "#fff", borderColor: "#1e293b" } : undefined}>List</Link>
        <Link href={link({ view: "map" })} className="btn-secondary btn-sm" style={isMap ? { background: "#1e293b", color: "#fff", borderColor: "#1e293b" } : undefined}>Map</Link>
        {!hasPrefs && <Link href="/preferences" style={{ fontSize: "0.83rem", fontWeight: 600, color: "#00a86b" }}>Set preferences for personal scores â†’</Link>}
        <span style={{ flex: 1 }} />
        <Link href="/submit" className="btn-primary btn-sm">+ List a property</Link>
      </div>

      {error && (
        <p style={{ borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.7rem 0.9rem", fontSize: "0.87rem" }}>
          Something went wrong loading properties. Please refresh and try again.
        </p>
      )}

      {isMap ? (
        <MapView
          properties={ranked.map(({ property: p, fit }) => ({
            id: p.id, property_type: p.property_type, bedrooms: p.bedrooms, rent: p.rent,
            neighborhood: p.neighborhood, general_area: p.general_area, area: p.area, estate: p.estate, score: fit.score,
          }))}
        />
      ) : ranked.length === 0 && !error ? (
        <EmptyState
          title="No homes match those filters"
          body="Try widening the area, raising the max budget, or clearing the type."
          action={<><Link href="/search" className="btn-secondary btn-sm">Clear filters</Link><Link href="/submit" className="btn-primary btn-sm">List a property</Link></>}
        />
      ) : (
        <div style={{ display: "grid", gap: "1.1rem", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))" }}>
          {ranked.map(({ property: p, fit }) => {
            const photos: string[] = Array.isArray(p.photos) ? p.photos : [];
            const saved = savedSet.has(p.id);
            return (
              <article key={p.id} className="card" style={{ overflow: "hidden", display: "flex", flexDirection: "column", padding: 0, borderRadius: 16 }}>
                <div style={{ position: "relative" }}>
                  <Link href={`/properties/${p.id}`} aria-label={`${display(p.property_type)} in ${display(p.neighborhood ?? p.general_area)}`}>
                    {photos[0] ? (
                      <img src={photos[0]} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "4/3", background: "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: "0.82rem", fontWeight: 600 }}>
                        No photo yet â€” verify in person
                      </div>
                    )}
                  </Link>
                  <span className="badge" style={{ position: "absolute", left: 10, top: 10, background: "#fff", color: "#007a4d", fontWeight: 800 }}>
                    {fit.score !== null ? `${fit.score} fit` : "No score"}
                  </span>
                  {user ? (
                    <form action={(saved ? unsaveProperty : saveProperty).bind(null, p.id)} style={{ position: "absolute", right: 10, top: 8 }}>
                      <button type="submit" aria-label={saved ? "Remove from saved" : "Save this home"} style={{ width: 32, height: 32, borderRadius: "50%", background: "#fff", border: "1px solid #e2e8f0", fontSize: 15, color: saved ? "#00a86b" : "#475569", cursor: "pointer" }}>
                        {saved ? "â™¥" : "â™¡"}
                      </button>
                    </form>
                  ) : null}
                </div>
                <Link href={`/properties/${p.id}`} style={{ padding: "0.85rem 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.22rem", color: "inherit" }}>
                  <p style={{ fontWeight: 800, fontSize: "1.02rem" }}>
                    {naira(p.rent)} <span style={{ fontWeight: 500, color: "#64748b", fontSize: "0.8rem" }}>/year</span>
                  </p>
                  <p style={{ fontWeight: 650, fontSize: "0.92rem" }}>
                    {display(p.bedrooms)}-bed {display(p.property_type)}
                  </p>
                  <p style={{ fontSize: "0.83rem", color: "#475569" }}>
                    {display(p.neighborhood ?? p.general_area)}{p.area ? `, ${display(p.area)}` : ""}{p.estate ? ` Â· ${display(p.estate)}` : ""}
                  </p>
                  <p style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    Flood: {display(p.flood)} Â· Power: {display(p.electricity)}
                  </p>
                  <p>
                    <EvidenceBadge status={String(p.verification_status ?? "Limited information")} />
                  </p>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
