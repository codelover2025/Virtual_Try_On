import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import type { ModelAdapter, PixelInput } from '../models/model-adapter.js';
import type { LandmarkResult } from '../types.js';

const FINGER_JOINTS: Record<number, [string, string]> = {
  0: ['thumb_mcp', 'thumb_tip'],
  1: ['index_finger_mcp', 'index_finger_pip'],
  2: ['middle_finger_mcp', 'middle_finger_pip'],
  3: ['ring_finger_mcp', 'ring_finger_pip'],
  4: ['pinky_finger_mcp', 'pinky_finger_pip'],
};

export class HandDetector implements ModelAdapter {
  readonly name = 'hand';
  private detector: handPoseDetection.HandDetector | null = null;

  async load(): Promise<void> {
    this.detector = await handPoseDetection.createDetector(
      handPoseDetection.SupportedModels.MediaPipeHands,
      {
        runtime: 'tfjs',
        modelType: 'lite',
        maxHands: 1,
      },
    );
  }

  async estimate(input: PixelInput): Promise<LandmarkResult | null> {
    if (!this.detector) return null;
    const hands = await this.detector.estimateHands(input, { flipHorizontal: false });
    const hand = hands[0];
    if (!hand || !hand.keypoints?.length) return null;

    const named: LandmarkResult['named'] = {};
    const points = hand.keypoints.map((kp) => {
      const point = { x: kp.x, y: kp.y, name: kp.name };
      if (kp.name) named[kp.name] = point;
      return point;
    });

    const wrist = named['wrist'] ?? points[0];
    if (wrist) named['WRIST'] = wrist;

    // Expose ring anchors
    for (const [idx, [a, b]] of Object.entries(FINGER_JOINTS)) {
      const p1 = named[a];
      const p2 = named[b];
      if (p1 && p2) {
        named[`RING_SLOT_${idx}`] = {
          x: (p1.x + p2.x) / 2,
          y: (p1.y + p2.y) / 2,
          name: `RING_SLOT_${idx}`,
        };
        named[`FINGER_DIR_${idx}`] = { x: p2.x - p1.x, y: p2.y - p1.y };
      }
    }

    const middle = named['middle_finger_mcp'];
    let scaleRef = 80;
    if (wrist && middle) {
      scaleRef = Math.hypot(middle.x - wrist.x, middle.y - wrist.y) || 80;
    }

    return {
      kind: 'hand',
      confidence: hand.score ?? 0.8,
      points,
      named,
      scaleRef,
    };
  }

  dispose(): void {
    this.detector = null;
  }
}

export { FINGER_JOINTS };
