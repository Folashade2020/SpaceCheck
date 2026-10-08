import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-zinc-500">
          Lagos, Nigeria — residential rentals
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Find the right space. Know what you&apos;re moving into.
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          SpaceCheck combines property info with real-world intelligence —
          flooding, electricity, water, road access, network, security signals —
          plus reports from residents and visitors. No invented data.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-zinc-900 px-5 py-2.5 text-white"
          >
            Get started
          </Link>
          <Link
            href="/search"
            className="rounded-full border px-5 py-2.5 hover:bg-zinc-100"
          >
            Search properties
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: "Your Property Fit",
            body: "Personal score per renter, with confidence shown separately. Missing info lowers confidence, never fakes a score.",
          },
          {
            title: "Evidence labels",
            body: "Every fact shows its source: Verified, Owner-reported, Community-reported, Limited information.",
          },
          {
            title: "Community loop",
            body: "Visit a property, report what you found. Future renters benefit from your experience.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{c.title}</h2>
            <p className="mt-2 text-sm text-zinc-600">{c.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
