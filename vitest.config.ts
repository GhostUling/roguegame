import { defineConfig } from 'vitest/config';

/**
 * Tests cover the pure rule modules (enemy tables, pilot maths, upgrade effects)
 * plus one structural check on the renderer: it reads that file as text and never
 * draws. Anything that needs a canvas stays out of scope — the engine loop, and
 * whether a frame actually looks right, are both verified by hand.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
