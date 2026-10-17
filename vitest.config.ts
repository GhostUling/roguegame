import { defineConfig } from 'vitest/config';

/**
 * Tests cover the pure rule modules (enemy tables, pilot maths, upgrade effects),
 * one structural check on the renderer source, and a headless run of the real
 * engine loop through stubbed globals. What a frame actually looks like, and
 * whether its numbers feel right, is still verified by hand.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
