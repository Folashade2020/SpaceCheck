"use client";

import { useRef, useState } from "react";
import { createProperty } from "./actions";
import { DISTRICTS, PROPERTY_TYPES } from "@/lib/locations";
import { LIVING_FIELDS } from "@/lib/options";

const STEPS = ["Basics", "Location", "Living conditions", "Contact & photos"];

function ChipGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }} role="radiogroup" aria-label={name}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? "" : opt)}
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              borderRadius: 999,
              padding: "0.42rem 0.85rem",
              border: selected ? "2px solid #047857" : "1px solid #d6d3d1",
              background: selected ? "#ecfdf5" : "#fff",
              color: selected ? "#065f46" : "#44403c",
              cursor: "pointer",
            }}
          >
            {selected ? "✓ " : ""}{opt}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}

function Dropzone() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");

  function syncInput(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (inputRef.current) inputRef.current.files = dt.files;
  }

  function add(incoming: File[]) {
    const valid = incoming.filter((f) => f.type.startsWith("image/") && f.size <= 2 * 1024 * 1024);
    if (valid.length < incoming.length) {
      setError("Only images up to 2MB each are accepted.");
    } else {
      setError("");
    }
    const next = [...files, ...valid].slice(0, 5);
    setFiles(next);
    syncInput(next);
  }

  function removeAt(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    syncInput(next);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); add([...e.dataTransfer.files]); }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
        aria-label="Upload property photos. Activate to browse files, or drag and drop images here."
        style={{
          border: dragging ? "2px dashed #047857" : "2px dashed #d6d3d1",
          borderRadius: 12,
          padding: "1.4rem",
          textAlign: "center",
          background: dragging ? "#ecfdf5" : "#FAF9F6",
          cursor: "pointer",
        }}
      >
        <p style={{ fontWeight: 700 }}>Drag & drop photos here, or click to browse</p>
        <p className="hint">Up to 5 images · JPG/PNG · 2MB each</p>
        <input ref={inputRef} type="file" name="photos" accept="image/*" multiple className="sr-only" tabIndex={-1}
          onChange={(e) => add([...(e.target.files ?? [])])} />
      </div>
      {error && <p style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "#b91c1c" }}>{error}</p>}
      {files.length > 0 && (
        <div style={{ marginTop: "0.6rem", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: "0.5rem" }}>
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} style={{ position: "relative" }}>
              <img src={URL.createObjectURL(f)} alt={`Upload preview ${i + 1}`} style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 10, border: "1px solid #e7e5e4" }} />
              <button type="button" onClick={() => removeAt(i)} aria-label={`Remove ${f.name}`}
                style={{ position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%", background: "#1c1917", color: "#fff", fontSize: 12, cursor: "pointer" }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubmitWizard() {
  const [step, setStep] = useState(0);
  const [chips, setChips] = useState<Record<string, string>>({});
  const stepRef = useRef<HTMLDivElement>(null);

  function goNext() {
    const root = stepRef.current;
    if (root) {
      const fields = root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("input[required], select[required]");
      for (const el of fields) {
        if (!el.checkValidity()) {
          el.reportValidity();
          return;
        }
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div>
      {/* Progress tracker */}
      <ol aria-label="Listing progress" style={{ display: "flex", gap: "0.4rem", marginBottom: "1.1rem" }}>
        {STEPS.map((label, i) => (
          <li key={label} style={{ flex: 1 }}>
            <div style={{ height: 6, borderRadius: 999, background: i <= step ? "#047857" : "#e7e5e4" }} />
            <p style={{ marginTop: "0.35rem", fontSize: "0.72rem", fontWeight: i === step ? 800 : 600, color: i === step ? "#065f46" : "#78716c" }}>
              {i + 1}. {label}
            </p>
          </li>
        ))}
      </ol>

      <form action={createProperty}>
        <div ref={stepRef}>
          {step === 0 && (
            <fieldset className="card" style={{ padding: "1.4rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <legend style={{ fontWeight: 800, fontSize: "1.05rem", padding: "0 0.4rem" }}>The basics</legend>
              <label className="label">
                Property type *
                <select name="property_type" required className="input" defaultValue="">
                  <option value="">Select…</option>
                  {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <label className="label">
                  Bedrooms *
                  <input name="bedrooms" type="number" min={0} max={20} required placeholder="2" className="input" />
                </label>
                <label className="label">
                  Bathrooms
                  <input name="bathrooms" type="number" min={0} max={20} placeholder="2" className="input" />
                </label>
              </div>
              <label className="label">
                Rent (₦ per year) *
                <input name="rent" type="number" min={1} required placeholder="1500000" className="input" />
              </label>
              <label className="label">
                Availability
                <select name="availability" className="input" defaultValue="Available">
                  <option value="Available">Available</option>
                  <option value="Available soon">Available soon</option>
                  <option value="No longer available">No longer available</option>
                </select>
              </label>
            </fieldset>
          )}

          {step === 1 && (
            <fieldset className="card" style={{ padding: "1.4rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <legend style={{ fontWeight: 800, fontSize: "1.05rem", padding: "0 0.4rem" }}>Narrow location</legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <label className="label">
                  District *
                  <select name="district" required className="input" defaultValue="">
                    <option value="">Select…</option>
                    {Object.keys(DISTRICTS).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
                <label className="label">
                  Neighbourhood *
                  <select name="neighborhood" required className="input" defaultValue="">
                    <option value="">Select…</option>
                    {Object.entries(DISTRICTS).map(([d, areas]) => (
                      <optgroup key={d} label={d}>
                        {areas.map((a) => <option key={`${d}-${a}`} value={a}>{a}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </label>
              </div>
              <label className="label">
                Estate (optional)
                <input name="estate" placeholder="e.g. Ocean Palm Estate" className="input" />
                <span className="hint">Public text — no exact pin is ever shown.</span>
              </label>
              <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 10, padding: "0.7rem 0.9rem" }}>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#065f46" }}>🔒 Privacy promise</p>
                <label className="label" style={{ marginTop: "0.4rem" }}>
                  Exact street address
                  <input name="exact_address" placeholder="House no / street" className="input" />
                  <span className="hint">Your exact address is kept strictly private until viewing is confirmed. Only the neighbourhood is ever public.</span>
                </label>
              </div>
            </fieldset>
          )}

          {step === 2 && (
            <fieldset className="card" style={{ padding: "1.4rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
              <legend style={{ fontWeight: 800, fontSize: "1.05rem", padding: "0 0.4rem" }}>Living conditions</legend>
              <p style={{ fontSize: "0.85rem", color: "#57534e" }}>
                Tap what applies — or skip anything you haven&apos;t observed. Skipped fields show as “Not provided”, never guessed.
              </p>
              {LIVING_FIELDS.map((f) => (
                <div key={f.key}>
                  <p className="label" style={{ marginBottom: "0.35rem" }}>{f.label}</p>
                  <ChipGroup name={f.key} options={f.options} value={chips[f.key] ?? ""} onChange={(v) => setChips((c) => ({ ...c, [f.key]: v }))} />
                </div>
              ))}
              <label className="label">
                Security features
                <input name="security_features" placeholder="e.g. Gated, security personnel, CCTV" className="input" />
              </label>
              <label className="label">
                Nearby useful places
                <input name="nearby_places" placeholder="e.g. Market 10 min walk" className="input" />
              </label>
            </fieldset>
          )}

          {step === 3 && (
            <fieldset className="card" style={{ padding: "1.4rem", display: "flex", flexDirection: "column", gap: "0.8rem" }}>
              <legend style={{ fontWeight: 800, fontSize: "1.05rem", padding: "0 0.4rem" }}>Contact & photos</legend>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7rem" }}>
                <label className="label">
                  Contact name
                  <input name="contact_name" placeholder="Your name" className="input" />
                </label>
                <label className="label">
                  Contact phone
                  <input name="contact_phone" placeholder="080…" className="input" />
                </label>
              </div>
              <div>
                <p className="label" style={{ marginBottom: "0.35rem" }}>Photos</p>
                <Dropzone />
              </div>
              <label className="label">
                …or photo URLs (one per line)
                <textarea name="photo_urls" rows={2} placeholder="https://…" className="input" />
              </label>
            </fieldset>
          )}
        </div>

        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "space-between", gap: "0.6rem" }}>
          {step > 0 ? (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="btn-secondary">
              ← Back
            </button>
          ) : <span />}
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={goNext} className="btn-primary">
              Continue →
            </button>
          ) : (
            <button type="submit" className="btn-primary">
              Publish listing
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
