"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProperty(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const str = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    return v === "" ? null : v;
  };
  const num = (key: string) => {
    const v = String(formData.get(key) ?? "").trim();
    if (v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const propertyType = str("property_type");
  const bedrooms = num("bedrooms");
  const rent = num("rent");
  const generalArea = str("general_area");

  if (!propertyType || bedrooms === null || rent === null || !generalArea) {
    redirect("/submit?error=Property+type%2C+bedrooms%2C+rent+and+general+area+are+required");
  }

  const photoRaw = String(formData.get("photo_urls") ?? "");
  const photos = photoRaw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  const { data, error } = await supabase
    .from("properties")
    .insert({
      owner_id: user.id,
      property_type: propertyType,
      bedrooms,
      bathrooms: num("bathrooms"),
      rent,
      general_area: generalArea,
      availability: str("availability") ?? "Available",
      verification_status: "Limited information",
      photos,
      contact_name: str("contact_name"),
      contact_phone: str("contact_phone"),
      electricity: str("electricity"),
      flood: str("flood"),
      water: str("water"),
      road_access: str("road_access"),
      network_quality: str("network_quality"),
      security_features: str("security_features"),
      nearby_places: str("nearby_places"),
      // Private: never rendered publicly. Stored for future verified viewing flow.
      exact_address: str("exact_address"),
      is_available: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/submit?error=${encodeURIComponent(error?.message ?? "Could not save property")}`);
  }

  revalidatePath("/search");
  redirect(`/properties/${data.id}`);
}
