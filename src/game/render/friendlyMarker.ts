/**
 * One marker for everything on the player's side of the field — deployed
 * turrets, mirror clones, and revived allies. Enemies are dark polygons with
 * neon edges and nothing else on the field wears an emerald ring, so the ring
 * alone answers "whose is this" without reading the silhouette.
 *
 * Callers translate to the unit first; this draws around the origin.
 */

/** The one hue every friendly unit carries. */
export const FRIENDLY_COLOR = '#34d399';

/** How far outside the silhouette the ring sits, in px. */
export const FRIENDLY_RING_GAP = 7;

/** Ring stroke width, in px. */
export const FRIENDLY_RING_LINE = 2;

/** How far above the ring the chevron floats, in px. */
export const FRIENDLY_CHEVRON_LIFT = 15;

/**
 * Radius of the friendly ring around a body of the given size. Kept as a
 * function because "outside the silhouette" is the whole point of the marker —
 * a ring that fell inside the body would be invisible.
 */
export function friendlyRingRadius(bodyRadius: number): number {
  return bodyRadius + FRIENDLY_RING_GAP;
}

export function drawFriendlyMarker(
  ctx: CanvasRenderingContext2D,
  bodyRadius: number,
  time: number
): void {
  const r = friendlyRingRadius(bodyRadius);

  ctx.strokeStyle = FRIENDLY_COLOR;

  // A slow dashed halo: motion is what separates an ally from scenery.
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = FRIENDLY_RING_LINE;
  ctx.setLineDash([6, 7]);
  ctx.lineDashOffset = -time * 22;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineDashOffset = 0;

  // The chevron is the part that survives a busy frame, so it never animates.
  ctx.globalAlpha = 0.95;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-5, -r - 9);
  ctx.lineTo(0, -r - FRIENDLY_CHEVRON_LIFT);
  ctx.lineTo(5, -r - 9);
  ctx.stroke();
}
