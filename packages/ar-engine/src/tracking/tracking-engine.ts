import type { PoseFit, TrackingStatus } from '../types.js';

export class TrackingEngine {
  private status: TrackingStatus = 'INITIALIZING';
  private lastVisibleAt = 0;
  private readonly loseAfterMs: number;
  private readonly degradeAfterMs: number;

  constructor(options?: { loseAfterMs?: number; degradeAfterMs?: number }) {
    this.loseAfterMs = options?.loseAfterMs ?? 700;
    this.degradeAfterMs = options?.degradeAfterMs ?? 220;
  }

  update(pose: PoseFit, now = performance.now()): TrackingStatus {
    if (pose.visible && pose.confidence >= 0.5) {
      this.lastVisibleAt = now;
      this.status = 'TRACKING';
      return this.status;
    }

    const age = now - this.lastVisibleAt;
    if (this.status === 'INITIALIZING') {
      return this.status;
    }
    if (age >= this.loseAfterMs) {
      this.status = 'LOST';
    } else if (age >= this.degradeAfterMs) {
      this.status = 'DEGRADED';
    }
    return this.status;
  }

  getStatus(): TrackingStatus {
    return this.status;
  }

  reset(): void {
    this.status = 'INITIALIZING';
    this.lastVisibleAt = 0;
  }
}
