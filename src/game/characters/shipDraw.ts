/**
 * A vessel's silhouette, drawn centred on the current transform origin.
 * `angle` orients the nose, `time` drives the idle spin animation.
 */
export type ShipDrawer = (
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number,
  time: number
) => void;

/** Stroke width unit: 1 at the reference hull radius of 18px. */
export function strokeUnit(radius: number): number {
  return radius / 18;
}

/**
 * White nose cone pointing along +x. Callers that also spin their hull in `time`
 * call this afterwards so the nose follows the aim angle, not the idle spin.
 */
export function drawNoseCone(
  ctx: CanvasRenderingContext2D,
  radius: number,
  angle: number
): void {
  const lw = strokeUnit(radius);
  ctx.save();
  ctx.rotate(angle);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(radius * 1.45, 0);
  ctx.lineTo(radius * 0.7, -4 * lw);
  ctx.lineTo(radius * 0.7, 4 * lw);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
