# @vj/ar-engine

Browser AR try-on engine for Virtual Jewellery.

## Modules

- `camera` - getUserMedia, flip, device switch
- `detectors` - TF.js face / hand landmark adapters (`runtime: 'tfjs'` only; no `@mediapipe/*` imports)
- `landmarks` - EMA smoothing, outlier rejection, hold/lost
- `anchors` - JewelleryKind registry (future-ready)
- `fitting` - scale / rotation / offset
- `tracking` - INITIALIZING | TRACKING | DEGRADED | LOST
- `performance` - FPS meter + adaptive detect skip/scale
- `renderers` - Canvas2D overlays + Three.js GLB
- `capture` - composite blob export
- `opencv` - optional lazy OpenCV.js loader for post-process

## Usage

```ts
import { ArEngine } from '@vj/ar-engine';

const engine = new ArEngine();
await engine.start({ video, overlayCanvas, threeCanvas }, config);
const blob = await engine.captureBlob();
engine.stop();
```
