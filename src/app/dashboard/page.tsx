import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

  // RLS: user can only read their own saves/requests. Count them for proof of connection.
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
  let savedProps: { id: string; property_type: string | null; general_area: string | null; rent: number | null }[] = [];
  if (savedIds.length > 0) {
    const { data } = await supabase
      .from("property_public")
      .select("id, property_type, general_area, rent")
      .in("id", savedIds);
    savedProps = data ?? [];
  }

  const { data: myRequests } = await supabase
    .from("viewing_requests")
    .select("id, property_id, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Logged in as {profile?.email ?? user.email} · Role:{" "}
          {profile?.role ?? "Not provided"}
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          Saved: {savesCount ?? 0} · Viewing requests: {requestsCount ?? 0} ·
          Reports submitted: {myReports?.length ?? 0} · Supabase connected.
        </p>
        <div className="mt-4 flex gap-3 text-sm">
          <Link href="/onboarding" className="underline">
            Change role
          </Link>
          <Link href="/preferences" className="underline">
            Set preferences
          </Link>
          <Link href="/search" className="underline">
            Search properties
          </Link>
          <Link href="/submit" className="underline">
            List a property
          </Link>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">Saved properties ({savedProps.length})</h2>
        {savedProps.length === 0 ? (
          <p className="mt-1 text-sm text-zinc-600">
            Nothing saved yet. Open a property and tap ☆ Save.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {savedProps.map((p) => (
              <li key={p.id}>
                <Link href={`/properties/${p.id}`} className="underline">
                  {p.property_type ?? "Property"} · {p.general_area ?? "area"} · ₦{p.rent ?? "?"}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold">My viewing requests ({myRequests?.length ?? 0})</h2>
        {(myRequests ?? []).length === 0 ? (
          <p className="mt-1 text-sm text-zinc-600">
            No requests yet. Open a property and tap Request a Viewing.
          </p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm text-zinc-600">
            {(myRequests ?? []).map((r) => (
              <li key={r.id}>
                <Link href={`/properties/${r.property_id}`} className="underline">
                  Property
                </Link>{" "}
                · {r.status} · {new Date(r.created_at).toLocaleDateString()}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
