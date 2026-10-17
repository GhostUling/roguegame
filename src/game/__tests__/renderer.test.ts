import { describe, expect, it } from 'vitest';
import rendererSource from '../render/renderer.ts?raw';

/**
 * The renderer is the one layer nothing else can check: it needs a canvas, so no
 * test can call it, and an exported `render*` nobody calls is not a TypeScript
 * error either. That combination already shipped a build once — the pass that
 * draws the player's own bullets was deleted along with a card, and the game
 * looked fine while drawing no bullets at all.
 *
 * So these assertions work on the source text instead of on a canvas. They are
 * deliberately structural rather than clever: the point is to catch a drawing
 * step that has been unhooked, not to understand what it draws.
 */
const source = rendererSource.replace(/\r\n/g, '\n');

/** The text of renderScene, which is the first function in the file. */
function renderSceneSource(text: string): string {
  const start = text.indexOf('export function renderScene(');
  if (start < 0) throw new Error('renderScene is missing from the renderer');
  const next = text.indexOf('\nexport function ', start + 1);
  return next === -1 ? text.slice(start) : text.slice(start, next);
}

/** Every `export function render*` in the file, in declaration order. */
function exportedRenderHelpers(text: string): string[] {
  return [...text.matchAll(/^export function (render\w+)/gm)].map((m) => m[1]);
}

function countReferences(text: string, name: string): number {
  return (text.match(new RegExp(`\\b${name}\\s*\\(`, 'g')) ?? []).length;
}

describe('renderer wiring', () => {
  it('still looks like the renderer', () => {
    // A guard on the assertions below: they are only meaningful while this file
    // is the scene renderer it is supposed to be.
    expect(source).toContain('export function renderScene(');
    expect(source).toContain('RenderState');
    expect(exportedRenderHelpers(source).length).toBeGreaterThan(15);
  });

  it('drives every drawing step from renderScene', () => {
    // A helper defined but never called draws nothing: the scene silently loses
    // whatever it was responsible for, and nothing else notices.
    for (const name of exportedRenderHelpers(source)) {
      if (name === 'renderScene') continue;
      expect(countReferences(source, name), `${name} is never called`).toBeGreaterThan(1);
    }
  });

  it('lists the passes as one unbroken run of numbers', () => {
    // The pass comments are the running order of the frame. A gap means a step
    // was removed from the middle of it — which is how the lost pass looked.
    const passes = [...renderSceneSource(source).matchAll(/^\s*\/\/ (\d+)\. /gm)].map((m) =>
      Number(m[1])
    );

    expect(passes.length).toBeGreaterThan(15);
    expect(passes).toEqual([...passes].sort((a, b) => a - b));
    passes.forEach((n, i) => expect(n, `pass ${i + 1} of the run`).toBe(i + 1));
  });

  it('draws the player weapon between the enemy shots and the hull', () => {
    // Pinned because this is the exact line that went missing, and its place in
    // the order is what keeps player fire readable under the swarm's fire.
    const scene = renderSceneSource(source);
    const enemyShots = scene.indexOf('renderEnemyProjectiles(');
    const playerShots = scene.indexOf('renderProjectiles(');
    const hull = scene.indexOf('renderPlayer(');

    expect(playerShots).toBeGreaterThan(-1);
    expect(enemyShots).toBeLessThan(playerShots);
    expect(playerShots).toBeLessThan(hull);
  });
});
