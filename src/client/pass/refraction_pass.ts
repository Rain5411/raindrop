import * as THREE from "/build/three.module.js";

export class RefractionPass {
  private camera: THREE.PerspectiveCamera;
  private target: THREE.WebGLRenderTarget;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera; // Reuse the same camera
    this.target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
    this.target.texture.format = THREE.RGBAFormat;
    this.target.texture.minFilter = THREE.NearestFilter;
    this.target.texture.magFilter = THREE.NearestFilter;
    this.target.texture.generateMipmaps = false;
    this.target.stencilBuffer = false;
    this.target.depthBuffer = true;
    this.target.depthTexture = new THREE.DepthTexture(undefined, undefined);
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;
  }

  public render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): [THREE.Texture, THREE.DepthTexture] {
    renderer.setRenderTarget(this.target);
    renderer.render(scene, this.camera);
    renderer.setRenderTarget(null);

    return [this.target.texture, this.target.depthTexture];
  }
}
