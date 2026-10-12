"use client";

import Link from "next/link";
import { useState } from "react";
import { logout } from "@/app/auth/actions";

export default function MobileNav({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const links = loggedIn
    ? [
        { href: "/search", label: "Search" },
        { href: "/submit", label: "List property" },
        { href: "/preferences", label: "Preferences" },
        { href: "/dashboard", label: "Dashboard" },
      ]
    : [
        { href: "/search", label: "Search" },
        { href: "/login", label: "Log in" },
        { href: "/signup", label: "Sign up" },
      ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        style={{
          border: "1px solid #e7e5e4",
          borderRadius: 10,
          padding: "0.45rem 0.7rem",
          fontWeight: 700,
          background: "#fff",
        }}
      >
        {open ? "✕" : "☰"}
      </button>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute",
            right: "1rem",
            top: "3.6rem",
            zIndex: 50,
            padding: "0.6rem",
            minWidth: 200,
            display: "flex",
            flexDirection: "column",
            gap: "0.2rem",
          }}
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              style={{ padding: "0.55rem 0.7rem", borderRadius: 8, fontWeight: 600 }}
            >
              {l.label}
            </Link>
          ))}
          {loggedIn && (
            <form action={logout}>
              <button
                type="submit"
                style={{ padding: "0.55rem 0.7rem", fontWeight: 600, color: "#b91c1c" }}
              >
                Log out
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
