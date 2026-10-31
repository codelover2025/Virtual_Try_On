import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { JewelleryKind } from '@vj/shared';
import { AnchorRegistry } from '../src/anchors/anchor-registry.js';
import { PoseFitter } from '../src/fitting/pose-fitter.js';
import { HandDetector } from '../src/detectors/hand-detector.js';
import { ThreeRenderer } from '../src/renderers/three-renderer.js';
import { Canvas2dRenderer } from '../src/renderers/canvas2d-renderer.js';
import type { LandmarkResult, PoseFit } from '../src/types.js';

vi.mock('three', async (importOriginal) => {
  const actual = await importOriginal<typeof import('three')>();
  class MockWebGLRenderer {
    domElement = {};
    shadowMap = { enabled: false };
    toneMapping = 0;
    toneMappingExposure = 1;
    outputColorSpace = '';
    setSize = vi.fn();
    setPixelRatio = vi.fn();
    setClearColor = vi.fn();
    render = vi.fn();
    clear = vi.fn();
    dispose = vi.fn();
  }
  return {
    ...actual,
    WebGLRenderer: MockWebGLRenderer,
  };
});

function earringLandmarks(overrides: Partial<LandmarkResult['named']> = {}): LandmarkResult {
  return {
    kind: 'face',
    confidence: 0.95,
    points: [],
    named: {
      LEFT_EAR_LOBE: { x: 220, y: 180, name: 'LEFT_EAR_LOBE' },
      RIGHT_EAR_LOBE: { x: 420, y: 210, name: 'RIGHT_EAR_LOBE' },
      HEAD_ROLL: { x: 0.35, y: 0.1, name: 'HEAD_ROLL' },
      HEAD_YAW: { x: 0.2, y: 0.1, name: 'HEAD_YAW' },
      ...overrides,
    },
    scaleRef: 140,
  };
}

describe('Phase 3: realistic jewellery tracking', () => {
  describe('PoseFitter lock-to-body vs spring float', () => {
    it('keeps drop earrings hanging near world-up instead of spinning with the ear line', () => {
      const profile = AnchorRegistry.get(JewelleryKind.EARRINGS).defaultProfile;
      const fitter = new PoseFitter(profile, {
        scale: 1,
        rotationZ: 0,
        jewelleryKind: JewelleryKind.EARRINGS,
      });

      const fit = fitter.fit(earringLandmarks());
      // Ear line atan2 would be ~0.15 rad; gravity hang keeps only ~18% of head roll.
      expect(Math.abs(fit.rotationZ)).toBeLessThan(0.12);
      expect(fit.rotationZ).toBeCloseTo(0.35 * 0.18, 2);
      expect(fit.visible).toBe(true);
    });

    it('does not rotate a nose ring by the nostril-to-tip vector', () => {
      const profile = AnchorRegistry.get(JewelleryKind.NOSE_RING).defaultProfile;
      const fitter = new PoseFitter(profile, {
        scale: 0.7,
        rotationZ: 0,
        jewelleryKind: JewelleryKind.NOSE_RING,
      });

      const fit = fitter.fit({
        kind: 'face',
        confidence: 0.92,
        points: [],
        named: {
          LEFT_NOSE_WING: { x: 550, y: 380, name: 'LEFT_NOSE_WING' },
          NOSE_TIP: { x: 500, y: 375, name: 'NOSE_TIP' },
          HEAD_ROLL: { x: -0.05, y: 0.02, name: 'HEAD_ROLL' },
          HEAD_YAW: { x: 0.08, y: 0.02, name: 'HEAD_YAW' },
        },
        scaleRef: 120,
      });

      expect(fit.visible).toBe(true);
      expect(Math.abs(fit.rotationZ)).toBeLessThan(0.2);
      expect(fit.rotationZ).toBeCloseTo(-0.05, 2);
    });

    it('locks necklace position to the collarbone without laggy overshoot', () => {
      const profile = AnchorRegistry.get(JewelleryKind.NECKLACE).defaultProfile;
      const fitter = new PoseFitter(profile, {
        scale: 1,
        rotationZ: 0,
        jewelleryKind: JewelleryKind.NECKLACE,
      });

      const a: LandmarkResult = {
        kind: 'pose',
        confidence: 0.95,
        points: [],
        named: {
          NECK_BASE: { x: 400, y: 300, name: 'NECK_BASE' },
          SHOULDER_ROT: { x: 0, y: 0, name: 'SHOULDER_ROT' },
        },
        scaleRef: 250,
        shouldersVisible: true,
      };
      fitter.fit(a);

      const b: LandmarkResult = {
        ...a,
        named: {
          NECK_BASE: { x: 430, y: 310, name: 'NECK_BASE' },
          SHOULDER_ROT: { x: 0.04, y: 0, name: 'SHOULDER_ROT' },
        },
      };
      const fit = fitter.fit(b);
      const expectedY = 310 + 0.04 * 250;
      expect(Math.abs(fit.position.x - 430)).toBeLessThan(12);
      expect(Math.abs(fit.position.y - expectedY)).toBeLessThan(12);
    });

    it('builds ring and bangle anchors from MediaPipe 21 hand points', () => {
      const detector = new HandDetector();
      const mesh = Array.from({ length: 21 }, (_, i) => ({
        x: 0.4 + (i % 5) * 0.03,
        y: 0.3 + Math.floor(i / 5) * 0.05,
        z: 0,
      }));
      mesh[0] = { x: 0.42, y: 0.62, z: 0 }; // wrist
      mesh[5] = { x: 0.48, y: 0.40, z: 0 }; // index mcp
      mesh[9] = { x: 0.44, y: 0.38, z: 0 }; // middle mcp
      mesh[13] = { x: 0.40, y: 0.40, z: 0 }; // ring mcp
      mesh[14] = { x: 0.39, y: 0.32, z: 0 }; // ring pip
      mesh[17] = { x: 0.36, y: 0.42, z: 0 }; // pinky mcp

      const res = (detector as unknown as {
        _processMediaPipe21: (m: typeof mesh, w: number, h: number) => LandmarkResult;
      })._processMediaPipe21(mesh, 1000, 800);

      expect(res.kind).toBe('hand');
      expect(res.named['WRIST']).toBeDefined();
      expect(res.named['BANGLE_ANCHOR']).toBeDefined();
      expect(res.named['RING_SLOT_3']).toBeDefined();
      expect(res.named['HAND_SCALE']?.x).toBeGreaterThan(10);
      detector.dispose();
    });

    it('orients a ring using the finger rotation slot', () => {
      const profile = AnchorRegistry.get(JewelleryKind.RINGS).defaultProfile;
      const fitter = new PoseFitter(profile, {
        scale: 1,
        rotationZ: 0,
        fingerIndex: 3,
        jewelleryKind: JewelleryKind.RINGS,
      });

      const fit = fitter.fit({
        kind: 'hand',
        confidence: 0.9,
        points: [],
        named: {
          RING_SLOT_3: { x: 300, y: 240, name: 'RING_SLOT_3' },
          RING_ROT_3: { x: 1.1, y: 0, name: 'RING_ROT_3' },
        },
        scaleRef: 90,
      });

      expect(fit.visible).toBe(true);
      expect(fit.position.x).toBeCloseTo(300, 0);
      expect(fit.rotationZ).toBeCloseTo(1.1, 1);
    });

    it('keeps nose-ring scale face-sized instead of shrinking to raw wing pixels', () => {
      const profile = AnchorRegistry.get(JewelleryKind.NOSE_RING).defaultProfile;
      const fitter = new PoseFitter(profile, {
        scale: 1,
        rotationZ: 0,
        jewelleryKind: JewelleryKind.NOSE_RING,
      });
      const fit = fitter.fit({
        kind: 'face',
        confidence: 0.95,
        points: [],
        named: {
          LEFT_NOSE_WING: { x: 520, y: 300, name: 'LEFT_NOSE_WING' },
          NOSE_TIP: { x: 500, y: 298, name: 'NOSE_TIP' },
          NOSE_WING_WIDTH: { x: 28, y: 0, name: 'NOSE_WING_WIDTH' },
          HEAD_ROLL: { x: 0, y: 0, name: 'HEAD_ROLL' },
        },
        scaleRef: 160,
      });
      expect(fit.scale).toBeGreaterThan(0.8);
      expect(fit.scale).toBeLessThan(2.2);
    });

    it('maps catalogue anchorType records onto real anatomical anchors', () => {
      const bangle = AnchorRegistry.mergeProfile(JewelleryKind.BANGLES, {
        anchorType: 'WRIST',
      } as never);
      expect(bangle.primaryAnchor).toBe('BANGLE_ANCHOR');

      const ring = AnchorRegistry.mergeProfile(JewelleryKind.RINGS, {
        anchorType: 'FINGER_BASE',
        fingerIndex: 3,
      } as never);
      expect(ring.primaryAnchor).toBe('RING_SLOT_3');
    });

    it('hides a ring when the finger is tightly curled', () => {
      const profile = AnchorRegistry.get(JewelleryKind.RINGS).defaultProfile;
      const fitter = new PoseFitter(profile, {
        scale: 1,
        rotationZ: 0,
        fingerIndex: 3,
        jewelleryKind: JewelleryKind.RINGS,
      });
      const landmarks: LandmarkResult = {
        kind: 'hand',
        confidence: 0.95,
        points: [],
        named: {
          RING_SLOT_3: { x: 300, y: 240, name: 'RING_SLOT_3' },
          RING_ROT_3: { x: 0.4, y: 0, name: 'RING_ROT_3' },
          FINGER_CURL_3: { x: 0.92, y: 0, name: 'FINGER_CURL_3' },
        },
        scaleRef: 90,
      };
      let fit = fitter.fit(landmarks);
      for (let i = 0; i < 6; i++) fit = fitter.fit(landmarks);
      expect(fit.visible).toBe(false);
    });

    it('orients a bangle from the wrist direction', () => {
      const profile = AnchorRegistry.get(JewelleryKind.BANGLES).defaultProfile;
      const fitter = new PoseFitter(profile, {
        scale: 1,
        rotationZ: 0,
        jewelleryKind: JewelleryKind.BANGLES,
      });

      const fit = fitter.fit({
        kind: 'hand',
        confidence: 0.9,
        points: [],
        named: {
          BANGLE_ANCHOR: { x: 280, y: 360, name: 'BANGLE_ANCHOR' },
          BANGLE_ROT: { x: Math.PI / 2, y: 0, name: 'BANGLE_ROT' },
        },
        scaleRef: 100,
      });

      expect(fit.visible).toBe(true);
      expect(fit.rotationZ).toBeCloseTo(0, 1);
    });
  });

  describe('ThreeRenderer static jewellery (no baked clips)', () => {
    let renderer: ThreeRenderer;

    beforeEach(() => {
      if (typeof window === 'undefined') {
        (global as { window?: { devicePixelRatio: number } }).window = { devicePixelRatio: 1 };
      }
      renderer = new ThreeRenderer({
        width: 640,
        height: 480,
        getContext: vi.fn(),
      } as unknown as HTMLCanvasElement);
    });

    it('warmCache does not replace the currently worn procedural mesh', async () => {
      renderer.loadProceduralEarring(true);
      expect(renderer.getActiveUrl()).toBe('procedural://earring');
      await renderer.warmCache('procedural://necklace');
      expect(renderer.getActiveUrl()).toBe('procedural://earring');
      expect(renderer.hasActiveMesh()).toBe(true);
    });

    it('does not start a mixer for procedural earrings', () => {
      renderer.loadProceduralEarring(true);
      expect(renderer.hasActiveAnimation()).toBe(false);
      expect(renderer.hasActiveMesh()).toBe(true);
    });

    it('applies head yaw/pitch to the mesh instead of only Z roll', () => {
      renderer.loadProceduralEarring(true);
      const pose: PoseFit = {
        position: { x: 200, y: 160 },
        secondaryPosition: { x: 320, y: 160 },
        scale: 1,
        rotationZ: 0.05,
        rotationX: 0.12,
        rotationY: 0.2,
        confidence: 0.95,
        visible: true,
        yaw: 0.2,
        pitch: 0.12,
      };
      renderer.render(pose, JewelleryKind.EARRINGS);
      const root = (renderer as unknown as { root: THREE.Group }).root;
      expect(root.rotation.x).toBeCloseTo(0.12, 2);
      expect(root.rotation.y).toBeCloseTo(0.2, 2);
      expect(root.visible).toBe(true);
    });

    it('keeps jewellery z in a thin overlay slab rather than raw landmark depth', () => {
      renderer.loadProceduralNecklace();
      const pose: PoseFit = {
        position: { x: 320, y: 240 },
        scale: 1.2,
        rotationZ: 0,
        confidence: 0.9,
        visible: true,
        depthHint: 180,
      };
      renderer.render(pose, JewelleryKind.NECKLACE);
      const root = (renderer as unknown as { root: THREE.Group }).root;
      expect(Math.abs(root.position.z)).toBeLessThan(20);
    });
  });

  describe('Canvas2d kind scale', () => {
    it('draws rings much smaller than a generic full-image overlay', () => {
      const ctx = {
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        drawImage: vi.fn(),
        clearRect: vi.fn(),
        globalAlpha: 1,
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
      } as unknown as CanvasRenderingContext2D;
      const renderer = new Canvas2dRenderer({ width: 640, height: 480 } as HTMLCanvasElement, ctx);
      (renderer as unknown as { image: { naturalWidth: number; naturalHeight: number } }).image = {
        naturalWidth: 512,
        naturalHeight: 512,
      };
      (renderer as unknown as { currentUrl: string }).currentUrl = 'ring.png';

      renderer.drawJewellery(
        {
          position: { x: 300, y: 240 },
          scale: 1.2,
          rotationZ: 0,
          confidence: 0.95,
          visible: true,
        },
        false,
        JewelleryKind.RINGS,
      );

      const call = (ctx.drawImage as unknown as { mock: { calls: unknown[][] } }).mock.calls[0];
      const w = call[3] as number;
      expect(w).toBeLessThan(60);
      expect(w).toBeGreaterThan(14);
    });
  });
});
