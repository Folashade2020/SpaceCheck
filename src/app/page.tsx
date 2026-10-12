import Link from "next/link";
import { BrandMark, EvidenceBadge } from "@/components/ui";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/locations";

const AREAS = ["Opebi", "Allen Avenue", "Sangotedo", "Lekki Phase 1", "Yaba", "Surulere", "Gbagada", "Ikoyi"];

function IconTarget() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00a86b" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="#00a86b" />
    </svg>
  );
}

function IconPin() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00a86b" strokeWidth="2" aria-hidden>
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#00a86b" strokeWidth="2" aria-hidden>
      <path d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

// Clearly-labeled illustrative mock - not real listing data.
function IntelligencePreviewCard() {
  return (
    <div
      aria-label="Sample SpaceCheck intelligence card preview"
      style={{
        background: "#fff",
        color: "#1e293b",
        borderRadius: 16,
        padding: "1.2rem 1.3rem",
        maxWidth: 380,
        width: "100%",
        boxShadow: "0 18px 45px rgb(0 0 0 / 0.35)",
      }}
    >
      <p style={{ fontSize: "0.68rem", fontWeight: 800, color: "#00a86b", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        Sample preview · illustrative
      </p>
      <div style={{ marginTop: "0.4rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.6rem" }}>
        <div>
          <p style={{ fontWeight: 800, fontSize: "1rem" }}>2-bed · Opebi, Ikeja</p>
          <p style={{ fontSize: "0.78rem", color: "#64748b" }}>Ocean-view Estate · sample</p>
        </div>
        <div style={{ textAlign: "center", background: "#ecfdf5", borderRadius: 12, padding: "0.4rem 0.7rem" }}>
          <p style={{ fontWeight: 800, fontSize: "1.25rem", color: "#007a4d" }}>87%</p>
          <p style={{ fontSize: "0.65rem", color: "#007a4d", fontWeight: 700 }}>Credibility</p>
        </div>
      </div>
      <div style={{ marginTop: "0.7rem", background: "#F8FAFC", border: "1px solid #e2e8f0", borderRadius: 10, padding: "0.6rem 0.75rem", fontSize: "0.8rem", color: "#334155", lineHeight: 1.6 }}>
        <strong>AI insight (sample):</strong> power averages ~14 hrs/day;
        no flood history reported on this street; access road untarred but
        passable year-round.
      </div>
      <div style={{ marginTop: "0.7rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
        {[
          { k: "Flood Risk", v: "Low", bg: "#ecfdf5", fg: "#007a4d" },
          { k: "Power", v: "14h/day", bg: "#ecfdf5", fg: "#007a4d" },
          { k: "Water", v: "Borehole", bg: "#f1f5f9", fg: "#475569" },
          { k: "Road", v: "Fair", bg: "#fffbeb", fg: "#92400e" },
        ].map((m) => (
          <span key={m.k} style={{ fontSize: "0.72rem", fontWeight: 700, borderRadius: 999, padding: "0.28rem 0.65rem", background: m.bg, color: m.fg }}>
            {m.k}: {m.v}
          </span>
        ))}
      </div>
      <div style={{ marginTop: "0.7rem", display: "flex", gap: "0.4rem", alignItems: "center" }}>
        <EvidenceBadge status="Verified" />
        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>2 resident reports · sample data</span>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
      {/* Hero: 2-column */}
      <section
        className="card"
        style={{
          padding: "clamp(1.8rem, 5vw, 3rem)",
          background: "#1E293B",
          borderColor: "#1E293B",
          color: "#F8FAFC",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: "2rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            alignItems: "center",
          }}
        >
          <div>
            <p
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                fontSize: "0.76rem",
                fontWeight: 800,
                color: "#1e293b",
                background: "#A7F3D0",
                borderRadius: 999,
                padding: "0.32rem 0.8rem",
              }}
            >
               AI-Powered Neighborhood Intelligence
            </p>
            <h1
              style={{
                marginTop: "0.9rem",
                fontSize: "clamp(2rem, 4.6vw, 3rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                fontWeight: 800,
              }}
            >
              Check the space before you commit.
            </h1>
            <p style={{ marginTop: "0.8rem", color: "#CBD5E1", fontSize: "0.98rem", lineHeight: 1.6 }}>
              Photos tell you the rent. SpaceCheck tells you the flooding,
              electricity, water, road access - and what residents actually
              experienced.
            </p>

            <form
              action="/search"
              method="get"
              style={{
                marginTop: "1.2rem",
                background: "#fff",
                borderRadius: 14,
                padding: "0.7rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.6rem",
                alignItems: "end",
                color: "#1e293b",
              }}
            >
              <label style={{ flex: "2 1 180px", fontSize: "0.75rem", fontWeight: 700 }}>
                LOCATION
                <input name="q" placeholder="Area, estate or district..." className="input" list="sc-areas" />
                <datalist id="sc-areas">
                  {Object.entries(DISTRICTS).map(([d, areas]) =>
                    areas.map((a) => <option key={`${d}-${a}`} value={a} />)
                  )}
                </datalist>
              </label>
              <label style={{ flex: "1 1 130px", fontSize: "0.75rem", fontWeight: 700 }}>
                TYPE
                <select name="type" className="input" defaultValue="">
                  <option value="">Any type</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label style={{ flex: "1 1 120px", fontSize: "0.75rem", fontWeight: 700 }}>
                MAX / YEAR (₦)
                <input name="max" type="number" placeholder="e.g. 2000000" className="input" />
              </label>
              <button
                type="submit"
                className="btn-primary"
                style={{ fontSize: "1rem", padding: "0.8rem 1.8rem", boxShadow: "0 6px 18px rgb(4 120 87 / 0.45)" }}
              >
                Search &gt;
              </button>
            </form>
            <div style={{ marginTop: "0.8rem", display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {AREAS.map((a) => (
                <Link
                  key={a}
                  href={`/search?q=${encodeURIComponent(a)}`}
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    color: "#F8FAFC",
                    border: "1px solid #334155",
                    borderRadius: 999,
                    padding: "0.3rem 0.8rem",
                  }}
                >
                  {a}
                </Link>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <IntelligencePreviewCard />
          </div>
        </div>
      </section>

      {/* Value cards with icons */}
      <section style={{ display: "grid", gap: "0.8rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {[
          { icon: <IconTarget />, t: "AI Fit Score", b: "Best Match for You ranks every listing against your budget, areas and priorities - with confidence shown separately." },
          { icon: <IconPin />, t: "Street-Level Truth", b: "Opebi is not all of Ikeja. Reports keep their neighbourhood and estate scope, with dates and contributor types." },
          { icon: <IconShield />, t: "Conflict-Free Proof", b: "Verified, owner-reported or community-reported - plus conflicts shown, never hidden. Promotion never moves a score." },
        ].map((c) => (
          <div key={c.t} className="card" style={{ padding: "1.2rem 1.3rem" }}>
            {c.icon}
            <h2 style={{ marginTop: "0.6rem", fontWeight: 800 }}>{c.t}</h2>
            <p style={{ marginTop: "0.4rem", fontSize: "0.88rem", color: "#475569", lineHeight: 1.6 }}>{c.b}</p>
          </div>
        ))}
      </section>

      {/* 4-step cards */}
      <section className="card" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>From search to signed rent, informed</h2>
        <div
          style={{
            marginTop: "0.9rem",
            display: "grid",
            gap: "0.8rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          }}
        >
          {[
            { n: "01", t: "Set what matters", b: "Areas, budget and priorities - flood, power, water, roads." },
            { n: "02", t: "Compare matches", b: "Fit Scores and dealbreakers side by side, honestly labeled." },
            { n: "03", t: "Read the report", b: "Estate context, evidence and missing info before travelling." },
            { n: "04", t: "Visit & give back", b: "Inspect, verify, then report for the next renter." },
          ].map((s) => (
            <div key={s.n} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: "1rem 1.1rem", background: "#F8FAFC" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 12, background: "#00a86b", color: "#fff", fontWeight: 800, fontSize: "0.95rem" }}>
                {s.n}
              </span>
              <h3 style={{ marginTop: "0.6rem", fontWeight: 750 }}>{s.t}</h3>
              <p style={{ marginTop: "0.3rem", fontSize: "0.86rem", color: "#475569", lineHeight: 1.55 }}>{s.b}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <Link href="/search" className="btn-primary btn-sm">Start searching</Link>
          <Link href="/preferences" className="btn-secondary btn-sm">Set my preferences</Link>
        </div>
      </section>

      {/* Evidence */}
      <section className="card" style={{ padding: "1.4rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <BrandMark size={26} />
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>What &quot;verified&quot; means here</h2>
        </div>
        <p style={{ marginTop: "0.35rem", fontSize: "0.88rem", color: "#475569" }}>
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
