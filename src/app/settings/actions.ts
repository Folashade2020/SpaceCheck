"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * NDPA erasure: removes the user's personal data while preserving
 * marketplace integrity (listings stay, anonymized; reports stay, unattributed).
 * Auth identity itself requires the service_role key and must be removed
 * via Supabase Dashboard > Authentication > user > Delete.
 */
export async function deleteMyData() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Anonymize owned listings (keep the property intelligence, drop identity).
  await supabase
    .from("properties")
    .update({
      owner_id: null,
      contact_name: null,
      contact_phone: null,
      exact_address: null,
    })
    .eq("owner_id", user.id);

  // Unattribute community reports (keep the observations).
  await supabase
    .from("reports")
    .update({ reporter_id: null })
    .eq("reporter_id", user.id);

  await supabase.from("listing_reports").delete().eq("reporter_id", user.id);
  await supabase.from("saves").delete().eq("user_id", user.id);
  await supabase.from("viewing_requests").delete().eq("user_id", user.id);
  await supabase.from("preferences").delete().eq("user_id", user.id);
  await supabase.from("profiles").delete().eq("id", user.id);

  await supabase.auth.signOut();
  redirect("/?deleted=1");
}
