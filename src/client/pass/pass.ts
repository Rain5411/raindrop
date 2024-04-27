import * as THREE from "/build/three.module.js";

interface IRender<TResult> {
  render: (renderer: THREE.WebGLRenderer, scene: THREE.Scene) => TResult
}

export abstract class Pass<TCamera extends THREE.Camera, TResult> implements IRender<TResult> {
  protected target: THREE.WebGLRenderTarget;
  protected camera: TCamera;

  constructor() {
    this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    this.target.texture.format = THREE.RGBAFormat;
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.stencilBuffer = false;
    this.target.depthBuffer = true;
    this.target.stencilBuffer = false;
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): TResult {
    return undefined;
  }
}
