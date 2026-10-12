import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { savePreferences } from "./actions";
import { PRIORITY_LABELS } from "@/lib/fitScore";
import { PROPERTY_TYPES } from "@/lib/locations";
import { BrandMark } from "@/components/ui";

const PRIORITY_STYLE: Record<string, { tile: string; dot: string }> = {
  electricity: { tile: "peer-checked:border-amber-500 peer-checked:bg-amber-50", dot: "#f59e0b" },
  flood: { tile: "peer-checked:border-sky-500 peer-checked:bg-sky-50", dot: "#0ea5e9" },
  water: { tile: "peer-checked:border-cyan-500 peer-checked:bg-cyan-50", dot: "#06b6d4" },
  road_access: { tile: "peer-checked:border-orange-500 peer-checked:bg-orange-50", dot: "#f97316" },
  network_quality: { tile: "peer-checked:border-violet-500 peer-checked:bg-violet-50", dot: "#8b5cf6" },
  security: { tile: "peer-checked:border-emerald-500 peer-checked:bg-emerald-50", dot: "#00A86B" },
};

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
    <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
      <section className="card" style={{ padding: "1.6rem", background: "#0F172A", borderColor: "#0F172A", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <BrandMark />
          <p style={{ fontSize: "0.75rem", fontWeight: 800, color: "#A7F3D0", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Renter onboarding
          </p>
        </div>
        <h1 style={{ marginTop: "0.5rem", fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
          What matters to you?
        </h1>
        <p style={{ marginTop: "0.35rem", fontSize: "0.9rem", color: "#CBD5E1", lineHeight: 1.6 }}>
          Used only to rank <em>Best Match for You</em> and compute your personal Fit Score - never shared.
        </p>
        {error && (
          <p style={{ marginTop: "0.8rem", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
            {error}
          </p>
        )}
      </section>

      <form action={savePreferences} className="card" style={{ padding: "1.4rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label className="label">
          Where are you looking? (comma separated)
          <input
            name="areas"
            placeholder="e.g. Opebi, Allen Avenue, Lekki Phase 1"
            defaultValue={(prefs?.areas ?? []).join(", ")}
            className="input"
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
          <label className="label">
            Min budget (₦)
            <input name="budget_min" type="number" placeholder="500000" defaultValue={prefs?.budget_min ?? ""} className="input" />
          </label>
          <label className="label">
            Max budget (₦)
            <input name="budget_max" type="number" placeholder="2000000" defaultValue={prefs?.budget_max ?? ""} className="input" />
          </label>
        </div>

        <label className="label">
          Property type
          <select name="property_type" defaultValue={prefs?.property_type ?? ""} className="input">
            <option value="">No preference</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        <fieldset>
          <legend className="label">What matters most? (pick up to 6)</legend>
          <div style={{ marginTop: "0.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.55rem" }}>
            {Object.entries(PRIORITY_LABELS).map(([key, label]) => {
              const style = PRIORITY_STYLE[key] ?? PRIORITY_STYLE.security;
              return (
                <label key={key} style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    name={`prio_${key}`}
                    defaultChecked={selected.includes(key)}
                    className="peer sr-only"
                  />
                  <span
                    className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 transition ${style.tile}`}
                    style={{ display: "flex" }}
                  >
                    <span aria-hidden style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: style.dot }} />
                    {label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <button type="submit" className="btn-primary">
          Save and see Best Match
        </button>
      </form>
    </div>
  );
}
