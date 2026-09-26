export class FpsMeter {
  private frames = 0;
  private lastTs = performance.now();
  private fps = 0;

  tick(now = performance.now()): number {
    this.frames += 1;
    const elapsed = now - this.lastTs;
    if (elapsed >= 1000) {
      this.fps = (this.frames * 1000) / elapsed;
      this.frames = 0;
      this.lastTs = now;
    }
    return this.fps;
  }

  getFps(): number {
    return this.fps;
  }
}
