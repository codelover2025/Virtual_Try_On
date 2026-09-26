import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import type { ModelAdapter, PixelInput } from '../models/model-adapter.js';
import type { LandmarkResult } from '../types.js';

/**
 * Face landmark detector via TF.js face-landmarks-detection (MediaPipe-free runtime path:
 * uses TFJS model runtime; no @mediapipe packages imported).
 */
export class FaceDetector implements ModelAdapter {
  readonly name = 'face';
  private detector: faceLandmarksDetection.FaceLandmarksDetector | null = null;

  async load(): Promise<void> {
    this.detector = await faceLandmarksDetection.createDetector(
      faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh,
      {
        runtime: 'tfjs',
        refineLandmarks: true,
        maxFaces: 1,
      },
    );
  }

  async estimate(input: PixelInput): Promise<LandmarkResult | null> {
    if (!this.detector) return null;
    const faces = await this.detector.estimateFaces(input, { flipHorizontal: false });
    const face = faces[0];
    if (!face || !face.keypoints?.length) return null;

    const named: LandmarkResult['named'] = {};
    const points = face.keypoints.map((kp) => {
      const point = { x: kp.x, y: kp.y, z: kp.z, name: kp.name };
      if (kp.name) named[kp.name] = point;
      return point;
    });

    // Approximate ear / nose / chin from named keypoints when available
    const leftEye = named['leftEye'] ?? named['leftEyeOuter'] ?? points[33];
    const rightEye = named['rightEye'] ?? named['rightEyeOuter'] ?? points[263];
    const noseTip = named['noseTip'] ?? points[1];
    const chin = points[152] ?? noseTip;

    if (leftEye) named['LEFT_EYE'] = leftEye;
    if (rightEye) named['RIGHT_EYE'] = rightEye;
    if (noseTip) named['NOSE_TIP'] = noseTip;
    if (chin) named['CHIN'] = chin;

    // Ear lobe proxies from face oval indices commonly used with FaceMesh topology
    if (points[234]) named['LEFT_EAR_LOBE'] = points[234];
    if (points[454]) named['RIGHT_EAR_LOBE'] = points[454];

    let scaleRef = 100;
    if (leftEye && rightEye) {
      scaleRef = Math.hypot(rightEye.x - leftEye.x, rightEye.y - leftEye.y) || 100;
    }

    const box = face.box;
    const confidence = box ? 0.9 : 0.7;

    return { kind: 'face', confidence, points, named, scaleRef };
  }

  dispose(): void {
    this.detector = null;
  }
}
