import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Phase 1 is local-storage only (no backend), so a static export keeps
  // hosting simple and makes offline caching straightforward.
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
