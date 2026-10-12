import Link from "next/link";
import { BrandMark, EvidenceBadge } from "@/components/ui";

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Tell us what matters",
    body: "Areas, budget, property type and priorities — flooding, electricity, water, road access, network, security signals.",
  },
  {
    step: "2",
    title: "See your Best Match",
    body: "Every listing gets a personal Fit Score out of 100, with confidence shown separately. Missing information lowers confidence — never faked.",
  },
  {
    step: "3",
    title: "Read the intelligence report",
    body: "Property facts, location conditions, estate and neighbourhood context, community experiences and what to verify before paying.",
  },
  {
    step: "4",
    title: "Visit, then give back",
    body: "Request a viewing, inspect in person, and report what you found so the next renter decides better.",
  },
];

export default function Home() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
      {/* Hero */}
      <section
        className="card"
        style={{
          padding: "clamp(1.6rem, 4vw, 3rem)",
          background: "#1C1917",
          borderColor: "#1C1917",
          color: "#FAF9F6",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ maxWidth: 640 }}>
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
              fontSize: "clamp(2rem, 5vw, 3.1rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontWeight: 800,
            }}
          >
            Check the space before you commit.
          </h1>
          <p style={{ marginTop: "0.9rem", color: "#D6D3D1", fontSize: "1.02rem", lineHeight: 1.6 }}>
            SpaceCheck goes beyond photos and rent. Understand flooding,
            electricity, water, road access and real resident experiences —
            matched to what matters to <em>you</em>.
          </p>
          <div style={{ marginTop: "1.4rem", display: "flex", flexWrap: "wrap", gap: "0.7rem" }}>
            <Link href="/search" className="btn-primary">
              Find a property that fits me
            </Link>
            <Link
              href="/signup"
              className="btn-secondary"
              style={{ borderColor: "#44403C", color: "#FAF9F6" }}
            >
              Create free account
            </Link>
          </div>
          <p style={{ marginTop: "0.9rem", fontSize: "0.8rem", color: "#A8A29E" }}>
            Unknown information is labelled “Not provided” — never invented.
            Exact addresses are never published.
          </p>
        </div>
      </section>

      {/* Search entry */}
      <section className="card" style={{ padding: "1.2rem 1.4rem" }}>
        <form
          action="/search"
          method="get"
          style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", alignItems: "center" }}
        >
          <label htmlFor="home-q" style={{ fontWeight: 700 }}>
            Start with a neighbourhood:
          </label>
          <input
            id="home-q"
            name="q"
            placeholder="e.g. Opebi, Sangotedo, Yaba"
            className="input"
            style={{ marginTop: 0, maxWidth: 320 }}
          />
          <button type="submit" className="btn-primary btn-sm" style={{ padding: "0.6rem 1.2rem" }}>
            Search
          </button>
          <Link href="/preferences" style={{ fontSize: "0.85rem", fontWeight: 600, color: "#047857" }}>
            or set preferences first →
          </Link>
        </form>
      </section>

      {/* How it works */}
      <section>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
          How SpaceCheck works
        </h2>
        <div
          style={{
            marginTop: "0.8rem",
            display: "grid",
            gap: "0.8rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          }}
        >
          {HOW_IT_WORKS.map((s) => (
            <div key={s.step} className="card" style={{ padding: "1.1rem 1.2rem" }}>
              <span className="badge badge-brand">Step {s.step}</span>
              <h3 style={{ marginTop: "0.6rem", fontWeight: 750 }}>{s.title}</h3>
              <p style={{ marginTop: "0.4rem", fontSize: "0.88rem", color: "#57534E", lineHeight: 1.55 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Intelligence preview */}
      <section className="card" style={{ padding: "1.4rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.2rem", alignItems: "center" }}>
          <div style={{ flex: "1 1 260px" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>
              The intelligence report is the product
            </h2>
            <p style={{ marginTop: "0.5rem", fontSize: "0.92rem", color: "#57534E", lineHeight: 1.6 }}>
              Each property gets a structured report: your personal fit with
              reasons, strengths and unmet needs, location and estate context,
              concerns, missing information and checks to complete before
              paying. The score measures fit to <em>your</em> stated
              preferences — not overall quality or safety.
            </p>
            <div style={{ marginTop: "0.9rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <Link href="/search" className="btn-primary btn-sm">
                Browse intelligence
              </Link>
              <Link href="/submit" className="btn-secondary btn-sm">
                List a property
              </Link>
            </div>
          </div>
          <div
            style={{
              flex: "1 1 260px",
              border: "1px solid #e7e5e4",
              borderRadius: 12,
              padding: "1rem 1.1rem",
              background: "#FAF9F6",
            }}
          >
            <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#78716c" }}>
              EXAMPLE REPORT CARD
            </p>
            <p style={{ marginTop: "0.4rem", fontWeight: 800, fontSize: "1.4rem" }}>
              82<span style={{ fontSize: "0.85rem", fontWeight: 600 }}>/100 fit</span>{" "}
              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#57534E" }}>
                · Medium confidence
              </span>
            </p>
            <ul style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#44403c", lineHeight: 1.7 }}>
              <li>✓ Within your budget</li>
              <li>✓ In your preferred neighbourhood</li>
              <li>! Flood information missing — verify</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Evidence */}
      <section className="card" style={{ padding: "1.4rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 800 }}>Evidence, not assumptions</h2>
        <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "#57534E" }}>
          Every fact carries its source. Paid promotion never changes a score
          or hides negative information.
        </p>
        <div style={{ marginTop: "0.8rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <EvidenceBadge status="Verified" />
          <EvidenceBadge status="Owner-reported" />
          <EvidenceBadge status="Community reported" />
          <EvidenceBadge status="Limited information" />
        </div>
      </section>
    </div>
  );
}
