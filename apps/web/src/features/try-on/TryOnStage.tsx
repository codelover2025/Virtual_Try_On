'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArEngine } from '@vj/ar-engine';
import { JewelleryKind } from '@vj/shared';

type Hud = {
  status: string;
  fps: number;
  error?: string;
  backend?: string;
};

export function TryOnStage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const threeRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArEngine | null>(null);
  const [hud, setHud] = useState<Hud>({ status: 'IDLE', fps: 0 });
  const [starting, setStarting] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  async function start() {
    if (!videoRef.current || !overlayRef.current || !threeRef.current) return;
    setStarting(true);
    setHud({ status: 'LOADING', fps: 0 });
    try {
      engineRef.current?.stop();
      const engine = new ArEngine();
      engineRef.current = engine;
      engine.on((e) => {
        setHud({ status: e.status, fps: Math.round(e.fps), error: e.error });
      });

      await engine.start(
        {
          video: videoRef.current,
          overlayCanvas: overlayRef.current,
          threeCanvas: threeRef.current,
        },
        {
          jewelleryKind: JewelleryKind.EARRINGS,
          assetUrl: 'procedural://earring',
          assetType: 'MODEL_GLB',
          anchorProfile: {
            primaryAnchor: 'LEFT_EAR_LOBE',
            secondaryAnchor: 'RIGHT_EAR_LOBE',
            scaleRef: 'FACE_WIDTH',
            offset: { x: 0, y: 0.04, z: 0 },
            minScale: 0.4,
            maxScale: 2.2,
          },
          defaultScale: 1,
          defaultRotationZ: 0,
          mirrorForOppositeEar: true,
          mirroredPreview: true,
          targetFps: 28,
        },
      );
      setRunning(true);
      setHud((h) => ({ ...h, status: 'INITIALIZING' }));
    } catch (err) {
      setHud({
        status: 'ERROR',
        fps: 0,
        error: err instanceof Error ? err.message : 'Failed to start try-on',
      });
      setRunning(false);
    } finally {
      setStarting(false);
    }
  }

  async function flip() {
    await engineRef.current?.flipCamera();
  }

  function stop() {
    engineRef.current?.stop();
    engineRef.current = null;
    setRunning(false);
    setHud({ status: 'IDLE', fps: 0 });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          position: 'relative',
          width: 'min(100%, 720px)',
          aspectRatio: '3 / 4',
          background: '#000',
          overflow: 'hidden',
          margin: '0 auto',
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0,
          }}
        />
        <canvas
          ref={overlayRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
        <canvas
          ref={threeRef}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
        <div
          style={{
            position: 'absolute',
            left: 12,
            top: 12,
            background: 'rgba(0,0,0,0.55)',
            padding: '8px 10px',
            fontSize: 12,
            fontFamily: 'ui-monospace, monospace',
            borderRadius: 4,
          }}
        >
          <div>status: {hud.status}</div>
          <div>fps: {hud.fps}</div>
          {hud.error ? <div style={{ color: '#f87171' }}>{hud.error}</div> : null}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {!running ? (
          <button
            type="button"
            onClick={() => void start()}
            disabled={starting}
            style={btnPrimary}
          >
            {starting ? 'Starting…' : 'Start camera try-on'}
          </button>
        ) : (
          <>
            <button type="button" onClick={() => void flip()} style={btnGhost}>
              Flip camera
            </button>
            <button type="button" onClick={stop} style={btnGhost}>
              Stop
            </button>
          </>
        )}
      </div>
      <p style={{ textAlign: 'center', opacity: 0.7, fontSize: 14, maxWidth: 560, margin: '0 auto' }}>
        Allow camera access, center your face, and gold drop earrings track both ears via BlazeFace
        + Three.js.
      </p>
    </div>
  );
}

const btnPrimary: CSSProperties = {
  background: '#d4af37',
  color: '#1a1408',
  border: 'none',
  padding: '12px 18px',
  fontWeight: 700,
  cursor: 'pointer',
};

const btnGhost: CSSProperties = {
  background: 'transparent',
  color: '#d4af37',
  border: '1px solid #d4af37',
  padding: '12px 18px',
  cursor: 'pointer',
};
