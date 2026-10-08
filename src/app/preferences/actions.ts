"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PriorityKey } from "@/lib/fitScore";

const ALLOWED: PriorityKey[] = [
  "electricity",
  "flood",
  "water",
  "road_access",
  "network_quality",
  "security",
];

export async function savePreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const areasRaw = String(formData.get("areas") ?? "");
  const areas = areasRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const toNum = (k: string) => {
    const v = String(formData.get(k) ?? "").trim();
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const priorities = ALLOWED.filter((k) => formData.get(`prio_${k}`) === "on");
  const propertyType = String(formData.get("property_type") ?? "").trim() || null;

  const { error } = await supabase.from("preferences").upsert({
    user_id: user.id,
    areas,
    budget_min: toNum("budget_min"),
    budget_max: toNum("budget_max"),
    property_type: propertyType,
    priorities,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    redirect(`/preferences?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/search");
  redirect("/search");
}
