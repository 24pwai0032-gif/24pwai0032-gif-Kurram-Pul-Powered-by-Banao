import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the project root. Otherwise a stray lockfile in a parent folder (e.g. on the Desktop)
  // can be picked as the root, which triggers a warning and differs from a fresh clone.
  turbopack: { root: process.cwd() },
};

export default nextConfig;
