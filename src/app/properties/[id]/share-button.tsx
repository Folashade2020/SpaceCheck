"use client";

import { useState } from "react";

export default function ShareButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user cancelled — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  }

  return (
    <button
      type="button"
      onClick={onShare}
      className="rounded-full border px-3 py-1 text-xs hover:bg-zinc-100"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
