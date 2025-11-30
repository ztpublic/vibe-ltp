import type { StorybookConfig } from '@storybook/nextjs-vite';

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
      '@vibe-ltp/react-chatbot-kit/build/main.css': '/Users/zt/projects/vibe-ltp/packages/react-chatbot-kit/build/main.css',
      '@vibe-ltp/react-chatbot-kit': '/Users/zt/projects/vibe-ltp/packages/react-chatbot-kit/build/index.js',
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