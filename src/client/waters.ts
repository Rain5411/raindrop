import * as THREE from "/build/three.module.js";

import waterVertexShader from "./shaders/water_vertex.glsl";
import waterFragmentShader from "./shaders/water_frag.glsl";

import { AABB } from "./pass/depth_pass";

type HGrid = Array<Float32Array>;

const next = [[0, 1], [1, 0], [-1, 0], [0, -1]];
const damping = 0.996;
const rate = 0.005;

export class Water {
  private mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;
  private color: THREE.Vector3;
  private size: [number, number]
  private geometry: THREE.PlaneGeometry;
  private old_h: HGrid;
  private h: HGrid;
  private new_h: HGrid;
  private box: AABB;

  constructor(scene: THREE.Scene, size: THREE.Vector2, position: THREE.Vector3) {
    this.size = [Math.floor(25 * size.x), Math.floor(25 * size.y)];
    this.geometry = new THREE.PlaneGeometry(size.x, size.y, this.size[0] - 1, this.size[1] - 1);
    this.box = [
      new THREE.Vector3(position.x - size.x / 2, position.y - size.y / 2, position.z),
      new THREE.Vector3(position.x + size.x / 2, position.y + size.y / 2, position.z)
    ];
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
        },
        depth_texture: {
          value: null
        },
        reflected_texture: {
          value: null
        },
        heights: {
          value: null
        }
      }
    });

    this.old_h = new Array<Float32Array>();
    this.h = new Array<Float32Array>();
    this.new_h = new Array<Float32Array>();
    for (let i = 0; i < this.size[0]; ++i) {
      this.old_h[i] = new Float32Array(this.size[1]);
      this.h[i] = new Float32Array(this.size[1]);
      this.new_h[i] = new Float32Array(this.size[1]);
      for (let j = 0; j < this.size[1]; ++j) {
        this.old_h[i][j] = 0;
        this.h[i][j] = 0;
        this.new_h[i][j] = 0;
      }
    }

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(position.x, position.y, position.z);
    this.mesh.rotateX(-Math.PI / 2.0);
    scene.add(this.mesh);
  }

  public set_color(color: THREE.Vector3) {
    this.color = color;
  }

  public set_textures(opaque: THREE.Texture, depth: THREE.DepthTexture, refl: THREE.Texture) {
    this.material.uniforms.opaque_texture.value = opaque;
    this.material.uniforms.depth_texture.value = depth;
    this.material.uniforms.reflected_texture.value = refl;
  }

  public set_visible(vis: boolean) {
    this.mesh.visible = vis;
  }

  private shallow_wave() {
    for (let i = 0; i < this.size[0]; ++i) {
      for (let j = 0; j < this.size[1]; ++j) {
        this.new_h[i][j] = this.h[i][j] + (this.h[i][j] - this.old_h[i][j]) * damping;

        for (let n of next) {
          const ni = i + n[0];
          const nj = j + n[1];
          if (ni >= 0 && ni < this.size[0] && nj >= 0 && nj < this.size[1]) {
            this.new_h[i][j] += (this.h[ni][nj] - this.h[i][j]) * rate;
          }
        }
      }
    }

    for (let i = 0; i < this.size[0]; ++i) {
      for (let j = 0; j < this.size[1]; ++j) {
        this.old_h[i][j] = this.h[i][j];
        this.h[i][j] = this.new_h[i][j];
      }
    }
  }

  public drop(drops: THREE.Vector3[]) {
    for (const dp of drops) {
      if (dp.y <= 0 && dp.x >= this.box[0].x && dp.x <= this.box[1].x && dp.z >= this.box[0].y && dp.z <= this.box[1].y) {
        const x = Math.round((dp.x - this.box[0].x) * 25);
        const y = Math.round((dp.z - this.box[0].y) * 25);
        const dlt = 0.3;
        this.h[x][y] += dlt;

        let srd = 0;
        for (let n of next) {
          const nx = x + n[0];
          const ny = y + n[1];
          if (nx >= 0 && nx < this.size[0] && ny >= 0 && ny < this.size[1]) {
            ++srd;
          }
        }

        if (x > 0) {
          this.h[x - 1][y] -= dlt / srd;
        }
        if (x < this.size[0] - 1) {
          this.h[x + 1][y] -= dlt / srd;
        }
        if (y > 0) {
          this.h[x][y - 1] -= dlt / srd;
        }
        if (y < this.size[1] - 1) {
          this.h[x][y + 1] -= dlt / srd;
        }
      }
    }

    for (let i = 0; i < 8; ++i) {
      this.shallow_wave();
    }

    const positions = this.geometry.attributes.position as THREE.BufferAttribute;
    for (let j = 0; j < this.size[1]; ++j) {
      for (let i = 0; i < this.size[0]; ++i) {
        const id = j * this.size[0] + i;
        positions.setZ(id, this.h[i][j]);
      }
    }
    positions.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }
}
