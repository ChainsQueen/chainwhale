import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    name: 'integration',
    environment: 'node',
    setupFiles: ['./tests/integration-setup.ts'],
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules', '.next', 'tests/unit', 'tests/e2e'],
    globals: true,
    testTimeout: 30000, // API tests may take longer
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});