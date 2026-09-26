import type { JewelleryKind } from '@vj/shared';
import { CameraEngine } from './camera/camera-engine.js';
import { FaceDetector } from './detectors/face-detector.js';
import { HandDetector } from './detectors/hand-detector.js';
import { AnchorRegistry } from './anchors/anchor-registry.js';
import { LandmarkProcessor } from './landmarks/landmark-processor.js';
import { PoseFitter } from './fitting/pose-fitter.js';
import { TrackingEngine } from './tracking/tracking-engine.js';
import { AdaptiveController } from './performance/adaptive-controller.js';
import { FpsMeter } from './performance/fps-meter.js';
import { Canvas2dRenderer } from './renderers/canvas2d-renderer.js';
import { ThreeRenderer } from './renderers/three-renderer.js';
import { CaptureCompositor } from './capture/capture-compositor.js';
import { initTfBackend } from './models/tf-backend.js';
import type { ModelAdapter } from './models/model-adapter.js';
import type {
  ArEngineConfig,
  ArEngineEvents,
  LandmarkResult,
  PoseFit,
  TrackingStatus,
} from './types.js';

export type ArEngineHost = {
  video: HTMLVideoElement;
  overlayCanvas: HTMLCanvasElement;
  threeCanvas?: HTMLCanvasElement;
};

type Listener = (events: ArEngineEvents) => void;

/**
 * Production AR try-on engine facade.
 * Modular: camera, detectors, landmarks, anchors, fitting, tracking, render, capture.
 */
export class ArEngine {
  private readonly camera = new CameraEngine();
  private readonly processor = new LandmarkProcessor();
  private readonly tracker = new TrackingEngine();
  private readonly fpsMeter = new FpsMeter();
  private adaptive = new AdaptiveController(28);
  private detector: ModelAdapter | null = null;
  private fitter: PoseFitter | null = null;
  private canvasRenderer: Canvas2dRenderer | null = null;
  private threeRenderer: ThreeRenderer | null = null;
  private readonly capture = new CaptureCompositor();
  private host: ArEngineHost | null = null;
  private config: ArEngineConfig | null = null;
  private raf = 0;
  private running = false;
  private frameIndex = 0;
  private lastPose: PoseFit | null = null;
  private lastLandmarks: LandmarkResult | null = null;
  private mirrored = true;
  private listeners = new Set<Listener>();
  private status: TrackingStatus = 'INITIALIZING';
  private recoverAttempts = 0;

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  async start(host: ArEngineHost, config: ArEngineConfig): Promise<void> {
    this.host = host;
    this.config = config;
    this.mirrored = config.mirroredPreview ?? true;
    this.adaptive = new AdaptiveController(config.targetFps ?? 28);

    await initTfBackend();
    await this.camera.init(host.video);

    const registration = AnchorRegistry.get(config.jewelleryKind);
    const profile = AnchorRegistry.mergeProfile(
      config.jewelleryKind,
      config.anchorProfile,
    );
    this.detector = registration.detector === 'hand' ? new HandDetector() : new FaceDetector();
    await this.detector.load();

    this.fitter = new PoseFitter(profile, {
      scale: config.defaultScale ?? 1,
      rotationZ: ((config.defaultRotationZ ?? 0) * Math.PI) / 180,
      fingerIndex: config.fingerIndex,
    });

    const ctx = host.overlayCanvas.getContext('2d');
    if (!ctx) throw new Error('overlay canvas 2d context missing');
    this.canvasRenderer = new Canvas2dRenderer(host.overlayCanvas, ctx);

    const is3d = config.assetType === 'MODEL_GLB' || config.assetType === 'MODEL_GLTF';
    if (is3d) {
      if (!host.threeCanvas) throw new Error('threeCanvas required for 3D assets');
      this.threeRenderer = new ThreeRenderer(host.threeCanvas);
      await this.threeRenderer.loadModel(config.assetUrl, config.mirrorForOppositeEar ?? false);
    } else {
      await this.canvasRenderer.loadOverlay(config.assetUrl, config.mirrorForOppositeEar ?? false);
    }

    this.syncCanvasSizes();
    this.running = true;
    this.loop();
  }

  async flipCamera(): Promise<void> {
    await this.camera.flip();
    this.mirrored = this.camera.getFacing() === 'user';
  }

  async switchDevice(deviceId: string): Promise<void> {
    await this.camera.switchDevice(deviceId);
  }

  static listCameras(): Promise<MediaDeviceInfo[]> {
    return CameraEngine.listDevices();
  }

  async captureBlob(): Promise<Blob> {
    if (!this.host) throw new Error('Engine not started');
    const sources: Array<HTMLCanvasElement | HTMLVideoElement> = [this.host.video, this.host.overlayCanvas];
    if (this.host.threeCanvas) sources.push(this.host.threeCanvas);
    return this.capture.toBlob(sources);
  }

  getStatus(): TrackingStatus {
    return this.status;
  }

  getFps(): number {
    return this.fpsMeter.getFps();
  }

  stop(): void {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.detector?.dispose();
    this.threeRenderer?.dispose();
    this.camera.dispose();
    this.processor.reset();
    this.tracker.reset();
    this.detector = null;
    this.fitter = null;
    this.canvasRenderer = null;
    this.threeRenderer = null;
    this.host = null;
  }

  private syncCanvasSizes(): void {
    if (!this.host) return;
    const video = this.host.video;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    this.host.overlayCanvas.width = w;
    this.host.overlayCanvas.height = h;
    if (this.host.threeCanvas) {
      this.host.threeCanvas.width = w;
      this.host.threeCanvas.height = h;
      this.threeRenderer?.resize(w, h);
    }
  }

  private loop = async (): Promise<void> => {
    if (!this.running || !this.host || !this.detector || !this.fitter || !this.canvasRenderer) return;
    const t0 = performance.now();
    try {
      if (this.host.video.readyState >= 2) {
        if (
          this.host.overlayCanvas.width !== this.host.video.videoWidth &&
          this.host.video.videoWidth > 0
        ) {
          this.syncCanvasSizes();
        }

        this.canvasRenderer.drawVideo(this.host.video, this.mirrored);

        if (this.adaptive.shouldDetect(this.frameIndex)) {
          const raw = await this.detector.estimate(this.host.video);
          const { result, lost } = this.processor.process(raw);
          this.lastLandmarks = result;
          if (lost) this.scheduleRecovery();
        }

        const pose = this.fitter.fit(this.lastLandmarks);
        this.lastPose = pose;
        this.status = this.tracker.update(pose);

        if (this.status !== 'LOST' && pose.visible) {
          if (this.threeRenderer) {
            this.threeRenderer.render(pose);
          } else {
            this.canvasRenderer.drawJewellery(pose, false);
            if (pose.secondaryPosition && this.config?.mirrorForOppositeEar !== false) {
              this.canvasRenderer.drawJewellery(pose, true);
            }
          }
        } else if (this.threeRenderer) {
          this.threeRenderer.render({ ...pose, visible: false });
        }
      }
    } catch (err) {
      this.emit({
        status: this.status,
        fps: this.fpsMeter.getFps(),
        error: err instanceof Error ? err.message : 'AR frame error',
      });
      this.scheduleRecovery();
    }

    const dt = performance.now() - t0;
    this.adaptive.recordFrameMs(dt);
    const fps = this.fpsMeter.tick();
    this.emit({ status: this.status, fps });
    this.frameIndex += 1;
    this.raf = requestAnimationFrame(() => void this.loop());
  };

  private scheduleRecovery(): void {
    if (this.recoverAttempts > 5) return;
    this.recoverAttempts += 1;
    window.setTimeout(() => {
      try {
        this.processor.reset();
        this.tracker.reset();
        this.recoverAttempts = Math.max(0, this.recoverAttempts - 1);
      } catch {
        // ignore
      }
    }, 250);
  }

  private emit(events: ArEngineEvents): void {
    for (const listener of this.listeners) listener(events);
  }
}

export function detectorForKind(kind: JewelleryKind): 'face' | 'hand' {
  return AnchorRegistry.get(kind).detector;
}
