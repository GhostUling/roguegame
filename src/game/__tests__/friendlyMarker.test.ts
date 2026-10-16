import { describe, expect, it } from 'vitest';
import {
  FRIENDLY_COLOR,
  FRIENDLY_RING_GAP,
  FRIENDLY_RING_LINE,
  friendlyRingRadius,
} from '../render/friendlyMarker';

describe('friendly marker', () => {
  it('always draws its ring outside the body it marks', () => {
    // The whole point of the marker is that it is visible: a ring inside the
    // silhouette would be hidden by the unit it is supposed to identify.
    for (const body of [4, 9, 12, 14, 16, 30]) {
      expect(friendlyRingRadius(body)).toBeGreaterThan(body);
    }
  });

  it('keeps the ring snug, so a large unit is not swallowed by its own marker', () => {
    for (const body of [4, 14, 30]) {
      expect(friendlyRingRadius(body) - body).toBe(FRIENDLY_RING_GAP);
    }
  });

  it('is one hue and one weight for every friendly unit', () => {
    expect(FRIENDLY_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
    expect(FRIENDLY_RING_LINE).toBeGreaterThan(0);
    expect(FRIENDLY_RING_GAP).toBeGreaterThan(0);
  });
});
