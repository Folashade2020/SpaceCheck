"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SOURCES = ["visitor", "current_resident", "former_resident", "owner_agent"] as const;
const ACCURACY = ["Yes", "Partly", "No"] as const;

export async function submitReport(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (formData.get("ndpa_consent") !== "on") {
    redirect(`/properties/${propertyId}/report?error=${encodeURIComponent("Please accept the NDPA privacy notice to continue")}`);
  }

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };

  const sourceType = String(formData.get("source_type") ?? "visitor");
  if (!SOURCES.includes(sourceType as (typeof SOURCES)[number])) {
    redirect(`/properties/${propertyId}/report?error=Invalid+source+type`);
  }

  const accuracy = str("listing_accuracy");
  if (accuracy && !ACCURACY.includes(accuracy as (typeof ACCURACY)[number])) {
    redirect(`/properties/${propertyId}/report?error=Invalid+accuracy+value`);
  }

  const comment = str("comment");
  const hasField =
    str("electricity") ||
    str("flood") ||
    str("water") ||
    str("road_access") ||
    str("network_quality") ||
    str("security_experience") ||
    accuracy ||
    comment;

  if (!hasField) {
    redirect(`/properties/${propertyId}/report?error=Fill+at+least+one+field`);
  }

  const { error } = await supabase.from("reports").insert({
    property_id: propertyId,
    reporter_id: user.id,
    source_type: sourceType,
    electricity: str("electricity"),
    flood: str("flood"),
    water: str("water"),
    road_access: str("road_access"),
    network_quality: str("network_quality"),
    security_experience: str("security_experience"),
    listing_accuracy: accuracy,
    comment,
  });

  if (error) {
    redirect(
      `/properties/${propertyId}/report?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}
