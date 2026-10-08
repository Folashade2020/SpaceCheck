import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createProperty } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900";

function Field({
  label,
  name,
  required,
  placeholder,
  type = "text",
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
  hint?: string;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-900">
      {label} {required && <span className="text-red-600">*</span>}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-xs text-zinc-500">{hint}</span>}
    </label>
  );
}

export default async function SubmitPage({
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
    redirect("/login?next=/submit");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">List a property</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Status will show as <strong>Limited information</strong> until
          community reports arrive. Missing fields show as{" "}
          <strong>Not provided</strong> — never invented. Exact address is
          private and never shown publicly.
        </p>
        {error && (
          <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>

      <form
        action={createProperty}
        className="space-y-5 rounded-2xl bg-white p-6 shadow-sm"
      >
        <fieldset className="space-y-3">
          <legend className="font-semibold text-zinc-900">
            Required (PRD Sec 21)
          </legend>
          <label className="block text-sm font-medium text-zinc-900">
            Property type <span className="text-red-600">*</span>
            <select name="property_type" required className={inputClass}>
              <option value="">Select…</option>
              <option value="Self-contained">Self-contained</option>
              <option value="1 bedroom">1 bedroom</option>
              <option value="2 bedroom">2 bedroom</option>
              <option value="3 bedroom">3 bedroom</option>
              <option value="Duplex">Duplex</option>
              <option value="Bungalow">Bungalow</option>
              <option value="Studio">Studio</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Bedrooms"
              name="bedrooms"
              required
              type="number"
              placeholder="2"
            />
            <Field
              label="Bathrooms"
              name="bathrooms"
              type="number"
              placeholder="2"
            />
          </div>
          <Field
            label="Rent (₦ per year)"
            name="rent"
            required
            type="number"
            placeholder="1500000"
          />
          <Field
            label="General area"
            name="general_area"
            required
            placeholder="e.g. Lekki Phase 1, Yaba, Ikeja"
            hint="Public. Never enter a full street address here."
          />
          <label className="block text-sm font-medium text-zinc-900">
            Availability
            <select name="availability" className={inputClass} defaultValue="Available">
              <option value="Available">Available</option>
              <option value="Available soon">Available soon</option>
              <option value="No longer available">No longer available</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-zinc-900">
            Living conditions (optional, encouraged)
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <Field name="electricity" label="Electricity" placeholder="e.g. ~12 hrs/day, prepaid meter" />
            <Field name="flood" label="Flooding" placeholder="e.g. No flooding observed" />
            <Field name="water" label="Water" placeholder="e.g. Borehole, treated" />
            <Field name="road_access" label="Road / access" placeholder="e.g. 5 min from main road" />
            <Field name="network_quality" label="Network quality" placeholder="e.g. MTN good, Airtel fair" />
            <Field name="security_features" label="Security features" placeholder="e.g. Gated, security personnel, CCTV" />
          </div>
          <Field name="nearby_places" label="Nearby useful places" placeholder="e.g. Market 10 min walk, bus stop nearby" />
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-zinc-900">
            Contact + photos
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <Field name="contact_name" label="Contact name" placeholder="Your name" />
            <Field name="contact_phone" label="Contact phone" placeholder="080…" />
          </div>
          <label className="block text-sm font-medium text-zinc-900">
            Photo URLs (one per line, up to 10)
            <textarea
              name="photo_urls"
              rows={3}
              placeholder="https://…"
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-zinc-500">
              File upload to storage arrives later. URLs keep Phase 1 free and simple.
            </span>
          </label>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="font-semibold text-zinc-900">
            Private (never shown publicly)
          </legend>
          <Field
            name="exact_address"
            label="Exact address"
            placeholder="House no / street — private"
            hint="Only shared when you accept a viewing request (future)."
          />
        </fieldset>

        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Publish listing
        </button>
      </form>
    </div>
  );
}
