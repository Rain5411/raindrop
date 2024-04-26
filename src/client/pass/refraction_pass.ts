import * as THREE from "/build/three.module.js";

export class RefractionPass {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.WebGLRenderTarget;

  constructor(camera) {
    this.camera = camera; // Reuse the same camera
    this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    this.target.texture.format = THREE.RGBAFormat;
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.stencilBuffer = false;
    this.target.depthBuffer = true;
  }

  public render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);

    return this.target.texture;
  }
}
