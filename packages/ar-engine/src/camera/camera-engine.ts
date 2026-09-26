import type { CameraFacing } from '../types.js';

export type CameraEngineOptions = {
  facing?: CameraFacing;
  width?: number;
  height?: number;
  frameRate?: number;
};

export class CameraEngine {
  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private facing: CameraFacing = 'user';

  async init(video: HTMLVideoElement, options: CameraEngineOptions = {}): Promise<HTMLVideoElement> {
    this.video = video;
    this.facing = options.facing ?? 'user';
    await this.start(options);
    return video;
  }

  async start(options: CameraEngineOptions = {}): Promise<void> {
    this.stopTracks();
    const facing = options.facing ?? this.facing;
    this.facing = facing;
    const constraints: MediaStreamConstraints = {
      audio: false,
      video: {
        facingMode: facing,
        width: { ideal: options.width ?? 1280 },
        height: { ideal: options.height ?? 720 },
        frameRate: { ideal: options.frameRate ?? 30 },
      },
    };
    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: facing,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });
    }
    if (!this.video) throw new Error('Camera video element missing');
    this.video.srcObject = this.stream;
    this.video.playsInline = true;
    this.video.muted = true;
    await this.video.play();
  }

  async flip(): Promise<void> {
    const next: CameraFacing = this.facing === 'user' ? 'environment' : 'user';
    await this.start({ facing: next });
  }

  async switchDevice(deviceId: string): Promise<void> {
    this.stopTracks();
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { deviceId: { exact: deviceId } },
    });
    if (!this.video) throw new Error('Camera video element missing');
    this.video.srcObject = this.stream;
    await this.video.play();
  }

  static async listDevices(): Promise<MediaDeviceInfo[]> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === 'videoinput');
  }

  getVideo(): HTMLVideoElement {
    if (!this.video) throw new Error('Camera not initialized');
    return this.video;
  }

  getFacing(): CameraFacing {
    return this.facing;
  }

  dispose(): void {
    this.stopTracks();
    if (this.video) {
      this.video.srcObject = null;
    }
    this.video = null;
  }

  private stopTracks(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }
}
