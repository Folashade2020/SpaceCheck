"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/auth/actions";

const LINKS = [
  { href: "/search", label: "Search" },
  { href: "/submit", label: "List property" },
  { href: "/preferences", label: "Preferences" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNav({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  if (!loggedIn) {
    return (
      <div className="hidden md:flex items-center gap-1 text-sm">
        <Link
          href="/search"
          style={{
            fontWeight: 600,
            padding: "0.45rem 0.85rem",
            borderRadius: 999,
            background: isActive(pathname, "/search") ? "#ecfdf5" : "transparent",
            color: isActive(pathname, "/search") ? "#065f46" : "#1c1917",
          }}
        >
          Search
        </Link>
        <Link href="/login" style={{ fontWeight: 600, padding: "0.45rem 0.6rem" }}>
          Log in
        </Link>
        <Link href="/signup" className="btn-primary btn-sm">
          Sign up free
        </Link>
      </div>
    );
  }
  return (
    <div className="hidden md:flex items-center gap-1 text-sm">
      {LINKS.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            style={{
              fontWeight: 600,
              padding: "0.45rem 0.85rem",
              borderRadius: 999,
              background: active ? "#ecfdf5" : "transparent",
              color: active ? "#065f46" : "#1c1917",
            }}
          >
            {l.label}
          </Link>
        );
      })}
      <form action={logout}>
        <button type="submit" className="btn-secondary btn-sm">
          Log out
        </button>
      </form>
    </div>
  );
}

export function MobileNavMenu({ loggedIn }: { loggedIn: boolean }) {
  const pathname = usePathname();
  const links = loggedIn
    ? LINKS
    : [
        { href: "/search", label: "Search" },
        { href: "/login", label: "Log in" },
        { href: "/signup", label: "Sign up" },
      ];
  return (
    <>
      {links.map((l) => {
        const active = isActive(pathname, l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            style={{
              padding: "0.55rem 0.7rem",
              borderRadius: 8,
              fontWeight: 700,
              background: active ? "#ecfdf5" : "transparent",
              color: active ? "#065f46" : "#1c1917",
            }}
          >
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
