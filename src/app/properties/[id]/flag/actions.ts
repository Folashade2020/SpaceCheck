"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const REASONS = [
  "Fake property",
  "Wrong location",
  "Already rented",
  "Misleading info",
  "Suspicious agent",
  "Duplicate",
] as const;

export async function flagListing(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const reason = String(formData.get("reason") ?? "");
  if (!REASONS.includes(reason as (typeof REASONS)[number])) {
    redirect(`/properties/${propertyId}/flag?error=Choose+a+reason`);
  }

  const comment = String(formData.get("comment") ?? "").trim() || null;

  const { error } = await supabase.from("listing_reports").insert({
    property_id: propertyId,
    reporter_id: user.id,
    reason,
    comment,
  });

  if (error) {
    redirect(
      `/properties/${propertyId}/flag?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}?flagged=1`);
}
