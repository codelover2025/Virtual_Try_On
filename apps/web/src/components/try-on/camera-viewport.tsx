'use client';

import type { RefObject } from 'react';
import { cn } from '@vj/ui';

export function CameraViewport({
  videoRef,
  overlayRef,
  threeRef,
  className,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
  overlayRef: RefObject<HTMLCanvasElement | null>;
  threeRef: RefObject<HTMLCanvasElement | null>;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden rounded-2xl bg-black', className)}>
      <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover opacity-0" />
      <canvas ref={overlayRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={threeRef} className="pointer-events-none absolute inset-0 h-full w-full" />
    </div>
  );
}
