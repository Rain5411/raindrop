import * as THREE from "/build/three.module.js";

import { AABB } from "./depth_pass.js";
import { Pass } from "./pass.js";

import rippleVertexShader from "./shaders/ripple_vertex.glsl";
import rippleFragmentShader from "./shaders/ripple_frag.glsl";

export class RipplePass extends Pass<THREE.OrthographicCamera, THREE.Texture> {
  private ripple_material: THREE.ShaderMaterial;
  private raindrop: THREE.Mesh;
  private water_plane: THREE.Mesh;
  private heights: THREE.Texture;

  constructor(box: AABB, raindrop: THREE.Mesh, water_plane: THREE.Mesh) {
    super();
    this.raindrop = raindrop;
    this.water_plane = water_plane;
    
    const center = new THREE.Vector3((box[0].x + box[1].x) / 2, (box[0].y + box[1].y) / 2, (box[0].z + box[1].z) / 2);
    this.camera = new THREE.OrthographicCamera(-(box[1].x - box[0].x) / 2, (box[1].x - box[0].x) / 2,
      (box[1].z - box[0].z) / 2, -(box[1].z - box[0].z) / 2, 1, box[1].y - box[0].y + 1);
    this.camera.position.set(center.x, box[1].y, center.z);
    this.camera.lookAt(center);

    this.target.depthTexture = new THREE.DepthTexture(undefined, undefined);
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;

    this.ripple_material = new THREE.ShaderMaterial({
      vertexShader: rippleVertexShader,
      fragmentShader: rippleFragmentShader,
      uniforms: {
        has_drop: {
          value: true
        },
        near: {
          value: box[1].y
        },
        far: {
          value: box[0].y
        },
        raindrop: {
          value: null
        },
        heights: {
          value: this.heights
        },
        damping: {
          value: 0.996
        },
        rate: {
          value: 0.005
        }
      }
    });
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    // get the raindrop position texture
    renderer.setRenderTarget(this.target);
    renderer.render(this.raindrop, this.camera);
    this.ripple_material.uniforms.raindrop.value = this.target.depthTexture;

    // iteration
    const water_material = this.water_plane.material;
    this.water_plane.material = this.ripple_material;
    renderer.setRenderTarget(this.target);

    for (let i = 0; i < 8; ++i) {
      this.ripple_material.uniforms.heights.value = this.heights;
      renderer.render(this.water_plane, this.camera);
      this.heights = this.target.texture;
    }

    this.water_plane.material = water_material;
    renderer.setRenderTarget(null);

    return this.heights;
  }
}
