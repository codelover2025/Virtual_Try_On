import type { JewelleryKind } from '@vj/shared';

export type Vec2 = { x: number; y: number };
export type Vec3 = { x: number; y: number; z: number };

export type LandmarkPoint = Vec2 & { z?: number; name?: string };

export type LandmarkResult = {
  kind: 'face' | 'hand';
  confidence: number;
  points: LandmarkPoint[];
  named: Record<string, LandmarkPoint>;
  scaleRef: number;
};

export type AnchorProfile = {
  primaryAnchor: string;
  secondaryAnchor?: string;
  scaleRef: string;
  offset?: Partial<Vec3>;
  minScale?: number;
  maxScale?: number;
  occlusion?: { enabled: boolean };
};

export type PoseFit = {
  position: Vec2;
  secondaryPosition?: Vec2;
  scale: number;
  rotationZ: number;
  confidence: number;
  visible: boolean;
};

export type TrackingStatus = 'INITIALIZING' | 'TRACKING' | 'DEGRADED' | 'LOST';

export type CameraFacing = 'user' | 'environment';

export type ArEngineConfig = {
  jewelleryKind: JewelleryKind;
  assetUrl: string;
  assetType: 'IMAGE_OVERLAY' | 'MODEL_GLB' | 'MODEL_GLTF' | 'ALPHA_MASK';
  anchorProfile: AnchorProfile;
  defaultScale?: number;
  defaultRotationZ?: number;
  mirrorForOppositeEar?: boolean;
  fingerIndex?: number | null;
  targetFps?: number;
  mirroredPreview?: boolean;
};

export type ArEngineEvents = {
  status: TrackingStatus;
  fps: number;
  error?: string;
};
