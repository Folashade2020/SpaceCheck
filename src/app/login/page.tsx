import Link from "next/link";
import { login } from "@/app/auth/actions";
import { BrandMark } from "@/components/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="card" style={{ maxWidth: 440, margin: "0 auto", padding: "1.8rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <BrandMark />
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Welcome back</h1>
      </div>
      <p style={{ marginTop: "0.3rem", fontSize: "0.88rem", color: "#475569" }}>
        Log in to see your personal Fit Scores and saved properties.
      </p>
      {error && (
        <p style={{ marginTop: "0.9rem", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
      <form action={login} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        <label className="label">
          Email
          <input name="email" type="email" required className="input" placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="label">
          Password
          <input name="password" type="password" required className="input" autoComplete="current-password" />
        </label>
        <button type="submit" className="btn-primary">Log in</button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#475569" }}>
        <Link href="/forgot-password" style={{ color: "#00a86b", fontWeight: 600 }}>Forgot password?</Link>
        {" · "}
        <Link href="/signup" style={{ color: "#00a86b", fontWeight: 600 }}>Create account</Link>
      </p>
    </div>
  );
}
