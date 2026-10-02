import type { LandmarkResult, Vec2 } from '../types.js';

export type ProcessorOptions = {
  confidenceThreshold?: number;
  jumpThresholdMul?: number;
  emaAlpha?: number;
  holdMs?: number;
  lostMs?: number;
};

export class LandmarkProcessor {
  private prev: LandmarkResult | null = null;
  private smoothedNamed: Record<string, Vec2> = {};
  private lastGoodAt = 0;
  private readonly confidenceThreshold: number;
  private readonly jumpThresholdMul: number;
  private readonly emaAlpha: number;
  private readonly holdMs: number;
  private readonly lostMs: number;

  constructor(options: ProcessorOptions = {}) {
    this.confidenceThreshold = options.confidenceThreshold ?? 0.5;
    this.jumpThresholdMul = options.jumpThresholdMul ?? 1.8;
    this.emaAlpha = options.emaAlpha ?? 0.35;
    this.holdMs = options.holdMs ?? 180;
    this.lostMs = options.lostMs ?? 600;
  }

  process(raw: LandmarkResult | null, now = performance.now()): {
    result: LandmarkResult | null;
    ageMs: number;
    lost: boolean;
  } {
    if (!raw || raw.confidence < this.confidenceThreshold) {
      const age = now - this.lastGoodAt;
      if (this.prev && age < this.holdMs) {
        return { result: this.prev, ageMs: age, lost: false };
      }
      return { result: age < this.lostMs ? this.prev : null, ageMs: age, lost: age >= this.lostMs };
    }

    if (this.prev) {
      const jump = Math.hypot(
        (raw.named['NOSE_TIP']?.x ?? raw.named['WRIST']?.x ?? 0) -
          (this.prev.named['NOSE_TIP']?.x ?? this.prev.named['WRIST']?.x ?? 0),
        (raw.named['NOSE_TIP']?.y ?? raw.named['WRIST']?.y ?? 0) -
          (this.prev.named['NOSE_TIP']?.y ?? this.prev.named['WRIST']?.y ?? 0),
      );
      if (jump > raw.scaleRef * this.jumpThresholdMul) {
        const age = now - this.lastGoodAt;
        return { result: this.prev, ageMs: age, lost: false };
      }
    }

    const named: LandmarkResult['named'] = {};
    for (const [key, point] of Object.entries(raw.named)) {
      const prevPt = this.smoothedNamed[key];
      const x = prevPt ? prevPt.x + (point.x - prevPt.x) * this.emaAlpha : point.x;
      const y = prevPt ? prevPt.y + (point.y - prevPt.y) * this.emaAlpha : point.y;
      this.smoothedNamed[key] = { x, y };
      named[key] = { ...point, x, y };
    }

    const result: LandmarkResult = { ...raw, named };
    this.prev = result;
    this.lastGoodAt = now;
    return { result, ageMs: 0, lost: false };
  }

  reset(): void {
    this.prev = null;
    this.smoothedNamed = {};
    this.lastGoodAt = 0;
  }
}
