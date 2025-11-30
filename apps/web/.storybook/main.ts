import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/nextjs-vite';

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url));
// .storybook lives at apps/web/.storybook, so three levels up is repo root
const workspaceRoot = path.resolve(dirname, '..', '..', '..');
const chatbotKitPath = path.resolve(workspaceRoot, 'packages', 'react-chatbot-kit');

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs"
  ],
  "framework": "@storybook/nextjs-vite",
  "staticDirs": [
    "../public"
  ],
  async viteFinal(config) {
    // Alias to use built package with proper path resolution
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@vibe-ltp/react-chatbot-kit/build/main.css': path.resolve(
        chatbotKitPath,
        'build',
        'main.css',
      ),
      '@vibe-ltp/react-chatbot-kit': path.resolve(
        chatbotKitPath,
        'build',
        'index.js',
      ),
    };
    
    // Ensure CommonJS interop
    if (config.optimizeDeps) {
      config.optimizeDeps.include = [
        ...(config.optimizeDeps.include || []),
        '@vibe-ltp/react-chatbot-kit',
      ];
    }
    
    return config;
  },
};
export default config;
