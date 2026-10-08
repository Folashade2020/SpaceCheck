import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Phase 0: keep classic dynamic rendering (simpler auth). Enable cacheComponents later. */
  cacheComponents: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
