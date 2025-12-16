import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@vibe-ltp/shared', '@vibe-ltp/llm-client'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
