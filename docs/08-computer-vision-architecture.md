# 08 - Computer Vision Architecture

**Constraints:** TensorFlow.js + OpenCV.js + Canvas API + Three.js/R3F/WebGL. **No MediaPipe. No paid AR SDKs.**

**Location:** `packages/ar-engine` (browser-only). API stores sessions/captures/metadata only.

---

## 1. Goals

- Real-time jewellery overlay for Earrings, Necklace, Rings, Bangles, Nose Rings
- Extensible registry for Bracelets, Pendant, Mangalsutra, Sunglasses, Watch
- Stable tracking on mid-range mobiles at 24-30 FPS
- Graceful recovery when detection fails
- Capture composite suitable for download/share

---

## 2. Camera Flow

```
1. Feature requests media: facingMode user, ideal 1280x720
2. Permission gate UX (never silent fail)
3. Attach MediaStream to hidden <video playsInline muted>
4. Wait loadedmetadata -> play()
5. Prefer requestVideoFrameCallback; fallback requestAnimationFrame
6. Mirror preview for front camera (CSS or drawImage transform)
7. On unmount: stop all tracks; dispose engine
```

**Constraints object (baseline):**

```text
audio: false
video: {
  facingMode: "user",
  width: { ideal: 1280 },
  height: { ideal: 720 },
  frameRate: { ideal: 30 }
}
```

Degrade: if stream fails at 720p, retry 640x480.

---

## 3. TensorFlow.js Pipeline

```
Boot
 -> tf.ready()
 -> pick backend: webgl -> wasm -> cpu (last resort)
 -> load model graph(s) once (cached)
 -> warmup inference on blank/low-res tensor
 -> enter frame loop
```

### Model Router

| JewelleryKind | Detector set |
|---------------|--------------|
| EARRINGS, NECKLACE, NOSE_RING, SUNGLASSES, PENDANT, MANGALSUTRA | Face landmarks |
| RINGS, BANGLES, BRACELET, WATCH | Hand landmarks |
| Future dual (e.g. necklace+earrings) | Face (+ optional hand) |

Models are **OSS TF.js-compatible** face/hand landmark models (exact model files chosen at implementation; architecture assumes pluggable `ModelAdapter`).

```text
interface ModelAdapter {
  load(): Promise<void>
  estimate(input: PixelInput): Promise<LandmarkResult | null>
  dispose(): void
}
```

---

## 4. Face Detection & Landmarks

**Purpose:** Anchor earrings (ears), nose ring (nose), necklace (chin/neck proxy), sunglasses (eye line).

**Pipeline:**

1. Downscale frame to model input size (e.g. 256-320 px max side)
2. Run face landmark estimate
3. Confidence gate - discard low-score frames
4. Extract named points: left/right ear lobe proxies, nose tip, chin, eye outer corners
5. Compute face scale reference (interpupillary or jaw width)
6. Pass to Landmark Processor

**Necklace note:** Without full body model in v1, use chin + face scale + configurable vertical offset from `anchorProfile` to approximate collarbone. Document limitation; improve with optional shoulder heuristic later.

---

## 5. Hand Detection & Landmarks

**Purpose:** Rings (finger joints), bangles/bracelets/watch (wrist).

**Pipeline:**

1. Downscale frame
2. Hand landmark estimate (single or multi-hand - v1: dominant hand or first detected)
3. Map `fingerIndex` from asset (0-4) to joint pair for ring slot
4. Wrist -> scale using wrist width / middle proximal length
5. Orientation from finger bone vectors

---

## 6. Landmark Processing

| Stage | Technique |
|-------|-----------|
| Confidence gate | Ignore below threshold |
| Outlier reject | Jump > Nx face/hand scale vs previous -> discard |
| Smoothing | EMA / One-Euro filter on x,y (and z if available) |
| Hold last | If miss < T ms, keep last good pose |
| Hard loss | If miss ≥ T ms, emit `tracking:lost` |

Keep state in engine refs; do not React-render every frame.

---

## 7. Jewellery Alignment

```
Anchors -> world/screen position
-> Apply anchorProfile.offset (normalized by scaleRef)
-> Scale = defaultScale * (liveScaleRef / assetNativeRef)
-> Rotation from bone/ear axis (atan2)
-> Optional mirror for contralateral earring
-> Depth hint for Three.js (z-offset) to reduce clipping
```

**2D path (IMAGE_OVERLAY):** Canvas drawImage with transform matrix.  
**3D path (MODEL_GLB/GLTF):** R3F object pose synced from anchors each frame.

---

## 8. Scaling

- `scaleRef` from live landmarks vs calibrated reference in asset metadata
- Clamp scale to `[minScale, maxScale]` from profile to avoid explosions
- Separate UI “size adjust” slider writes to session-local multiplier (not persisted unless product setting)

---

## 9. Rotation

- Earrings: rotate with ear axis; roll lightly with head tilt if landmarks allow
- Rings: align to finger segment angle
- Bangles/watch: align to wrist vector
- Nose ring: follow nose tip; small yaw from nose bridge

Represent rotations consistently (radians internally).

---

## 10. Tracking

**Stateful tracker per active product:**

```text
status: INITIALIZING | TRACKING | DEGRADED | LOST
```

- INITIALIZING: awaiting first good detection
- TRACKING: stable EMA
- DEGRADED: intermittent misses / low confidence - still render last pose with opacity fade optional
- LOST: hide jewellery or show ghost guide silhouette

Multi-earring: track left and right anchors independently; if one lost, still show the other.

---

## 11. Optimization

| Lever | Action |
|-------|--------|
| Resolution | Detect at low res; render overlay at display res |
| Skip frames | Run detector every 2nd frame under load; interpolate |
| Backend | Prefer WebGL; fall back WASM |
| Model size | Quantized / lite models |
| Bundle | Dynamic import ar-engine on try-on route only |
| OpenCV.js | Lazy load only when capture post-process needs it |
| GC | Reuse tensors; `tf.tidy`; dispose on stop |
| Mobile | Reduce lights/shadows on 3D; simpler materials |

**Adaptive controller:** if FPS < 22 for 2s -> lower detect size / increase skip.

---

## 12. Recovery

| Failure | Recovery |
|---------|----------|
| Permission denied | Instructions + re-request button |
| Camera in use | Suggest close other apps; retry |
| Model load fail | Retry CDN; show non-AR product stills |
| Backend init fail | Try next TF backend |
| Tracking lost | Guide: “Center your face/hand”, auto-resume |
| Tab hidden | Pause loop; resume on visibility |
| Context lost (WebGL) | Recreate renderer + reload textures |

---

## 13. Capture Pipeline

```
1. Pause or peek current video frame + overlay state
2. Draw video to offscreen canvas (unmirrored option for natural photo)
3. Draw 2D overlays OR render Three.js to texture/canvas
4. Composite -> toBlob(image/jpeg, 0.92)
5. Optional OpenCV denoise/sharpen (lazy)
6. Presign upload -> PUT -> register capture API
7. Present download via signed URL
```

Never upload raw video by default.

---

## 14. Performance Strategy (Summary)

- Budget: model load < 3s cached; frame budget ~33ms
- Measure: FPS, inferMs, trackAge - sample to session metrics on complete
- QA matrix: Chrome/Safari iOS/Android mid-tier devices
- Feature detect WebGL; block try-on with clear message if unavailable

---

## 15. Extensibility for Future Jewellery

Add new `JewelleryKind` -> register `AnchorProfile` + detector affinity in registry. No changes to Nest product schema beyond enum migration. Asset JSON carries offsets.

```text
AnchorRegistry.register("WATCH", {
  detector: "hand",
  primary: "WRIST",
  scaleRef: "WRIST_WIDTH",
  ...
})
```

---

## 16. Security & Privacy

- Camera frames stay in-browser except explicit capture upload
- No continuous frame streaming to server in v1
- Clear UX when capturing/uploading
- Captures TTL + soft delete (see DB design)
