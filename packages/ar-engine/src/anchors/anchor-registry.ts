import { JewelleryKind } from '@vj/shared';
import type { AnchorProfile } from '../types.js';

export type DetectorKind = 'face' | 'hand';

export type AnchorRegistration = {
  detector: DetectorKind;
  defaultProfile: AnchorProfile;
};

const registry = new Map<string, AnchorRegistration>();

function register(kind: string, value: AnchorRegistration) {
  registry.set(kind, value);
}

register(JewelleryKind.EARRINGS, {
  detector: 'face',
  defaultProfile: {
    primaryAnchor: 'LEFT_EAR_LOBE',
    secondaryAnchor: 'RIGHT_EAR_LOBE',
    scaleRef: 'FACE_WIDTH',
    offset: { x: 0, y: 0.02, z: 0 },
    minScale: 0.35,
    maxScale: 2.5,
  },
});

register(JewelleryKind.NECKLACE, {
  detector: 'face',
  defaultProfile: {
    primaryAnchor: 'CHIN',
    scaleRef: 'FACE_WIDTH',
    offset: { x: 0, y: 0.35, z: 0 },
    minScale: 0.5,
    maxScale: 3,
  },
});

register(JewelleryKind.NOSE_RING, {
  detector: 'face',
  defaultProfile: {
    primaryAnchor: 'NOSE_TIP',
    scaleRef: 'FACE_WIDTH',
    offset: { x: 0.02, y: 0.01, z: 0 },
    minScale: 0.2,
    maxScale: 1.5,
  },
});

register(JewelleryKind.SUNGLASSES, {
  detector: 'face',
  defaultProfile: {
    primaryAnchor: 'LEFT_EYE',
    secondaryAnchor: 'RIGHT_EYE',
    scaleRef: 'FACE_WIDTH',
    offset: { x: 0, y: 0, z: 0 },
    minScale: 0.6,
    maxScale: 2.2,
  },
});

register(JewelleryKind.PENDANT, {
  detector: 'face',
  defaultProfile: {
    primaryAnchor: 'CHIN',
    scaleRef: 'FACE_WIDTH',
    offset: { x: 0, y: 0.45, z: 0 },
    minScale: 0.4,
    maxScale: 2.5,
  },
});

register(JewelleryKind.MANGALSUTRA, {
  detector: 'face',
  defaultProfile: {
    primaryAnchor: 'CHIN',
    scaleRef: 'FACE_WIDTH',
    offset: { x: 0, y: 0.4, z: 0 },
    minScale: 0.5,
    maxScale: 3,
  },
});

register(JewelleryKind.RINGS, {
  detector: 'hand',
  defaultProfile: {
    primaryAnchor: 'RING_SLOT_1',
    scaleRef: 'HAND_SCALE',
    offset: { x: 0, y: 0, z: 0 },
    minScale: 0.3,
    maxScale: 2,
  },
});

register(JewelleryKind.BANGLES, {
  detector: 'hand',
  defaultProfile: {
    primaryAnchor: 'WRIST',
    scaleRef: 'HAND_SCALE',
    offset: { x: 0, y: 0, z: 0 },
    minScale: 0.5,
    maxScale: 2.5,
  },
});

register(JewelleryKind.BRACELET, {
  detector: 'hand',
  defaultProfile: {
    primaryAnchor: 'WRIST',
    scaleRef: 'HAND_SCALE',
    offset: { x: 0, y: 0.02, z: 0 },
    minScale: 0.5,
    maxScale: 2.5,
  },
});

register(JewelleryKind.WATCH, {
  detector: 'hand',
  defaultProfile: {
    primaryAnchor: 'WRIST',
    scaleRef: 'HAND_SCALE',
    offset: { x: 0, y: 0, z: 0 },
    minScale: 0.5,
    maxScale: 2.5,
  },
});

export const AnchorRegistry = {
  get(kind: string): AnchorRegistration {
    const found = registry.get(kind);
    if (!found) {
      throw new Error(`No anchor registration for jewellery kind: ${kind}`);
    }
    return found;
  },
  register,
  mergeProfile(kind: string, override?: Partial<AnchorProfile>): AnchorProfile {
    const base = this.get(kind).defaultProfile;
    return {
      ...base,
      ...override,
      offset: { ...base.offset, ...override?.offset },
    };
  },
};
