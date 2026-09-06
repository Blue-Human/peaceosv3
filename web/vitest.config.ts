import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Same Vite-resolution workaround as core/vitest.config.ts.
    alias: {
      opentimestamps: 'opentimestamps/index.js',
    },
  },
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 10_000,
  },
});
