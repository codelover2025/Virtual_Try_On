import type { PoseFit } from '../types.js';

export class Canvas2dRenderer {
  private image: HTMLImageElement | null = null;
  private mirrorSecondary = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly ctx: CanvasRenderingContext2D,
  ) {}

  async loadOverlay(url: string, mirrorSecondary = false): Promise<void> {
    this.mirrorSecondary = mirrorSecondary;
    this.image = await loadImage(url);
  }

  drawVideo(video: HTMLVideoElement, mirrored: boolean): void {
    const { width, height } = this.canvas;
    this.ctx.save();
    if (mirrored) {
      this.ctx.translate(width, 0);
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(video, 0, 0, width, height);
    this.ctx.restore();
  }

  drawJewellery(pose: PoseFit, secondary = false): void {
    if (!this.image || !pose.visible) return;
    const img = this.image;
    const pos = secondary && pose.secondaryPosition ? pose.secondaryPosition : pose.position;
    const w = img.naturalWidth * pose.scale * 0.15;
    const h = img.naturalHeight * pose.scale * 0.15;
    this.ctx.save();
    this.ctx.translate(pos.x, pos.y);
    this.ctx.rotate(pose.rotationZ + (typeof this === 'object' ? 0 : 0));
    if (secondary && this.mirrorSecondary) {
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(img, -w / 2, -h / 2, w, h);
    this.ctx.restore();
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load overlay: ${url}`));
    img.src = url;
  });
}
