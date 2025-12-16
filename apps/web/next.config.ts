import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@vibe-ltp/shared'],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
