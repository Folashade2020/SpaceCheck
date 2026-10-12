import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "@/components/ui";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  const { count: savesCount } = await supabase
    .from("saves")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: requestsCount } = await supabase
    .from("viewing_requests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { data: myReports } = await supabase
    .from("reports")
    .select("id")
    .eq("reporter_id", user.id)
    .limit(50);

  const { data: savedRows } = await supabase
    .from("saves")
    .select("property_id")
    .eq("user_id", user.id)
    .limit(20);

  const savedIds = (savedRows ?? []).map((s) => s.property_id);
  let savedProps: { id: string; property_type: string | null; general_area: string | null; neighborhood: string | null; rent: number | null }[] = [];
  if (savedIds.length > 0) {
    const { data } = await supabase
      .from("property_public")
      .select("id, property_type, general_area, neighborhood, rent")
      .in("id", savedIds);
    savedProps = data ?? [];
  }

  const { data: myRequests } = await supabase
    .from("viewing_requests")
    .select("id, property_id, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const stats = [
    { label: "Saved", value: savesCount ?? 0 },
    { label: "Viewings", value: requestsCount ?? 0 },
    { label: "Reports", value: myReports?.length ?? 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <section className="card" style={{ padding: "1.5rem", background: "#1C1917", borderColor: "#1C1917", color: "#FAF9F6" }}>
        <p style={{ fontSize: "0.8rem", color: "#A7F3D0", fontWeight: 700 }}>DASHBOARD</p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, marginTop: "0.3rem" }}>
          {profile?.email ?? user.email}
        </h1>
        <p style={{ fontSize: "0.87rem", color: "#D6D3D1" }}>
          Role: {profile?.role ?? "Not provided"}
        </p>
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.9rem", flexWrap: "wrap" }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "#292524", borderRadius: 10, padding: "0.55rem 0.9rem" }}>
              <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>{s.value}</span>{" "}
              <span style={{ fontSize: "0.8rem", color: "#A8A29E" }}>{s.label}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.6rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <Link href="/search" className="btn-primary btn-sm">Find a property</Link>
          <Link href="/preferences" className="btn-secondary btn-sm" style={{ borderColor: "#44403C", color: "#FAF9F6" }}>Edit preferences</Link>
        </div>
      </section>

      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <h2 style={{ fontWeight: 800 }}>Saved properties ({savedProps.length})</h2>
        {savedProps.length === 0 ? (
          <p style={{ marginTop: "0.4rem", fontSize: "0.88rem", color: "#57534e" }}>
            Nothing saved yet. Open a property and tap ☆ Save.
          </p>
        ) : (
          <ul style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.9rem" }}>
            {savedProps.map((p) => (
              <li key={p.id}>
                <Link href={`/properties/${p.id}`} style={{ color: "#047857", fontWeight: 600 }}>
                  {p.property_type ?? "Property"} · {p.neighborhood ?? p.general_area ?? "area"} · ₦{p.rent ?? "?"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card" style={{ padding: "1.3rem 1.4rem" }}>
        <h2 style={{ fontWeight: 800 }}>My viewing requests ({myRequests?.length ?? 0})</h2>
        {(myRequests ?? []).length === 0 ? (
          <p style={{ marginTop: "0.4rem", fontSize: "0.88rem", color: "#57534e" }}>
            No requests yet. Open a property and tap Request a Viewing.
          </p>
        ) : (
          <ul style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.88rem", color: "#57534e" }}>
            {(myRequests ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/properties/${r.property_id}`} style={{ color: "#047857", fontWeight: 600 }}>Property</Link>
                {" "}· {r.status} · {new Date(r.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div style={{ display: "flex", gap: "0.8rem", fontSize: "0.85rem", flexWrap: "wrap" }}>
        <Link href="/onboarding" style={{ color: "#047857", fontWeight: 600 }}>Change role</Link>
        <Link href="/submit" style={{ color: "#047857", fontWeight: 600 }}>List a property</Link>
      </div>

      <p style={{ fontSize: "0.8rem", color: "#78716c", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <BrandMark size={18} /> Connected to Supabase.
      </p>
    </div>
  );
}
