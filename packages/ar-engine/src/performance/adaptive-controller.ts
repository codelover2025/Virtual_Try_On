export class AdaptiveController {
  private samples: number[] = [];
  private detectEveryN = 1;
  private detectScale = 1;

  constructor(private readonly targetFps = 28) {}

  recordFrameMs(ms: number): void {
    this.samples.push(ms);
    if (this.samples.length > 30) this.samples.shift();
    if (this.samples.length < 15) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
    const fps = 1000 / avg;
    if (fps < this.targetFps - 4) {
      this.detectEveryN = Math.min(3, this.detectEveryN + 1);
      this.detectScale = Math.max(0.5, this.detectScale - 0.1);
    } else if (fps > this.targetFps + 4) {
      this.detectEveryN = Math.max(1, this.detectEveryN - 1);
      this.detectScale = Math.min(1, this.detectScale + 0.05);
    }
  }

  shouldDetect(frameIndex: number): boolean {
    return frameIndex % this.detectEveryN === 0;
  }

  getDetectScale(): number {
    return this.detectScale;
  }

  getDetectEveryN(): number {
    return this.detectEveryN;
  }
}
