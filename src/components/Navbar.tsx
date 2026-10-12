import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/auth/actions";
import { BrandMark } from "./ui";
import MobileNav from "./MobileNav";

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header
      style={{
        borderBottom: "1px solid #e7e5e4",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <nav
        className="mx-auto flex w-full max-w-5xl items-center justify-between px-4"
        style={{ paddingTop: "0.7rem", paddingBottom: "0.7rem", position: "relative" }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          <BrandMark />
          <span style={{ fontWeight: 800, fontSize: "1.05rem", letterSpacing: "-0.01em" }}>
            SpaceCheck
          </span>
        </Link>
        <div className="hidden items-center gap-4 text-sm md:flex">
          <Link href="/search" style={{ fontWeight: 600 }}>
            Search
          </Link>
          {user ? (
            <>
              <Link href="/submit" style={{ fontWeight: 600 }}>
                List property
              </Link>
              <Link href="/preferences" style={{ fontWeight: 600 }}>
                Preferences
              </Link>
              <Link href="/dashboard" style={{ fontWeight: 600 }}>
                Dashboard
              </Link>
              <form action={logout}>
                <button type="submit" className="btn-secondary btn-sm">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" style={{ fontWeight: 600 }}>
                Log in
              </Link>
              <Link href="/signup" className="btn-primary btn-sm">
                Sign up free
              </Link>
            </>
          )}
        </div>
        <MobileNav loggedIn={!!user} />
      </nav>
    </header>
  );
}
