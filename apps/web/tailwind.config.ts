import type { Config } from 'tailwindcss';

import baseConfig from '@vibe-ltp/config/tailwind';

const config: Config = {
  ...baseConfig,
  content: [
    './app/**/*.{ts,tsx,js,jsx,mdx}',
    './src/**/*.{ts,tsx,js,jsx,mdx}',
  ],
};

export default config;
