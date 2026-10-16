import { defineConfig } from 'vitest/config';

/**
 * Tests cover the pure rule modules only (enemy tables, pilot maths, upgrade
 * effects). Rendering and the engine loop need a canvas, so they stay out of
 * scope — verified by hand in the browser instead.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
