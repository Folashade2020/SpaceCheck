import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitWizard from "./SubmitWizard";

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
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.01em" }}>
        List your property
      </h1>
      <p style={{ marginTop: "0.3rem", fontSize: "0.9rem", color: "#475569" }}>
        Four quick steps. Anything you skip shows as &quot;Not provided&quot; - we never
        guess on your behalf.
      </p>
      {error && (
        <p style={{ marginTop: "0.8rem", borderRadius: 10, background: "#fef2f2", color: "#b91c1c", padding: "0.6rem 0.8rem", fontSize: "0.85rem" }}>
          {error}
        </p>
      )}
      <div style={{ marginTop: "1rem" }}>
        <SubmitWizard />
      </div>
    </div>
  );
}
