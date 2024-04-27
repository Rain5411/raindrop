import * as THREE from "/build/three.module.js";

import { AABB } from "./depth_pass.js";
import { Pass } from "./pass.js";

import rippleVertexShader from "../shaders/ripple_vertex.glsl";
import rippleFragmentShader from "../shaders/ripple_frag.glsl";
import dummyFragmentShader from "../shaders/dummy_frag.glsl"

export class RipplePass extends Pass<THREE.OrthographicCamera, THREE.Texture> {
  private ripple_material: THREE.ShaderMaterial;
  private raindrop: THREE.Mesh;
  private water_plane: THREE.Mesh;
  private heights: THREE.Texture;

  constructor(box: AABB, raindrop: THREE.Mesh, water_plane: THREE.Mesh) {
    super();
    this.update_rain(raindrop);
    
    const center = new THREE.Vector3((box[0].x + box[1].x) / 2, (box[0].y + box[1].y) / 2, (box[0].z + box[1].z) / 2);
    this.camera = new THREE.OrthographicCamera(-(box[1].x - box[0].x) / 2, (box[1].x - box[0].x) / 2,
      (box[1].z - box[0].z) / 2, -(box[1].z - box[0].z) / 2, 1, box[1].y - box[0].y + 1);
    this.camera.position.set(center.x, box[1].y, center.z);
    this.camera.lookAt(center);

    this.target.depthTexture = new THREE.DepthTexture(undefined, undefined);
    this.target.depthTexture.format = THREE.DepthFormat;
    this.target.depthTexture.type = THREE.UnsignedShortType;

    const size = window.innerWidth * window.innerHeight;
    const init_data = new Uint8Array(4 * size);
    for (let i = 0; i < size; ++i) {
      const stride = i * 4;
      init_data[stride] = 0;
      init_data[stride + 1] = 0;
      init_data[stride + 2] = 0;
      init_data[stride + 3] = 0 ;
    }

    const dt = new THREE.DataTexture(init_data);
    dt.needsUpdate = true;
    this.heights = dt;

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

    const geo = water_plane.geometry;
    if (geo instanceof THREE.PlaneGeometry) {
      this.water_plane = new THREE.Mesh(
        new THREE.PlaneGeometry(geo.parameters.width, geo.parameters.height, geo.parameters.widthSegments, geo.parameters.heightSegments),
        this.ripple_material
      );
    }
  }

  public update_rain(raindrop: THREE.Mesh) {
    if (raindrop != null && raindrop != undefined && (this.raindrop == null || raindrop.uuid !== this.raindrop.uuid)) {
      this.raindrop = raindrop.clone(true);
      this.raindrop.visible = true;
      if (raindrop.material instanceof THREE.Material) {
        this.raindrop.material = raindrop.material.clone();
      }
     
      if (this.raindrop.material instanceof THREE.ShaderMaterial) {
        this.raindrop.material.fragmentShader = dummyFragmentShader;
      }
    }
  }

  public override render(renderer: THREE.WebGLRenderer, scene: THREE.Scene): THREE.Texture {
    // get the raindrop position texture
    if (this.raindrop != undefined && this.raindrop != null && this.raindrop.material instanceof THREE.ShaderMaterial) {
      this.raindrop.visible = true;
      renderer.setRenderTarget(this.target);
      renderer.render(this.raindrop, this.camera);
      this.raindrop.visible = false;
      this.ripple_material.uniforms.raindrop.value = this.target.depthTexture;
    }
    else {
      return this.heights;
    }

    // iteration
    for (let i = 0; i < 8; ++i) {
      const target = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
      renderer.setRenderTarget(target);
      this.init_target(target);
      this.ripple_material.uniforms.heights.value = this.heights;
      renderer.render(this.water_plane, this.camera);
      this.heights = target.texture;
    }

    renderer.setRenderTarget(null);
    return this.heights;
  }
}
