import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `cacheComponents` / `partialPrefetching` (enabled by the generator) are
  // deliberately OFF. The spec requires `export const dynamic = "force-dynamic"`
  // on every route handler, and that segment config is not allowed when Cache
  // Components is enabled.
  //
  // The spec routes live under /api/*; these aliases make the literal paths
  // /feed, /swipe and /matches work too.
  async rewrites() {
    return [
      { source: "/feed", destination: "/api/feed" },
      { source: "/swipe", destination: "/api/swipe" },
      { source: "/matches", destination: "/api/matches" },
    ];
  },
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
