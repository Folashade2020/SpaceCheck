import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { submitReport } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900";

function Field({
  name,
  label,
  placeholder,
}: {
  name: string;
  label: string;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-900">
      {label}
      <input name={name} placeholder={placeholder} className={inputClass} />
    </label>
  );
}

export default async function ReportPage({
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

  const { data: property } = await supabase
    .from("property_public")
    .select("property_type, general_area")
    .eq("id", id)
    .single();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">What did you find?</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Reporting on {property?.property_type ?? "property"} ·{" "}
          {property?.general_area ?? "area"}. Short form — fill what you
          observed, leave the rest blank. Your source label is shown publicly.
        </p>
        {error && (
          <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <form
        action={submitReport.bind(null, id)}
        className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <label className="block text-sm font-medium text-zinc-900">
          I am a…
          <select name="source_type" defaultValue="visitor" className={inputClass}>
            <option value="visitor">Visitor — only visited</option>
            <option value="current_resident">Current resident</option>
            <option value="former_resident">Former resident</option>
            <option value="owner_agent">Owner / Agent</option>
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Field name="electricity" label="Electricity" placeholder="e.g. Evenings only" />
          <Field name="flood" label="Flooding" placeholder="e.g. Road floods after rain" />
          <Field name="water" label="Water" placeholder="e.g. Borehole reliable" />
          <Field name="road_access" label="Road / access" placeholder="e.g. Hard after rainfall" />
          <Field name="network_quality" label="Network" placeholder="e.g. Glo poor here" />
          <Field name="security_experience" label="Security experience" placeholder="e.g. Gate + guard at night" />
        </div>

        <label className="block text-sm font-medium text-zinc-900">
          Was the listing accurate?
          <select name="listing_accuracy" defaultValue="" className={inputClass}>
            <option value="">Skip</option>
            <option value="Yes">Yes</option>
            <option value="Partly">Partly</option>
            <option value="No">No</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-zinc-900">
          Additional comments (optional)
          <textarea
            name="comment"
            rows={3}
            placeholder="What should the next renter verify?"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Submit report
        </button>
      </form>
    </div>
  );
}
