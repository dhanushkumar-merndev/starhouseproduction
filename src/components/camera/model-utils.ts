import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type Point = [number, number, number];
type Axis = "x" | "y" | "z";

let compactGeometry = false;

/** Keep small mechanical details lighter on mobile GPUs. */
export function configureModelQuality(compact: boolean) {
  compactGeometry = compact;
}

function surfaceTexture(carbon = false) {
  const size = 256;
  const data = new Uint8Array(size * size * 4);
  let seed = 21;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      seed = (seed * 16807) % 2147483647;
      const horizontal = (Math.floor(x / 8) + Math.floor(y / 8)) % 4 < 2;
      const across = ((horizontal ? y : x) % 8) / 8;
      const along = ((horizontal ? x : y) % 16) / 16;
      const bundle = Math.sin(across * Math.PI) * 31;
      const filaments = Math.cos((horizontal ? y : x) * Math.PI) * 8;
      const crossover = Math.sin(along * Math.PI) * 14;
      const value = carbon
        ? 78 + bundle + filaments + crossover + (horizontal ? 16 : 0) + seed / 2147483647 * 5
        : 120 + (seed / 2147483647) * 35;
      const i = (y * size + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 255;
    }
  }
  const texture = new THREE.DataTexture(data, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(carbon ? 2 : 5, carbon ? 2 : 5);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

const grain = surfaceTexture();
const weave = surfaceTexture(true);

export const materials = {
  body: new THREE.MeshStandardMaterial({ color: 0x1d1e20, metalness: 0.64, roughness: 0.4, bumpMap: grain, bumpScale: 0.006 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x111214, metalness: 0.56, roughness: 0.34 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x161718, metalness: 0.02, roughness: 0.86, bumpMap: grain, bumpScale: 0.024 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x343638, metalness: 0.88, roughness: 0.3 }),
  silver: new THREE.MeshStandardMaterial({ color: 0xbbbfbe, metalness: 0.94, roughness: 0.23 }),
  red: new THREE.MeshStandardMaterial({ color: 0xc41623, metalness: 0.48, roughness: 0.28 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0x183b32, metalness: 0.32, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 0.8, iridescenceIOR: 1.35 }),
  screen: new THREE.MeshPhysicalMaterial({ color: 0x101a1c, metalness: 0.22, roughness: 0.12, clearcoat: 1 }),
  recess: new THREE.MeshStandardMaterial({ color: 0x040506, metalness: 0.05, roughness: 0.8 }),
  carbon: new THREE.MeshStandardMaterial({ color: 0x505354, metalness: 0.42, roughness: 0.48, map: weave, bumpMap: weave, bumpScale: 0.006 }),
};

export function box(parent: THREE.Object3D, size: Point, position: Point, material: THREE.Material, radius = 0.025) {
  const geometry = radius > 0
    ? new RoundedBoxGeometry(...size, 2, radius)
    : new THREE.BoxGeometry(...size);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function cylinder(parent: THREE.Object3D, radius: number, length: number, position: Point, material: THREE.Material, axis: Axis = "y", radiusBottom = radius) {
  const segments = compactGeometry ? (radius < 0.1 ? 12 : 32) : 48;
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radiusBottom, length, segments), material);
  if (axis === "x") mesh.rotation.z = -Math.PI / 2;
  if (axis === "z") mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function torus(parent: THREE.Object3D, radius: number, tube: number, position: Point, material: THREE.Material, axis: Axis = "z") {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, compactGeometry ? 6 : 8, compactGeometry ? (radius < 0.1 ? 16 : 32) : 48), material);
  if (axis === "x") mesh.rotation.y = Math.PI / 2;
  if (axis === "y") mesh.rotation.x = Math.PI / 2;
  mesh.position.set(...position);
  mesh.castShadow = mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export function screw(parent: THREE.Object3D, position: Point, axis: Axis = "z", radius = 0.04) {
  const group = new THREE.Group();
  group.position.set(...position);
  if (axis === "x") group.rotation.y = Math.PI / 2;
  if (axis === "y") group.rotation.x = Math.PI / 2;
  cylinder(group, radius * 1.2, 0.017, [0, 0, 0], materials.dark, "z");
  cylinder(group, radius, 0.024, [0, 0, 0], materials.silver, "z");
  const socket = new THREE.CylinderGeometry(radius * 0.47, radius * 0.47, 0.027, 6);
  socket.rotateX(Math.PI / 2);
  group.add(new THREE.Mesh(socket, materials.recess));
  parent.add(group);
}

export function cable(parent: THREE.Object3D, points: Point[], radius: number, material: THREE.Material) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, compactGeometry ? 36 : 56, radius, compactGeometry ? 6 : 8, false), material);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

export function perforatedBar(parent: THREE.Object3D, size: Point, position: Point, axis: Axis = "x") {
  const group = new THREE.Group();
  box(group, size, [0, 0, 0], materials.body, 0.035);
  const length = size[axis === "x" ? 0 : axis === "y" ? 1 : 2];
  const count = Math.floor(length / 0.16);
  for (let i = 1; i < count; i++) {
    const offset = -length / 2 + i * length / count;
    const p: Point = axis === "y" ? [0, offset, size[2] / 2 + 0.002] : [offset, 0, size[2] / 2 + 0.002];
    cylinder(group, 0.047, 0.008, p, materials.recess, "z");
    torus(group, 0.049, 0.004, p, materials.metal, "z");
  }
  group.position.set(...position);
  parent.add(group);
  return group;
}
