import Link from "next/link";
import type { ReactNode } from "react";

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        borderRadius: 9,
        background: "#00a86b",
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        fontSize: size * 0.55,
      }}
    >
      âœ“
    </span>
  );
}

export function EvidenceBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls = s.includes("verif")
    ? "badge badge-brand"
    : s.includes("community") || s.includes("report")
      ? "badge badge-brand"
      : s.includes("owner") || s.includes("agent")
        ? "badge badge-neutral"
        : "badge badge-warn";
  return <span className={cls}>{status}</span>;
}

export function ScoreRing({
  score,
  size = 104,
}: {
  score: number;
  size?: number;
}) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  return (
    <div
      role="img"
      aria-label={`Property fit score ${score} out of 100`}
      style={{ width: size, height: size, position: "relative" }}
    >
      <svg width={size} height={size} viewBox="0 0 104 104">
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          strokeWidth="10"
          className="score-ring-track"
        />
        <circle
          cx="52"
          cy="52"
          r={r}
          fill="none"
          strokeWidth="10"
          className="score-ring-value"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform="rotate(-90 52 52)"
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 11, color: "#64748b" }}>/100 fit</span>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="card" style={{ padding: "2rem", textAlign: "center" }}>
      <p style={{ fontWeight: 700, fontSize: "1.05rem" }}>{title}</p>
      <p style={{ marginTop: "0.4rem", fontSize: "0.9rem", color: "#475569" }}>
        {body}
      </p>
      {action && (
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center", gap: "0.6rem" }}>
          {action}
        </div>
      )}
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer style={{ borderTop: "1px solid #e2e8f0", background: "#1e293b", color: "#e2e8f0" }}>
      <div
        className="mx-auto w-full max-w-5xl px-4"
        style={{
          paddingTop: "2.2rem",
          paddingBottom: "1.4rem",
          display: "grid",
          gap: "1.6rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
          <BrandMark />
          <div>
            <p style={{ fontWeight: 800 }}>SpaceCheck</p>
            <p style={{ fontSize: "0.82rem", color: "#94a3b8" }}>
              Check the space before you commit.
            </p>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "1.4rem",
            fontSize: "0.85rem",
          }}
        >
          <Link href="/search" style={{ color: "#e2e8f0" }}>Search properties</Link>
          <Link href="/preferences" style={{ color: "#e2e8f0" }}>Set preferences</Link>
          <Link href="/submit" style={{ color: "#e2e8f0" }}>List a property</Link>
          <Link href="/signup" style={{ color: "#e2e8f0" }}>Sign up</Link>
          <Link href="/login" style={{ color: "#e2e8f0" }}>Log in</Link>
        </div>
        <p style={{ fontSize: "0.75rem", color: "#94a3b8", borderTop: "1px solid #334155", paddingTop: "1rem" }}>
          SpaceCheck shows what is known and labels what is not. Unknown
          information appears as â€œNot providedâ€ or â€œLimited informationâ€ â€” never
          invented. Exact residential addresses are never published.
        </p>
      </div>
    </footer>
  );
}
