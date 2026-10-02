import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { PoseFit } from '../types.js';

/**
 * Three.js jewellery overlay renderer.
 * Supports GLB load OR procedural gold earring meshes for Phase 1 demos.
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
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.camera = new THREE.OrthographicCamera(0, 1, 0, 1, 0.1, 2000);
    this.camera.position.z = 10;
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const dir = new THREE.DirectionalLight(0xfff2cc, 1.1);
    dir.position.set(0.4, 0.6, 1);
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

  /** Procedural gold drop earring for Phase 1 without asset uploads. */
  loadProceduralEarring(mirrorSecondary = true): void {
    this.root.clear();
    this.secondary.clear();
    const mesh = createGoldDropEarring();
    this.root.add(mesh);
    if (mirrorSecondary) {
      const sec = createGoldDropEarring();
      this.secondary.add(sec);
    }
    this.ready = true;
  }

  async loadModel(url: string, mirrorSecondary = false): Promise<void> {
    if (!url || url === 'procedural://earring') {
      this.loadProceduralEarring(mirrorSecondary);
      return;
    }
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
    if (!this.ready) {
      this.renderer.render(this.scene, this.camera);
      return;
    }
    if (!pose.visible) {
      this.root.visible = false;
      this.secondary.visible = false;
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.root.visible = true;
    this.root.position.set(pose.position.x, pose.position.y, 0);
    this.root.rotation.z = -pose.rotationZ;
    const s = Math.max(0.35, pose.scale) * 18;
    this.root.scale.setScalar(s);

    if (pose.secondaryPosition) {
      this.secondary.visible = true;
      this.secondary.position.set(pose.secondaryPosition.x, pose.secondaryPosition.y, 0);
      this.secondary.rotation.z = pose.rotationZ;
      this.secondary.scale.setScalar(s);
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

function createGoldDropEarring(): THREE.Group {
  const group = new THREE.Group();
  const gold = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.25,
  });
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 12, 24, Math.PI), gold);
  hook.rotation.z = Math.PI;
  hook.position.y = 0.18;
  const bead = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), gold);
  bead.position.y = -0.05;
  const drop = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), gold);
  drop.scale.set(0.75, 1.15, 0.75);
  drop.position.y = -0.38;
  group.add(hook, bead, drop);
  return group;
}
