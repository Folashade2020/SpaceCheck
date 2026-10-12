import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="card" style={{ maxWidth: 440, margin: "2rem auto", padding: "2rem", textAlign: "center" }}>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>You are offline</h1>
      <p style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#475569" }}>
        SpaceCheck needs a connection for live listings and scores. Your saved pages may still open from cache.
      </p>
      <Link href="/" className="btn-primary" style={{ marginTop: "1rem" }}>
        Try again
      </Link>
    </div>
  );
}
