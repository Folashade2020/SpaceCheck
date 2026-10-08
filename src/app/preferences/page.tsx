import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePreferences } from "./actions";
import { PRIORITY_LABELS } from "@/lib/fitScore";

const inputClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900";

export default async function PreferencesPage({
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

  const { data: prefs } = await supabase
    .from("preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const selected: string[] = Array.isArray(prefs?.priorities)
    ? prefs.priorities
    : [];

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">
          What matters to you?
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Short onboarding (PRD Sec 11). Used only to rank <em>Best Match for
          You</em> and compute your personal Fit Score — never shared.
        </p>
        {error && (
          <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <form
        action={savePreferences}
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
      >
        <label className="block text-sm font-medium text-zinc-900">
          Where are you looking? (comma separated)
          <input
            name="areas"
            placeholder="e.g. Lekki, Yaba, Ikeja"
            defaultValue={(prefs?.areas ?? []).join(", ")}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium text-zinc-900">
            Min budget (₦)
            <input
              name="budget_min"
              type="number"
              placeholder="500000"
              defaultValue={prefs?.budget_min ?? ""}
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-medium text-zinc-900">
            Max budget (₦)
            <input
              name="budget_max"
              type="number"
              placeholder="2000000"
              defaultValue={prefs?.budget_max ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block text-sm font-medium text-zinc-900">
          Property type
          <select name="property_type" defaultValue={prefs?.property_type ?? ""} className={inputClass}>
            <option value="">No preference</option>
            <option value="Self-contained">Self-contained</option>
            <option value="1 bedroom">1 bedroom</option>
            <option value="2 bedroom">2 bedroom</option>
            <option value="3 bedroom">3 bedroom</option>
            <option value="Duplex">Duplex</option>
            <option value="Bungalow">Bungalow</option>
            <option value="Studio">Studio</option>
          </select>
        </label>

        <fieldset>
          <legend className="text-sm font-medium text-zinc-900">
            What matters most? (pick up to 6)
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-sm text-zinc-900"
              >
                <input
                  type="checkbox"
                  name={`prio_${key}`}
                  defaultChecked={selected.includes(key)}
                  className="h-4 w-4 accent-zinc-900"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Save and see Best Match
        </button>
      </form>
    </div>
  );
}
