import { signup } from "@/app/auth/actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Sign up to save properties and request viewings.
      </p>
      {error && (
        <p className="mt-4 rounded bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <form action={signup} className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-zinc-900">
          Email
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-900">
          Password (min 6 characters)
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
          />
        </label>
        <label className="block text-sm font-medium text-zinc-900">
          I am a…
          <select
            name="role"
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900"
            defaultValue="renter"
          >
            <option value="renter">Renter — looking for a place</option>
            <option value="owner_agent">Owner / Agent — listing property</option>
            <option value="community">Community — lived in / visited</option>
          </select>
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-zinc-900 py-2.5 text-white"
        >
          Sign up
        </button>
      </form>
    </div>
  );
}
