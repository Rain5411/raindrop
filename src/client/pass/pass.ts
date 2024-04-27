import * as THREE from "/build/three.module.js";

interface IRender<TResult> {
  render: (renderer: THREE.WebGLRenderer, scene: THREE.Scene) => TResult
}

export abstract class Pass<TCamera extends THREE.Camera, TResult> implements IRender<TResult> {
  protected target: THREE.WebGLRenderTarget;
  protected camera: TCamera;

  constructor() {
    this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    this.init_target(this.target);
  }

  protected init_target(target: THREE.WebGLRenderTarget) {
    target.texture.format = THREE.RGBAFormat;
    target.texture.minFilter = THREE.NearestFilter;
    target.texture.magFilter = THREE.NearestFilter;
    target.texture.generateMipmaps = false;
    target.stencilBuffer = false;
    target.depthBuffer = true;
    target.stencilBuffer = false;
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): TResult {
    return undefined;
  }
}
