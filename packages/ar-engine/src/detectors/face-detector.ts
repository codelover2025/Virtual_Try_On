import * as blazeface from '@tensorflow-models/blazeface';
import type { ModelAdapter, PixelInput } from '../models/model-adapter.js';
import type { LandmarkResult } from '../types.js';

/**
 * Face detector using BlazeFace (pure TensorFlow.js — no MediaPipe packages).
 * Ear tragion keypoints drive earring anchors.
 */
export class FaceDetector implements ModelAdapter {
  readonly name = 'face';
  private model: blazeface.BlazeFaceModel | null = null;

  async load(): Promise<void> {
    this.model = await blazeface.load({ maxFaces: 1 });
  }

  async estimate(input: PixelInput): Promise<LandmarkResult | null> {
    if (!this.model) return null;
    const preds = await this.model.estimateFaces(input as HTMLVideoElement | HTMLCanvasElement, false);
    const face = preds[0];
    if (!face) return null;

    const landmarks = face.landmarks as Array<[number, number]> | undefined;
    // BlazeFace order: right eye, left eye, nose, mouth, right ear, left ear
    const named: LandmarkResult['named'] = {};
    const points: LandmarkResult['points'] = [];

    const add = (name: string, xy?: [number, number] | number[]) => {
      if (!xy || xy.length < 2) return;
      const point = { x: Number(xy[0]), y: Number(xy[1]), name };
      named[name] = point;
      points.push(point);
    };

    if (landmarks && landmarks.length >= 6) {
      add('RIGHT_EYE', landmarks[0]);
      add('LEFT_EYE', landmarks[1]);
      add('NOSE_TIP', landmarks[2]);
      add('MOUTH', landmarks[3]);
      add('RIGHT_EAR_LOBE', landmarks[4]);
      add('LEFT_EAR_LOBE', landmarks[5]);
    }

    const topLeft = face.topLeft as [number, number];
    const bottomRight = face.bottomRight as [number, number];
    const faceWidth = Math.max(1, bottomRight[0] - topLeft[0]);
    const faceHeight = Math.max(1, bottomRight[1] - topLeft[1]);

    // Chin proxy below mouth / box center
    if (named['MOUTH']) {
      named['CHIN'] = {
        x: named['MOUTH'].x,
        y: named['MOUTH'].y + faceHeight * 0.22,
        name: 'CHIN',
      };
      points.push(named['CHIN']);
    } else {
      named['CHIN'] = {
        x: (topLeft[0] + bottomRight[0]) / 2,
        y: bottomRight[1] - faceHeight * 0.05,
        name: 'CHIN',
      };
      points.push(named['CHIN']);
    }

    // Offset ear lobes slightly downward for earring hang
    if (named['LEFT_EAR_LOBE']) {
      named['LEFT_EAR_LOBE'] = {
        ...named['LEFT_EAR_LOBE'],
        y: named['LEFT_EAR_LOBE'].y + faceHeight * 0.06,
      };
    }
    if (named['RIGHT_EAR_LOBE']) {
      named['RIGHT_EAR_LOBE'] = {
        ...named['RIGHT_EAR_LOBE'],
        y: named['RIGHT_EAR_LOBE'].y + faceHeight * 0.06,
      };
    }

    let scaleRef = faceWidth;
    if (named['LEFT_EYE'] && named['RIGHT_EYE']) {
      scaleRef =
        Math.hypot(
          named['RIGHT_EYE'].x - named['LEFT_EYE'].x,
          named['RIGHT_EYE'].y - named['LEFT_EYE'].y,
        ) || faceWidth;
    }

    const probability = Array.isArray(face.probability)
      ? Number(face.probability[0] ?? 0.9)
      : Number(face.probability ?? 0.9);

    return {
      kind: 'face',
      confidence: Number.isFinite(probability) ? probability : 0.85,
      points,
      named,
      scaleRef,
    };
  }

  dispose(): void {
    this.model = null;
  }
}
