import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deleteMyData } from "./actions";
import { BrandMark } from "@/components/ui";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
        <BrandMark />
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800 }}>Settings & privacy</h1>
      </div>

      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <h2 style={{ fontWeight: 800 }}>Your data (NDPA)</h2>
        <p style={{ marginTop: "0.4rem", fontSize: "0.88rem", color: "#475569", lineHeight: 1.6 }}>
          SpaceCheck protects your data under the Nigeria Data Protection Act.
          Your exact street address is never published, and contact details are
          shared only with a confirmed viewing counterparty. You may withdraw
          consent and erase your personal data at any time.
        </p>
        {error && (
          <p style={{ marginTop: "0.7rem", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
            {error}
          </p>
        )}
      </section>

      <section className="card" style={{ padding: "1.3rem 1.4rem", borderColor: "#fecaca" }}>
        <h2 style={{ fontWeight: 800, color: "#b91c1c" }}>Danger zone</h2>
        <p style={{ marginTop: "0.4rem", fontSize: "0.87rem", color: "#475569", lineHeight: 1.6 }}>
          Delete My Account &amp; Personal Data: removes your profile,
          preferences, saves, viewing requests and flags, anonymizes your
          listings and reports, and logs you out. Listings you created stay
          visible without your identity so other renters keep the area
          intelligence.
        </p>
        <form action={deleteMyData} style={{ marginTop: "0.8rem" }}>
          <button
            type="submit"
            style={{ background: "#b91c1c", color: "#fff", fontWeight: 700, borderRadius: 999, padding: "0.65rem 1.4rem", fontSize: "0.9rem", cursor: "pointer", border: "none" }}
          >
            Delete My Account &amp; Personal Data
          </button>
        </form>
        <p style={{ marginTop: "0.6rem", fontSize: "0.78rem", color: "#64748b" }}>
          Note: the bare login identity is removed separately via Supabase
          Dashboard &gt; Authentication (requires the service key, never shipped
          in the app).
        </p>
      </section>
    </div>
  );
}
