import { requestPasswordReset } from "@/app/auth/actions";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; sent?: string }>;
}) {
  const { error, sent } = await searchParams;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Reset password</h1>
      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {sent && (
        <p className="mt-4 rounded bg-green-50 p-2 text-sm text-green-800">
          Check your email for the reset link.
        </p>
      )}
      <form action={requestPasswordReset} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-zinc-900">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Send reset link
        </button>
      </form>
    </div>
  );
}
