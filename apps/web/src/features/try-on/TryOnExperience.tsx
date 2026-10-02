'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArEngine } from '@vj/ar-engine';
import { ApiError, queryKeys } from '@vj/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  Button,
  Badge,
  toast,
  formatPrice,
  PageLoader,
  CameraComponent,
  JewellerySelector,
  CaptureModal,
  type CameraHud,
  type JewellerySelectorItem,
} from '@vj/ui';
import type { ProductDetailDto, ProductListItemDto } from '@vj/types';
import { api } from '@/lib/api';
import { useTryOnStore } from '@/stores/try-on-store';

export interface TryOnExperienceProps {
  product: ProductDetailDto;
  alternativeProducts?: ProductListItemDto[];
}

export function TryOnExperience({ product: initialProduct, alternativeProducts }: TryOnExperienceProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [currentProduct, setCurrentProduct] = useState<ProductDetailDto>(initialProduct);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const threeRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ArEngine | null>(null);

  const [hud, setHud] = useState<CameraHud>({ status: 'IDLE', fps: 0 });
  const [starting, setStarting] = useState(false);
  const [running, setRunning] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentCaptureBlob, setCurrentCaptureBlob] = useState<Blob | null>(null);
  const [cinemaMode, setCinemaMode] = useState(false);
  const [isSavedInSession, setIsSavedInSession] = useState(false);

  const {
    sessionId,
    setSessionId,
    setTracking,
    setLastCaptureId,
    mirrorOn,
    setMirrorOn,
  } = useTryOnStore();

  // If initialProduct changes externally (e.g. navigation)
  useEffect(() => {
    setCurrentProduct(initialProduct);
  }, [initialProduct]);

  // Load alternative products for in-studio switcher if not provided
  const catalogQuery = useQuery({
    queryKey: queryKeys.products.list({ pageSize: 16 }),
    queryFn: () => api.catalog.listProducts({ pageSize: 16 }),
    enabled: !alternativeProducts || alternativeProducts.length === 0,
  });

  const selectorItems: JewellerySelectorItem[] = (
    alternativeProducts && alternativeProducts.length > 0
      ? alternativeProducts
      : catalogQuery.data?.items ?? [currentProduct]
  ).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    jewelleryKind: p.jewelleryKind,
    priceCents: p.priceCents,
    currency: p.currency,
    primaryImage: p.primaryImage,
  }));

  // Start AR session with API
  const sessionQuery = useQuery({
    queryKey: ['try-on', 'bootstrap', currentProduct.id],
    queryFn: () =>
      api.tryOn.startSession({
        productId: currentProduct.id,
        clientInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'browser',
          deviceClass: typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches ? 'mobile' : 'desktop',
        },
      }),
  });

  useEffect(() => {
    if (sessionQuery.data?.sessionId) setSessionId(sessionQuery.data.sessionId);
  }, [sessionQuery.data?.sessionId, setSessionId]);

  useEffect(() => {
    return () => {
      engineRef.current?.stop();
      engineRef.current = null;
    };
  }, []);

  const asset = sessionQuery.data?.asset ?? currentProduct.tryOnAsset;

  // Start Camera & AR tracking
  async function startCamera() {
    if (!videoRef.current || !overlayRef.current || !threeRef.current) return;
    setStarting(true);
    try {
      engineRef.current?.stop();
      const engine = new ArEngine();
      engineRef.current = engine;
      engine.on((e) => {
        setHud({ status: e.status, fps: Math.round(e.fps), error: e.error });
        setTracking(e.status === 'TRACKING' || e.status === 'RUNNING');
      });

      await engine.start(
        {
          video: videoRef.current,
          overlayCanvas: overlayRef.current,
          threeCanvas: threeRef.current,
        },
        {
          jewelleryKind: currentProduct.jewelleryKind,
          assetUrl: asset?.url || 'procedural://earring',
          assetType: asset?.assetType ?? 'PROCEDURAL',
          anchorProfile: (asset?.anchorProfile ?? {}) as Parameters<ArEngine['start']>[1]['anchorProfile'],
          defaultScale: asset?.defaultScale ?? 1.0,
          defaultRotationZ: asset?.defaultRotationZ ?? 0,
          mirrorForOppositeEar: asset?.mirrorForOppositeEar ?? true,
          mirroredPreview: mirrorOn,
          targetFps: 30,
        },
      );
      setRunning(true);
      toast.success('Studio camera connected');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not access camera');
      setRunning(false);
    } finally {
      setStarting(false);
    }
  }

  function stopCamera() {
    engineRef.current?.stop();
    engineRef.current = null;
    setRunning(false);
    setTracking(false);
    setHud({ status: 'IDLE', fps: 0 });
  }

  async function flipCamera() {
    try {
      await engineRef.current?.flipCamera();
      toast.info('Camera switched');
    } catch {
      toast.error('Unable to flip camera on this device');
    }
  }

  function toggleMirror() {
    const next = !mirrorOn;
    setMirrorOn(next);
  }

  // Handle switching jewellery piece in-studio
  async function handleSelectPiece(item: JewellerySelectorItem) {
    if (item.id === currentProduct.id) return;
    try {
      toast.info(`Fitting ${item.name}…`);
      const detail = await api.catalog.getProduct(item.id);
      setCurrentProduct(detail);

      // Update URL silently without full navigation
      startTransition(() => {
        router.replace(`/try-on/${detail.id}`);
      });

      // If camera is running, re-configure the AR engine with new asset
      if (engineRef.current && running) {
        const newAsset = detail.tryOnAsset;
        await engineRef.current.setJewellery({
          jewelleryKind: detail.jewelleryKind,
          assetUrl: newAsset?.url || 'procedural://earring',
          assetType: newAsset?.assetType ?? 'PROCEDURAL',
          anchorProfile: (newAsset?.anchorProfile ?? {}) as Parameters<ArEngine['setJewellery']>[0]['anchorProfile'],
          defaultScale: newAsset?.defaultScale ?? 1.0,
          defaultRotationZ: newAsset?.defaultRotationZ ?? 0,
          mirrorForOppositeEar: newAsset?.mirrorForOppositeEar ?? true,
        });
        toast.success(`Now wearing ${detail.name}`);
      }
    } catch (err) {
      toast.error('Could not switch jewellery item');
    }
  }

  // Snapshot capture handler
  const handleCapture = async () => {
    if (!engineRef.current || !overlayRef.current) {
      toast.error('Camera not ready for capture');
      return;
    }
    try {
      const blob = await engineRef.current.captureBlob();
      setCurrentCaptureBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setCaptureOpen(true);
      setIsSavedInSession(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Snapshot capture failed');
    }
  };

  // Save capture to user lookbook / server
  const saveCaptureMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No active try-on session');
      const mockKey = `captures/${sessionId}/${Date.now()}.png`;
      const sizeBytes = currentCaptureBlob?.size ?? 150000;

      const registered = await api.tryOn.registerCapture(sessionId, {
        storageKey: mockKey,
        width: 1080,
        height: 1440,
        mimeType: 'image/png',
        fileSizeBytes: sizeBytes,
      });

      return registered;
    },
    onSuccess: (data) => {
      setLastCaptureId(data.id);
      setIsSavedInSession(true);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Could not save capture to account');
    },
  });

  if (sessionQuery.isLoading) return <PageLoader label="Initializing Luxury AR Studio…" />;

  if (sessionQuery.isError) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-lg">
        <Sparkles className="mx-auto h-8 w-8 text-destructive/70" />
        <h3 className="mt-4 font-serif text-xl font-semibold">Studio Connection Issue</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not initiate your virtual fitting session. Please check your network connection.
        </p>
        <Button className="mt-6 rounded-full" onClick={() => sessionQuery.refetch()}>
          Retry Studio Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Live Fitting
            </Badge>
            <span className="text-xs text-muted-foreground uppercase tracking-widest font-mono">
              Session: {sessionId ? sessionId.slice(0, 8) : 'Direct'}
            </span>
          </div>
          <h1 className="mt-1 font-serif text-2xl sm:text-3xl font-normal text-foreground">
            {currentProduct.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCinemaMode(!cinemaMode)}
            className="hidden sm:inline-flex rounded-full gap-1.5 text-xs text-muted-foreground"
          >
            {cinemaMode ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            {cinemaMode ? 'Exit Cinema' : 'Cinema Mode'}
          </Button>

          {currentProduct.priceCents != null ? (
            <div className="text-right">
              <span className="text-xs text-muted-foreground uppercase tracking-wider block">Price</span>
              <span className="font-serif text-xl font-semibold text-primary">
                {formatPrice(currentProduct.priceCents, currentProduct.currency ?? 'INR')}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Studio Workspace: Viewfinder & Jewellery Drawer */}
      <div
        className={
          cinemaMode
            ? 'flex flex-col items-center justify-center max-w-4xl mx-auto space-y-6'
            : 'grid gap-8 lg:grid-cols-[1fr_360px]'
        }
      >
        {/* Left Column: Real-time Camera Viewfinder */}
        <div className="flex flex-col items-center w-full">
          <CameraComponent
            videoRef={videoRef}
            overlayRef={overlayRef}
            threeRef={threeRef}
            running={running}
            starting={starting}
            hud={hud}
            mirrorOn={mirrorOn}
            onStart={startCamera}
            onStop={stopCamera}
            onFlip={flipCamera}
            onMirrorToggle={toggleMirror}
            onCapture={handleCapture}
            promptText={`Position your camera to see ${currentProduct.name} fitted precisely in real-time.`}
          />

          {/* Quick In-Studio Jewellery Switcher Strip */}
          <div className="mt-4 w-full max-w-xl">
            <JewellerySelector
              items={selectorItems}
              selectedId={currentProduct.id}
              onSelect={handleSelectPiece}
            />
          </div>
        </div>

        {/* Right Column: Piece Details & Atelier Actions (Desktop side / Mobile bottom) */}
        {!cinemaMode && (
          <aside className="space-y-6">
            {/* Atelier Spec Card */}
            <div className="rounded-3xl border bg-card p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {currentProduct.jewelleryKind.replace(/_/g, ' ')}
                  </Badge>
                  <h2 className="font-serif text-2xl font-normal leading-snug">
                    {currentProduct.name}
                  </h2>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">SKU: {currentProduct.sku}</p>
                </div>

                {currentProduct.primaryImage?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentProduct.primaryImage.url}
                    alt={currentProduct.name}
                    className="h-16 w-16 rounded-xl object-cover border"
                  />
                ) : null}
              </div>

              {currentProduct.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {currentProduct.description}
                </p>
              ) : null}

              {currentProduct.priceCents != null ? (
                <div className="border-t pt-4">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">Estimate</div>
                  <div className="text-2xl font-serif font-semibold text-primary">
                    {formatPrice(currentProduct.priceCents, currentProduct.currency ?? 'INR')}
                  </div>
                </div>
              ) : null}

              <div className="flex gap-2 pt-2">
                <Button className="flex-1 rounded-full gap-2">
                  <ShoppingBag className="h-4 w-4" /> Add to Shopping Bag
                </Button>
                <Button variant="outline" size="icon" className="rounded-full shrink-0">
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Fitting & Sensor Diagnostic Card */}
            <div className="rounded-2xl border bg-muted/40 p-4 text-xs space-y-2.5">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Info className="h-4 w-4 text-primary" />
                <span>AR Sensor Calibration</span>
              </div>
              <p className="text-muted-foreground leading-normal">
                Fitting is calibrated automatically using multi-point facial landmark and pose detection.
                Natural lighting yields the most luminous shine.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-muted-foreground">
                <div className="rounded-md bg-background/80 p-2 border">
                  <span className="block text-[10px] uppercase text-muted-foreground">Asset Engine</span>
                  <span className="font-semibold text-foreground">Three.js WebGL</span>
                </div>
                <div className="rounded-md bg-background/80 p-2 border">
                  <span className="block text-[10px] uppercase text-muted-foreground">Model Status</span>
                  <span className="font-semibold text-foreground">
                    {asset ? 'Ready' : 'Procedural'}
                  </span>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Snapshot Capture Modal */}
      <CaptureModal
        open={captureOpen}
        onOpenChange={setCaptureOpen}
        previewUrl={previewUrl}
        productName={currentProduct.name}
        onSave={() => saveCaptureMutation.mutateAsync()}
        isSaving={saveCaptureMutation.isPending}
      />
    </div>
  );
}
