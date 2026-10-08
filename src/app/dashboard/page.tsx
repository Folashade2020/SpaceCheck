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
          Supabase connected.
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
        <h2 className="font-semibold">Next steps (Phase 1)</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-zinc-600">
          <li>Submit a property (owner/agent)</li>
          <li>Set renter preferences</li>
          <li>See Property Fit Score with confidence</li>
        </ul>
      </div>
    </div>
  );
}
