import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Compiled output in dist/ also contains test files. Run only the sources.
    exclude: ['dist/**', 'node_modules/**'],
  },
});
