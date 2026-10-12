import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { BrandMark } from "@/components/ui";
import NdpaConsent from "@/components/NdpaConsent";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="card" style={{ maxWidth: 440, margin: "0 auto", padding: "1.8rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <BrandMark />
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800 }}>Create account</h1>
      </div>
      <p style={{ marginTop: "0.3rem", fontSize: "0.88rem", color: "#475569" }}>
        Free. Save properties, request viewings, get personal Fit Scores.
      </p>
      {error && (
        <p style={{ marginTop: "0.9rem", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
      <form action={signup} style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        <label className="label">
          Email
          <input name="email" type="email" required className="input" placeholder="you@example.com" autoComplete="email" />
        </label>
        <label className="label">
          Password (min 6 characters)
          <input name="password" type="password" required minLength={6} className="input" autoComplete="new-password" />
        </label>
        <label className="label">
          I am a...
          <select name="role" className="input" defaultValue="renter">
            <option value="renter">Renter - looking for a place</option>
            <option value="owner_agent">Owner / Agent - listing property</option>
            <option value="community">Community - lived in / visited</option>
          </select>
        </label>
        <NdpaConsent />
        <button type="submit" className="btn-primary">Sign up free</button>
      </form>
      <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#475569" }}>
        Already have an account? <Link href="/login" style={{ color: "#00a86b", fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
