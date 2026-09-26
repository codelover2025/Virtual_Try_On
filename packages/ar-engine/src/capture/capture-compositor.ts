export class CaptureCompositor {
  async toBlob(
    sources: Array<HTMLCanvasElement | HTMLVideoElement>,
    mimeType = 'image/jpeg',
    quality = 0.92,
  ): Promise<Blob> {
    const base = sources[0];
    if (!base) throw new Error('No capture source');
    const width = 'videoWidth' in base ? base.videoWidth : base.width;
    const height = 'videoHeight' in base ? base.videoHeight : base.height;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D context unavailable');
    for (const src of sources) {
      ctx.drawImage(src as CanvasImageSource, 0, 0, width, height);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), mimeType, quality),
    );
    if (!blob) throw new Error('Capture failed');
    return blob;
  }
}
