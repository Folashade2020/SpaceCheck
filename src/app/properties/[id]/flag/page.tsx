import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { flagListing } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900";

const REASONS = [
  "Fake property",
  "Wrong location",
  "Already rented",
  "Misleading info",
  "Suspicious agent",
  "Duplicate",
];

export default async function FlagPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-md space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">Report listing</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Flags are shown publicly as counts. Listings are never auto-deleted -
          renters decide with transparency.
        </p>
        {error && (
          <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <form
        action={flagListing.bind(null, id)}
        className="space-y-3 rounded-2xl bg-white p-6 shadow-sm"
      >
        <label className="block text-sm font-medium text-zinc-900">
          Reason
          <select name="reason" required defaultValue="" className={inputClass}>
            <option value="">Select...</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-zinc-900">
          Details (optional)
          <textarea
            name="comment"
            rows={3}
            placeholder="What looks wrong?"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Submit flag
        </button>
      </form>
    </div>
  );
}
