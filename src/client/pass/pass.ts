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

  // * depth test is always used. call this function if the depth texture is required.
  protected enableDepthTexture() {
    this.target.depthTexture = new THREE.DepthTexture(undefined, undefined); // * leave empty and let render target make the decision
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;
  }

  render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): TResult {
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);
    return undefined;
  }
}
