import Link from "next/link";
import { login } from "@/app/auth/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Log in</h1>
      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={login} className="mt-4 space-y-3">
        <label className="block text-sm">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Password
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Log in
        </button>
      </form>
      <p className="mt-4 text-sm">
        <Link href="/forgot-password" className="underline">
          Forgot password?
        </Link>{" "}
        ·{" "}
        <Link href="/signup" className="underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
