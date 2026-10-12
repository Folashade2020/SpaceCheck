import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandMark } from "./ui";
import MobileNav from "./MobileNav";
import { DesktopNav } from "./NavLinks";

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
        <DesktopNav loggedIn={!!user} />
        <MobileNav loggedIn={!!user} />
      </nav>
    </header>
  );
}
