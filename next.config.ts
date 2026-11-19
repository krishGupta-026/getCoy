import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: `cacheComponents` / `partialPrefetching` (enabled by the generator) are
  // deliberately OFF. The spec requires `export const dynamic = "force-dynamic"`
  // on every route handler, and that segment config is not allowed when Cache
  // Components is enabled.
  //
  // Step 4 adds `rewrites()` here: /feed, /swipe, /matches -> /api/*.
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
