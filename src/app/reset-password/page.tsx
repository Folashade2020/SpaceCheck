"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function onSubmit(formData: FormData) {
    const password = String(formData.get("password") ?? "");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Choose a new password</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Opened from the email link? Enter your new password here.
      </p>
      {message && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
          {message}
        </p>
      )}
      <form action={onSubmit} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-zinc-900">
          New password
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Update password
        </button>
      </form>
    </div>
  );
}
