import * as THREE from "/build/three.module.js";

import waterVertexShader from "./shaders/water_vertex.glsl";
import waterFragmentShader from "./shaders/water_frag.glsl";

export class Water {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private color: THREE.Vector3;

  constructor(scene: THREE.Scene, size: THREE.Vector2, position: THREE.Vector3) {
    const geometry = new THREE.PlaneGeometry(size.x, size.y, 100, 100);
    this.color = new THREE.Vector3(0.25, 1.0, 1.25);
    this.material = new THREE.ShaderMaterial({
      vertexShader: waterVertexShader,
      fragmentShader: waterFragmentShader,
      uniforms: {
        water_color: {
          value: this.color
        },
        view_dir: {
          value: new THREE.Vector3()
        },
        opaque_texture: {
          value: null
        }
      }
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotateX(-Math.PI / 2.0);
    scene.add(this.mesh);
  }

  public set_color(color: THREE.Vector3) {
    this.color = color;
  }

  public set_view_dir(dir: THREE.Vector3) {
    this.material.uniforms.view_dir.value = dir;
  }

  public set_opaque_texture(txt: THREE.Texture) {
    this.material.uniforms.opaque_texture.value = txt;
  }

  public set_visible(vis: boolean) {
    this.mesh.visible = vis;
  }
}
