import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.WALL_E2E === "1" ? ".next-e2e" : ".next",
  devIndicators: false,
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
