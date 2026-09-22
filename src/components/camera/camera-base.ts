import * as THREE from "three";
import { box, cylinder, materials as m, screw, torus } from "./model-utils";
import { label } from "./label-utils";

function mountingBracket(parent: THREE.Group, side: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.61, 1.22);
  shape.lineTo(0.57, 1.22);
  shape.lineTo(0.68, 1.29);
  shape.lineTo(0.36, 1.54);
  shape.lineTo(0.22, 1.54);
  shape.lineTo(-0.1, 1.3);
  shape.lineTo(-0.41, 1.3);
  shape.lineTo(-0.41, 1.49);
  shape.lineTo(-0.58, 1.49);
  shape.closePath();
  const slot = new THREE.Path();
  slot.moveTo(0.05, 1.285);
  slot.lineTo(0.47, 1.285);
  slot.lineTo(0.29, 1.432);
  slot.lineTo(0.21, 1.432);
  slot.closePath();
  shape.holes.push(slot);
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, steps: 1 });
  const mesh = new THREE.Mesh(geometry, m.dark);
  mesh.position.z = side > 0 ? 0.38 : -0.45;
  parent.add(mesh);
  for (const [x, y] of [[-0.49, 1.35], [0.47, 1.34], [0.31, 1.487]]) screw(parent, [x, y, side * 0.465], "z", 0.04);
  label(parent, "DOVETAIL", 0.34, 0.038, [-0.13, 1.24, side * 0.462], { rotation: [0, side < 0 ? Math.PI : 0, 0], weight: 700 });
}

function dial(parent: THREE.Group, x: number, y: number, z: number, radius: number) {
  cylinder(parent, radius, 0.14, [x, y, z], m.metal, "z");
  cylinder(parent, radius * 0.78, 0.15, [x, y, z], m.dark, "z");
  torus(parent, radius * 0.82, 0.014, [x, y, z + 0.085], m.silver);
  for (let i = 0; i < 56; i++) {
    const a = i / 56 * Math.PI * 2;
    const rib = box(parent, [0.017, 0.034, 0.14], [x + Math.sin(a) * radius, y + Math.cos(a) * radius, z], m.metal, 0.003);
    rib.rotation.z = -a;
  }
  screw(parent, [x, y, z + 0.09], "z", radius * 0.24);
}

export function createCameraBase() {
  const group = new THREE.Group();
  group.name = "Fluid head and support rails";

  box(group, [1.2, 0.16, 1.06], [0.16, 0.11, 0], m.body, 0.075);
  box(group, [0.96, 0.05, 0.88], [0.16, 0.025, 0], m.rubber);
  for (const x of [-0.34, 0.66]) {
    for (const z of [-0.43, 0.43]) {
      screw(group, [x, 0.13, z + Math.sign(z) * 0.105], "z", 0.048);
      screw(group, [x, 0.2, z], "y", 0.036);
    }
  }
  cylinder(group, 0.45, 0.13, [0.16, 0.24, 0], m.dark);
  torus(group, 0.43, 0.014, [0.16, 0.28, 0], m.metal, "y");
  cylinder(group, 0.37, 0.14, [0.16, 0.34, 0], m.body);
  for (let i = 0; i < 36; i++) {
    const a = i / 36 * Math.PI * 2;
    const tick = box(group, [0.005, i % 3 ? 0.015 : 0.027, 0.007], [0.16 + Math.sin(a) * 0.451, 0.245, Math.cos(a) * 0.451], m.silver, 0);
    tick.rotation.y = a;
  }

  // The circular tilt housing rests inside the low-profile pan base.
  cylinder(group, 0.43, 0.7, [0.16, 0.65, 0], m.body, "z");
  cylinder(group, 0.36, 0.73, [0.16, 0.65, 0], m.dark, "z");
  for (const z of [-0.39, 0.39]) {
    torus(group, 0.33, 0.012, [0.16, 0.65, z], m.metal);
    cylinder(group, 0.25, 0.024, [0.16, 0.65, z], m.body, "z");
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2 + Math.PI / 4;
      screw(group, [0.16 + Math.sin(a) * 0.29, 0.65 + Math.cos(a) * 0.29, z * 1.05], "z", 0.025);
    }
  }
  for (const side of [-1, 1]) {
    torus(group, 0.228, 0.006, [0.16, 0.65, side * 0.415], m.silver);
    label(group, "S", 0.32, 0.33, [0.16, 0.65, side * 0.423], { outline: true, weight: 500, rotation: [0, side < 0 ? Math.PI : 0, 0] });
    screw(group, [0.16, 0.858, side * 0.422], "z", 0.018);
    screw(group, [0.16, 0.442, side * 0.422], "z", 0.018);
  }
  box(group, [1.6, 0.23, 1.12], [0.03, 1.0, 0], m.dark, 0.07);
  box(group, [2.75, 0.1, 1.06], [-0.18, 1.145, 0], m.body, 0.035);
  box(group, [1.34, 0.085, 0.65], [0.06, 1.23, 0], m.metal, 0.016);
  box(group, [1.05, 0.12, 0.76], [0, 1.29, 0], m.dark);
  mountingBracket(group, 1);
  mountingBracket(group, -1);
  box(group, [1.12, 0.052, 0.84], [-0.03, 1.515, 0], m.dark, 0.018);
  for (const z of [-0.48, 0.48]) {
    cylinder(group, 0.059, 2.92, [-0.585, 1.26, z], m.silver, "x");
    for (const x of [-2.047, 0.877]) {
      cylinder(group, 0.043, 0.012, [x, 1.26, z], m.recess, "x");
      torus(group, 0.051, 0.007, [x, 1.26, z], m.metal, "x");
    }
    for (const x of [-0.62, 0.7]) {
      box(group, [0.19, 0.22, 0.23], [x, 1.24, z], m.dark);
      screw(group, [x, 1.36, z], "y");
    }
  }
  for (const z of [-0.53, 0.53]) {
    for (let i = 0; i < 11; i++) {
      const x = -1.35 + i * 0.235;
      cylinder(group, 0.033, 0.007, [x, 1.147, z], m.recess, "z");
    }
    for (const x of [-1.46, -0.74, 0.65, 1.08]) screw(group, [x, 1.199, z * 0.84], "y", 0.031);
  }
  box(group, [0.17, 0.31, 0.12], [-0.74, 1.045, 0.595], m.red, 0.025);
  box(group, [0.21, 0.065, 0.16], [-0.74, 1.17, 0.61], m.red, 0.02);
  screw(group, [-0.74, 1.06, 0.662], "z", 0.025);
  label(group, "LOCK", 0.09, 0.035, [-0.74, 1.115, 0.675], { color: "#252525", weight: 700 });
  label(group, "−   +", 0.19, 0.047, [0.61, 0.98, 0.573], { color: "#bdbdb9" });
  for (const x of [-1.21, -0.96, -0.46, -0.21, 0.04, 0.29, 0.54, 0.79]) {
    for (const z of [-0.36, 0.36]) {
      cylinder(group, 0.026, 0.007, [x, 1.199, z], m.recess, "y");
      torus(group, 0.026, 0.003, [x, 1.203, z], m.metal, "y");
    }
  }

  dial(group, -0.71, 0.87, 0.65, 0.215);
  dial(group, 0.61, 0.58, 0.59, 0.205);
  cylinder(group, 0.09, 0.18, [-0.31, 0.57, 0.52], m.dark, "z");
  const lockLever = box(group, [0.42, 0.08, 0.055], [-0.47, 0.47, 0.62], m.body, 0.035);
  lockLever.rotation.z = 0.56;
  screw(group, [-0.3, 0.57, 0.66], "z", 0.04);

  // Pan arm and textured grip, extending to the operator's side.
  const arm = new THREE.Group();
  arm.position.set(0.73, 0.98, -0.43);
  arm.rotation.z = 0.07;
  arm.rotation.y = -0.15;
  arm.scale.x = 0.8;
  box(arm, [0.26, 0.25, 0.28], [0.05, 0, 0], m.body);
  screw(arm, [0.02, 0, 0.15], "z", 0.055);
  cylinder(arm, 0.075, 1.14, [0.65, 0, 0], m.dark, "x");
  cylinder(arm, 0.09, 0.17, [0.22, 0, 0], m.body, "x");
  cylinder(arm, 0.095, 0.1, [1.2, 0, 0], m.metal, "x");
  const grip = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.86, 8, 32), m.rubber);
  grip.rotation.z = Math.PI / 2;
  grip.position.set(1.75, 0, 0);
  grip.castShadow = true;
  arm.add(grip);
  torus(arm, 0.145, 0.012, [1.35, 0, 0], m.dark, "x");
  torus(arm, 0.143, 0.012, [2.15, 0, 0], m.dark, "x");
  group.add(arm);
  return group;
}
