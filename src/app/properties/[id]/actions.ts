"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function saveProperty(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("saves")
    .upsert({ user_id: user.id, property_id: propertyId });

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
}

export async function unsaveProperty(propertyId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("saves")
    .delete()
    .eq("user_id", user.id)
    .eq("property_id", propertyId);

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
}

export async function requestViewing(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (formData.get("ndpa_consent") !== "on") {
    redirect(`/properties/${propertyId}?error=${encodeURIComponent("Please accept the NDPA privacy notice to continue")}`);
  }

  const message = String(formData.get("message") ?? "").trim() || null;

  const { error } = await supabase.from("viewing_requests").insert({
    user_id: user.id,
    property_id: propertyId,
    message,
    status: "pending",
  });

  if (error) {
    redirect(
      `/properties/${propertyId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/dashboard");
  redirect(`/properties/${propertyId}?viewing=requested`);
}

export async function updateAvailability(propertyId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const availability = String(formData.get("availability") ?? "");
  const allowed = ["Available", "Available soon", "No longer available"];
  if (!allowed.includes(availability)) {
    redirect(`/properties/${propertyId}?error=Invalid+availability`);
  }

  // RLS "Owners manage own properties" enforces ownership.
  const { error } = await supabase
    .from("properties")
    .update({
      availability,
      is_available: availability !== "No longer available",
    })
    .eq("id", propertyId);

  if (error) {
    redirect(
      `/properties/${propertyId}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath(`/properties/${propertyId}`);
  revalidatePath("/search");
  redirect(`/properties/${propertyId}`);
}

async function setRequestStatus(propertyId: string, requestId: string, status: "confirmed" | "declined") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Ownership is enforced twice: app-level check + RLS policy.
  const { data: property } = await supabase
    .from("properties")
    .select("id, owner_id")
    .eq("id", propertyId)
    .single();

  if (!property || property.owner_id !== user.id) {
    redirect(`/properties/${propertyId}?error=Only+the+lister+can+do+that`);
  }

  const { error } = await supabase
    .from("viewing_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("property_id", propertyId);

  if (error) {
    redirect(`/properties/${propertyId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/properties/${propertyId}`);
  redirect(`/properties/${propertyId}`);
}

export async function confirmViewingRequest(propertyId: string, requestId: string) {
  await setRequestStatus(propertyId, requestId, "confirmed");
}

export async function declineViewingRequest(propertyId: string, requestId: string) {
  await setRequestStatus(propertyId, requestId, "declined");
}
