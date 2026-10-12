import Link from "next/link";
import { BrandMark, EvidenceBadge } from "@/components/ui";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/locations";

const AREAS = ["Opebi", "Allen Avenue", "Sangotedo", "Lekki Phase 1", "Yaba", "Surulere", "Gbagada", "Ikoyi"];

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
      {/* Hero with Zillow-style search */}
      <section
        className="card"
        style={{
          padding: "clamp(1.8rem, 5vw, 3.2rem)",
          background: "#1C1917",
          borderColor: "#1C1917",
          color: "#FAF9F6",
        }}
      >
        <p
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            fontSize: "0.78rem",
            fontWeight: 700,
            color: "#A7F3D0",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <BrandMark size={22} /> Lagos · Residential rentals
        </p>
        <h1
          style={{
            marginTop: "0.8rem",
            fontSize: "clamp(2.1rem, 5vw, 3.2rem)",
            lineHeight: 1.06,
            letterSpacing: "-0.02em",
            fontWeight: 800,
            maxWidth: 640,
          }}
        >
          Check the space before you commit.
        </h1>
        <p style={{ marginTop: "0.8rem", color: "#D6D3D1", fontSize: "1rem", maxWidth: 600, lineHeight: 1.6 }}>
          Photos tell you the rent. SpaceCheck tells you the flooding,
          electricity, water, road access — and what residents actually
          experienced.
        </p>

        <form
          action="/search"
          method="get"
          style={{
            marginTop: "1.3rem",
            background: "#fff",
            borderRadius: 14,
            padding: "0.7rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            alignItems: "end",
            color: "#1c1917",
          }}
        >
          <label style={{ flex: "2 1 200px", fontSize: "0.78rem", fontWeight: 700 }}>
            LOCATION
            <input name="q" placeholder="Area, estate or district…" className="input" list="sc-areas" />
            <datalist id="sc-areas">
              {Object.entries(DISTRICTS).map(([d, areas]) =>
                areas.map((a) => <option key={`${d}-${a}`} value={a} />)
              )}
            </datalist>
          </label>
          <label style={{ flex: "1 1 150px", fontSize: "0.78rem", fontWeight: 700 }}>
            TYPE
            <select name="type" className="input" defaultValue="">
              <option value="">Any type</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label style={{ flex: "1 1 130px", fontSize: "0.78rem", fontWeight: 700 }}>
            MAX / YEAR (₦)
            <input name="max" type="number" placeholder="e.g. 2000000" className="input" />
          </label>
          <button type="submit" className="btn-primary">Search</button>
        </form>
        <div style={{ marginTop: "0.8rem", display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
          {AREAS.map((a) => (
            <Link
              key={a}
              href={`/search?q=${encodeURIComponent(a)}`}
              style={{
                fontSize: "0.8rem",
                fontWeight: 600,
                color: "#FAF9F6",
                border: "1px solid #44403c",
                borderRadius: 999,
                padding: "0.3rem 0.8rem",
              }}
            >
              {a}
            </Link>
          ))}
        </div>
      </section>

      {/* Value strip */}
      <section style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          { t: "Personal Fit Score", b: "Best Match for You ranks every listing against your budget, areas and priorities — with confidence shown separately." },
          { t: "Estate & street context", b: "Opebi is not all of Ikeja. Reports keep their neighbourhood and estate scope, with dates and contributor types." },
          { t: "Evidence labels", b: "Verified, owner-reported, community-reported or limited information — plus conflicts shown, never hidden." },
        ].map((c) => (
          <div key={c.t} className="card" style={{ padding: "1.1rem 1.2rem" }}>
            <h2 style={{ fontWeight: 800 }}>{c.t}</h2>
            <p style={{ marginTop: "0.4rem", fontSize: "0.88rem", color: "#57534e", lineHeight: 1.6 }}>{c.b}</p>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section className="card" style={{ padding: "1.4rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>From search to signed rent, informed</h2>
        <ol style={{ marginTop: "0.7rem", display: "grid", gap: "0.6rem", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", fontSize: "0.88rem", color: "#44403c" }}>
          {[
            "Set areas, budget and what matters (flood, power, water…).",
            "Compare Fit Scores and dealbreakers side by side.",
            "Open the intelligence report before travelling.",
            "Visit, verify, then report back for the next renter.",
          ].map((s, i) => (
            <li key={i} style={{ borderLeft: "3px solid #047857", paddingLeft: "0.7rem" }}>
              <strong>Step {i + 1}.</strong> {s}
            </li>
          ))}
        </ol>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link href="/search" className="btn-primary btn-sm">Start searching</Link>
          <Link href="/preferences" className="btn-secondary btn-sm">Set my preferences</Link>
        </div>
      </section>

      {/* Evidence */}
      <section className="card" style={{ padding: "1.4rem" }}>
        <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>What “verified” means here</h2>
        <p style={{ marginTop: "0.35rem", fontSize: "0.88rem", color: "#57534e" }}>
          Unknown stays unknown. Promotion never changes a score.
        </p>
        <div style={{ marginTop: "0.7rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <EvidenceBadge status="Verified" />
          <EvidenceBadge status="Owner-reported" />
          <EvidenceBadge status="Community reported" />
          <EvidenceBadge status="Limited information" />
        </div>
      </section>
    </div>
  );
}
