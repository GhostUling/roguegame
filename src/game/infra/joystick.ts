/**
 * Virtual Touch Joystick for touch screens and mobile browsers.
 */
export class VirtualJoystick {
  private container: HTMLElement;
  private knob: HTMLElement;
  private baseRadius: number = 55;
  private activeTouchId: number | null = null;
  private origin: { x: number; y: number } = { x: 0, y: 0 };
  public vector: { x: number; y: number } = { x: 0, y: 0 };
  public isVisible: boolean = false;

  constructor(container: HTMLElement, knob: HTMLElement) {
    this.container = container;
    this.knob = knob;
    this.initEvents();
  }

  private initEvents() {
    window.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    window.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    window.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  public destroy() {
    window.removeEventListener('touchstart', this.handleTouchStart);
    window.removeEventListener('touchmove', this.handleTouchMove);
    window.removeEventListener('touchend', this.handleTouchEnd);
    window.removeEventListener('touchcancel', this.handleTouchEnd);
  }

  private handleTouchStart = (e: TouchEvent) => {
    // Only capture if not interacting with UI buttons
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[data-interactive="true"]')) {
      return;
    }

    if (this.activeTouchId === null && e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];
      this.activeTouchId = touch.identifier;
      this.origin = { x: touch.clientX, y: touch.clientY };

      // Position the container at touch origin
      this.container.style.left = `${this.origin.x}px`;
      this.container.style.top = `${this.origin.y}px`;
      this.container.style.opacity = '1';
      this.knob.style.transform = `translate(0px, 0px)`;
      this.vector = { x: 0, y: 0 };
      this.isVisible = true;
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    if (this.activeTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.activeTouchId) {
        e.preventDefault();
        const dx = touch.clientX - this.origin.x;
        const dy = touch.clientY - this.origin.y;
        const dist = Math.hypot(dx, dy);
        const clampedDist = Math.min(this.baseRadius, dist);
        const angle = Math.atan2(dy, dx);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;

        this.knob.style.transform = `translate(${knobX}px, ${knobY}px)`;

        // Normalized vector (-1 to 1)
        this.vector = {
          x: (knobX / this.baseRadius),
          y: (knobY / this.baseRadius),
        };
        break;
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    if (this.activeTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.activeTouchId) {
        this.activeTouchId = null;
        this.vector = { x: 0, y: 0 };
        this.container.style.opacity = '0';
        this.knob.style.transform = `translate(0px, 0px)`;
        this.isVisible = false;
        break;
      }
    }
  };
}
