/** One line in the runtime trace overlay. `t` is game seconds. */
export interface DebugEvent {
  /** Monotonic for the page session; the file sink uses it to ship only new lines. */
  seq: number;
  t: number;
  tag: string;
  detail: string;
}

/** Enough to see a burst of hits without growing without bound. */
export const DEBUG_EVENT_CAP = 40;

export function pushDebugEvent(events: DebugEvent[], event: DebugEvent): void {
  events.push(event);
  if (events.length > DEBUG_EVENT_CAP) {
    events.splice(0, events.length - DEBUG_EVENT_CAP);
  }
}
