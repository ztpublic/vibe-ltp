import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@vibe-ltp/shared", "@vibe-ltp/llm-client"],
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // TODO: Fix React 19 type compatibility issues and re-enable
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
