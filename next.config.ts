import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Disable turbopack for build — SWC WASM fallback doesn't support it */
};

export default nextConfig;
