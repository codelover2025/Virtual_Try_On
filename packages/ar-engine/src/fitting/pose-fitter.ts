import type { AnchorProfile, LandmarkResult, PoseFit } from '../types.js';

export class PoseFitter {
  constructor(
    private readonly profile: AnchorProfile,
    private readonly defaults: { scale: number; rotationZ: number; fingerIndex?: number | null },
  ) {}

  fit(landmarks: LandmarkResult | null): PoseFit {
    if (!landmarks) {
      return {
        position: { x: 0, y: 0 },
        scale: this.defaults.scale,
        rotationZ: this.defaults.rotationZ,
        confidence: 0,
        visible: false,
      };
    }

    let primaryKey = this.profile.primaryAnchor;
    if (this.defaults.fingerIndex != null && this.defaults.fingerIndex >= 0) {
      primaryKey = `RING_SLOT_${this.defaults.fingerIndex}`;
    }

    const primary = landmarks.named[primaryKey];
    if (!primary) {
      return {
        position: { x: 0, y: 0 },
        scale: this.defaults.scale,
        rotationZ: this.defaults.rotationZ,
        confidence: 0,
        visible: false,
      };
    }

    const secondary = this.profile.secondaryAnchor
      ? landmarks.named[this.profile.secondaryAnchor]
      : undefined;

    const liveScale = landmarks.scaleRef || 100;
    const assetRef = 100;
    let scale = this.defaults.scale * (liveScale / assetRef);
    const minS = this.profile.minScale ?? 0.2;
    const maxS = this.profile.maxScale ?? 3;
    scale = Math.min(maxS, Math.max(minS, scale));

    const ox = (this.profile.offset?.x ?? 0) * liveScale;
    const oy = (this.profile.offset?.y ?? 0) * liveScale;

    let rotationZ = this.defaults.rotationZ;
    if (secondary) {
      rotationZ = Math.atan2(secondary.y - primary.y, secondary.x - primary.x);
    } else if (this.defaults.fingerIndex != null) {
      const dir = landmarks.named[`FINGER_DIR_${this.defaults.fingerIndex}`];
      if (dir) rotationZ = Math.atan2(dir.y, dir.x);
    }

    return {
      position: { x: primary.x + ox, y: primary.y + oy },
      secondaryPosition: secondary
        ? { x: secondary.x - ox, y: secondary.y + oy }
        : undefined,
      scale,
      rotationZ,
      confidence: landmarks.confidence,
      visible: true,
    };
  }
}
