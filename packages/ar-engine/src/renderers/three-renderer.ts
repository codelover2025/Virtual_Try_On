import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PoseFit } from '../types.js';

/**
 * Lightweight Three.js jewellery overlay renderer (non-React).
 * React Three Fiber can wrap this later in the web app without coupling the engine to R3F.
 */
export class ThreeRenderer {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.OrthographicCamera;
  private root = new THREE.Group();
  private secondary = new THREE.Group();
  private ready = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 2000);
    this.camera.position.z = 10;
    this.scene.add(new THREE.AmbientLight(0xffffff, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(0, 0, 1);
    this.scene.add(dir);
    this.scene.add(this.root);
    this.scene.add(this.secondary);
  }

  resize(width: number, height: number): void {
    this.renderer.setSize(width, height, false);
    this.camera.left = 0;
    this.camera.right = width;
    this.camera.top = 0;
    this.camera.bottom = height;
    this.camera.updateProjectionMatrix();
  }

  async loadModel(url: string, mirrorSecondary = false): Promise<void> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    this.root.clear();
    this.secondary.clear();
    const primary = gltf.scene.clone(true);
    this.root.add(primary);
    if (mirrorSecondary) {
      const sec = gltf.scene.clone(true);
      sec.scale.x *= -1;
      this.secondary.add(sec);
    }
    this.ready = true;
  }

  render(pose: PoseFit): void {
    if (!this.ready || !pose.visible) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.root.visible = true;
    this.root.position.set(pose.position.x, pose.position.y, 0);
    this.root.rotation.z = -pose.rotationZ;
    this.root.scale.setScalar(pose.scale);

    if (pose.secondaryPosition) {
      this.secondary.visible = true;
      this.secondary.position.set(pose.secondaryPosition.x, pose.secondaryPosition.y, 0);
      this.secondary.rotation.z = pose.rotationZ;
      this.secondary.scale.setScalar(pose.scale);
    } else {
      this.secondary.visible = false;
    }
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.renderer.dispose();
    this.root.clear();
    this.secondary.clear();
  }
}
