import { DebugEvent } from '../engine/debugTrace';

let lastSeq = 0;

/**
 * Dev-only: ship new trace events to `debug-trace.log` through the Vite
 * middleware. A dropped batch must never disturb the run, so failures are
 * swallowed; the file is the only thing this touches.
 */
export function flushTrace(events: DebugEvent[]): void {
  if (!import.meta.env.DEV) return;

  const fresh = events.filter((event) => event.seq > lastSeq);
  if (fresh.length === 0) return;
  lastSeq = fresh[fresh.length - 1].seq;

  fetch('/__trace', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ at: new Date().toISOString(), events: fresh }),
    keepalive: true,
  }).catch(() => {
    // The dev sink is optional.
  });
}
