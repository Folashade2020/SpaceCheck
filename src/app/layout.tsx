import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { SiteFooter } from "@/components/ui";
import SwRegister from "@/components/SwRegister";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpaceCheck - Check the space before you commit",
  description:
    "Property intelligence for Lagos renters: flooding, electricity, water, road access, network and real resident experiences - matched to what matters to you.",
  manifest: "/manifest.webmanifest",
  themeColor: "#00A86B",
  appleWebApp: { capable: true, title: "SpaceCheck", statusBarStyle: "default" },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

// Auth (cookies) is read in Navbar, so never prerender statically.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col"
        style={{ background: "#F8FAFC", color: "#1E293B" }}
      >
        <Navbar />
        <SwRegister />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
