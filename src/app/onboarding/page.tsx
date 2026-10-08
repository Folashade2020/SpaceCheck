import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateRole } from "@/app/auth/actions";

export default async function OnboardingPage({
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Choose your role</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Current role: {profile?.role ?? "Not provided"}. You can change it
        anytime.
      </p>
      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={updateRole} className="mt-4 space-y-3">
        <label className="block text-sm">
          Role
          <select
            name="role"
            defaultValue={profile?.role ?? "renter"}
            className="mt-1 w-full rounded border px-3 py-2"
          >
            <option value="renter">Renter</option>
            <option value="owner_agent">Owner / Agent</option>
            <option value="community">Community user</option>
          </select>
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Save and continue
        </button>
      </form>
    </div>
  );
}
