import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    // Default to node. Component tests that need a DOM opt in per-file with a
    // `// @vitest-environment jsdom` docblock (vitest 4 removed environmentMatchGlobs).
    environment: 'node',
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: { reporter: ['text', 'html'] },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // `server-only` throws when resolved outside an RSC bundle. Under Node/vitest
      // there is no `react-server` condition, so it resolves to the throwing entry.
      // Map it to the package's own no-op so server-only modules are unit-testable.
      'server-only': path.resolve(__dirname, 'node_modules/server-only/empty.js'),
    },
  },
});
