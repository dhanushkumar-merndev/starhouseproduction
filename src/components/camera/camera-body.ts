import * as THREE from 'three';
import { box, cable, cylinder, materials, screw, torus } from './model-utils';
import { label } from './label-utils';
import { createMonitorTexture } from './monitor-texture';

type Point = [number, number, number];

/** A machined plate with real drilled holes, rather than painted details. */
function handlePlate(parent: THREE.Group, position: Point) {
  const width = 1.77;
  const height = 0.23;
  const corner = 0.055;
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + corner, -height / 2);
  shape.lineTo(width / 2 - corner, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + corner);
  shape.lineTo(width / 2, height / 2 - corner);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - corner, height / 2);
  shape.lineTo(-width / 2 + corner, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - corner);
  shape.lineTo(-width / 2, -height / 2 + corner);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + corner, -height / 2);

  for (let i = 0; i < 8; i++) {
    const hole = new THREE.Path();
    hole.absarc(-0.61 + i * 0.175, 0, 0.057, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }
  for (let i = 0; i < 7; i++) {
    const hole = new THREE.Path();
    hole.absarc(-0.5225 + i * 0.175, 0, 0.018, 0, Math.PI * 2, true);
    shape.holes.push(hole);
  }

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelSize: 0.005,
    bevelThickness: 0.008,
    bevelSegments: 1,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -0.12);
  const mesh = new THREE.Mesh(geometry, materials.metal);
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);

  for (const side of [-1, 1]) {
    for (const x of [-0.785, 0.785]) {
      screw(parent, [position[0] + x, position[1], position[2] + side * 0.141], 'z', 0.043);
    }
  }
}

function brace(parent: THREE.Group, from: Point, to: Point, width = 0.13, depth = 0.13) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const middle = start.add(end).multiplyScalar(0.5);
  const mesh = box(parent, [width, direction.length(), depth], middle.toArray() as Point, materials.metal, 0.024);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  return mesh;
}

/** Recessed grille apertures are instanced to keep the detailed model light. */
function ventHoles(parent: THREE.Group, origin: Point, columns: number, rows: number, spacing: number, axis: 'x' | 'z') {
  const geometry = new THREE.CylinderGeometry(0.016, 0.016, 0.008, 10);
  if (axis === 'z') geometry.rotateX(Math.PI / 2);
  else geometry.rotateZ(Math.PI / 2);
  const holes = new THREE.InstancedMesh(geometry, materials.recess, columns * rows);
  const matrix = new THREE.Matrix4();
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const horizontal = (column - (columns - 1) / 2) * spacing;
      const vertical = (row - (rows - 1) / 2) * spacing;
      matrix.makeTranslation(
        origin[0] + (axis === 'z' ? horizontal : 0),
        origin[1] + vertical,
        origin[2] + (axis === 'x' ? horizontal : 0),
      );
      holes.setMatrixAt(row * columns + column, matrix);
    }
  }
  holes.instanceMatrix.needsUpdate = true;
  parent.add(holes);
}

function makeMonitor(parent: THREE.Group) {
  // The upper hinge is positioned from the monitor's transform so its support
  // remains physically connected when the display is turned or tilted.
  box(parent, [0.34, 0.08, 0.36], [-0.61, 3.435, 0], materials.metal, 0.025);
  cylinder(parent, 0.108, 0.43, [-0.61, 3.49, 0], materials.dark, 'z');
  screw(parent, [-0.61, 3.49, 0.232], 'z', 0.055);

  const monitor = new THREE.Group();
  monitor.name = 'Camera monitor';
  monitor.userData.keepSeparate = true;
  monitor.position.set(-0.54, 4.2, 0);
  monitor.rotation.y = Math.PI * 0.75;
  monitor.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), -0.1);
  parent.add(monitor);
  box(monitor, [1.76, 1.0, 0.19], [0, 0, 0], materials.body, 0.05);
  box(monitor, [1.68, 0.92, 0.025], [0, 0, -0.102], materials.dark, 0.035);
  const monitorBack = new THREE.MeshStandardMaterial({ color: 0x151719, metalness: 0.12, roughness: 0.78, bumpMap: materials.body.bumpMap, bumpScale: 0.003 });
  box(monitor, [1.26, 0.88, 0.015], [0, 0, -0.123], monitorBack, 0.015);

  // Reinforced back, rubber perimeter and a separately recessed active display.
  for (const side of [-1, 1]) {
    box(monitor, [0.19, 0.9, 0.037], [side * 0.746, 0, -0.13], materials.body, 0.019);
    for (const y of [-0.404, 0.404]) {
      screw(monitor, [side * 0.788, y, -0.153], 'z', 0.024);
      screw(monitor, [side * 0.66, y, -0.152], 'z', 0.02);
    }
  }
  box(monitor, [1.62, 0.867, 0.022], [0, 0, 0.105], materials.recess, 0.03);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.48, 0.775), new THREE.MeshBasicMaterial({ map: createMonitorTexture(), toneMapped: false }));
  screen.name = 'Monitor services display';
  screen.userData.keepSeparate = true;
  screen.position.set(0, 0.015, 0.124);
  monitor.add(screen);
  for (let i = 0; i < 4; i++) {
    cylinder(monitor, 0.023, 0.01, [-0.885, 0.255 - i * 0.17, 0], materials.silver, 'x');
    cylinder(monitor, 0.014, 0.016, [-0.892, 0.255 - i * 0.17, 0], materials.recess, 'x');
  }
  for (let i = 0; i < 8; i++) {
    box(monitor, [0.05, 0.011, 0.055], [-0.35 + i * 0.1, 0.501, 0], materials.recess, 0.003);
  }
  // The mounting shoe, neck and tilt pivot are all below the panel.
  box(monitor, [0.34, 0.08, 0.24], [0, -0.522, 0], materials.dark, 0.014);
  box(monitor, [0.18, 0.11, 0.15], [0, -0.602, 0], materials.body, 0.017);
  cylinder(monitor, 0.085, 0.34, [0, -0.649, 0], materials.dark, 'x');
  screw(monitor, [-0.179, -0.649, 0], 'x', 0.044);
  screw(monitor, [0.179, -0.649, 0], 'x', 0.044);
  // A side socket and right-angle plug let the cable clear the whole display.
  cylinder(monitor, 0.037, 0.024, [-0.89, -0.26, 0], materials.silver, 'x');
  cylinder(monitor, 0.031, 0.1, [-0.935, -0.26, 0], materials.rubber, 'x');
  box(monitor, [0.065, 0.095, 0.06], [-0.98, -0.29, 0], materials.rubber, 0.016);
  cylinder(monitor, 0.023, 0.085, [-0.98, -0.362, 0], materials.rubber, 'y');
  monitor.updateMatrix();
  const hinge = new THREE.Vector3(0, -0.649, 0).applyMatrix4(monitor.matrix).toArray() as Point;
  brace(parent, [-0.61, 3.49, 0], hinge, 0.135, 0.15);
  return new THREE.Vector3(-0.98, -0.406, 0).applyMatrix4(monitor.matrix).toArray() as Point;
}

function makeBattery(parent: THREE.Group) {
  const battery = new THREE.Group();
  battery.name = 'Camera battery assembly';
  battery.userData.keepSeparate = true;
  parent.add(battery);

  // V-mount, isolating rails, and a substantial rear battery module.
  box(battery, [0.17, 1.31, 1.05], [0.84, 2.02, 0], materials.metal, 0.04);
  box(battery, [0.13, 1.22, 1.1], [0.967, 2.02, 0], materials.rubber, 0.025);
  box(battery, [0.82, 1.65, 1.32], [1.405, 2.05, 0], materials.body, 0.105);
  box(battery, [0.64, 1.52, 1.33], [1.414, 2.05, 0], materials.dark, 0.059);

  for (const side of [-1, 1]) {
    box(battery, [0.667, 1.435, 0.035], [1.4, 2.05, side * 0.674], materials.body, 0.05);
    box(battery, [0.477, 1.065, 0.027], [1.4, 2.04, side * 0.697], materials.metal, 0.035);
    box(battery, [0.37, 0.955, 0.009], [1.4, 2.04, side * 0.714], materials.dark, 0.01);
    ventHoles(battery, [1.4, 2.04, side * 0.723], 6, 16, 0.052, 'z');
    for (const x of [1.105, 1.703]) {
      for (const y of [1.405, 2.696]) {
        screw(battery, [x, y, side * 0.7], 'z', 0.024);
      }
    }
    box(battery, [0.048, 1.18, 0.028], [1.025, 2.065, side * 0.588], materials.metal, 0.008);
  }
  box(battery, [0.036, 1.36, 1.14], [1.828, 2.05, 0], materials.body, 0.045);
  box(battery, [0.016, 1.045, 0.86], [1.852, 2.04, 0], materials.dark, 0.035);
  ventHoles(battery, [1.865, 2.04, 0], 13, 16, 0.052, 'x');
  box(battery, [0.3, 0.025, 0.5], [1.415, 2.88, 0], materials.metal, 0.02);
  box(battery, [0.12, 0.031, 0.27], [1.415, 2.902, 0], materials.dark, 0.014);
  cylinder(battery, 0.015, 0.006, [1.654, 1.935, 0.717], new THREE.MeshStandardMaterial({
    color: '#b6e3bb', emissive: '#598b62', emissiveIntensity: 0.5, roughness: 0.3,
  }), 'z');
}

function roundedSlot(width: number, height: number, radius: number) {
  const path = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
  return path;
}

function coolingCover(parent: THREE.Group, side: number) {
  const cover = new THREE.Group();
  cover.position.set(-0.135, 1.755, side * 0.747);
  if (side < 0) cover.rotation.y = Math.PI;
  const shape = roundedSlot(0.74, 0.56, 0.017);
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 10; column++) {
      const slot = roundedSlot(0.034, 0.14, 0.014);
      const points = slot.getPoints(5);
      const hole = new THREE.Path(points.map((point) => point.add(new THREE.Vector2(-0.315 + column * 0.07, -0.18 + row * 0.18))));
      shape.holes.push(hole);
    }
  }
  const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.015, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003, bevelSegments: 1, curveSegments: 4 }), materials.body);
  cover.add(panel);
  const backing = new THREE.Mesh(new THREE.PlaneGeometry(0.73, 0.55), new THREE.MeshBasicMaterial({ color: 0x020303 }));
  backing.position.z = -0.008;
  cover.add(backing);
  parent.add(cover);
}

function sidePlate(parent: THREE.Group, side: number) {
  const plate = new THREE.Group();
  plate.position.set(-0.035, 2.37, side * 0.68);
  if (side < 0) plate.rotation.y = Math.PI;
  const shape = new THREE.Shape();
  shape.moveTo(-0.50, -0.20); shape.lineTo(0.47, -0.20); shape.lineTo(0.50, -0.15);
  shape.lineTo(0.50, 0.115); shape.lineTo(0.385, 0.20); shape.lineTo(-0.44, 0.20);
  shape.lineTo(-0.50, 0.13); shape.closePath();
  const panel = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.007, bevelSegments: 2, steps: 1 }), materials.body);
  plate.add(panel);
  label(plate, 'R E D', 0.84, 0.227, [-0.005, 0.061, 0.039], { color: '#d0d1cb', outline: true, weight: 800, fillWidth: true });
  label(plate, 'DIGITAL CINEMA', 0.31, 0.038, [-0.22, -0.115, 0.04], { color: '#b5b8b1', weight: 500 });
  box(plate, [0.29, 0.067, 0.008], [0.198, -0.11, 0.04], materials.metal, 0.002);
  label(plate, '8K', 0.195, 0.048, [0.198, -0.11, 0.047], { color: '#d6be74', weight: 700 });
  parent.add(plate);
}

/** Cable fittings are modelled before routing the leads from their outer ends. */
function socket(parent: THREE.Group, position: Point, side = 1, red = false): Point {
  const [x, y, z] = position;
  torus(parent, 0.035, 0.01, position, materials.silver, 'z');
  cylinder(parent, 0.026, 0.09, [x, y, z + side * 0.044], materials.metal, 'z');
  cylinder(parent, 0.03, 0.074, [x, y, z + side * 0.101], red ? materials.red : materials.rubber, 'z');
  for (let i = 0; i < 3; i++) torus(parent, 0.03, 0.004, [x, y, z + side * (0.07 + i * 0.02)], materials.dark, 'z');
  return [x, y, z + side * 0.14];
}

function addWiring(parent: THREE.Group) {
  const a = socket(parent, [-0.49, 1.505, 0.72], 1, true);
  const b = socket(parent, [-0.51, 2.795, 0.58]);
  cable(parent, [a, [-0.67, 1.51, 0.95], [-0.88, 1.76, 1.00], [-0.90, 2.44, 0.95], [-0.75, 2.91, 0.79], b], 0.017, materials.rubber);

  const c = socket(parent, [0.489, 1.675, 0.72]);
  const d = socket(parent, [0.865, 2.29, 0.63]);
  cable(parent, [c, [0.63, 1.56, 0.94], [0.98, 1.70, 0.98], [1.01, 2.17, 0.87], d], 0.019, materials.rubber);

  const e = socket(parent, [0.487, 2.005, 0.73], 1, true);
  const f = socket(parent, [0.58, 2.81, 0.57]);
  cable(parent, [e, [0.69, 2.04, 0.98], [0.89, 2.51, 0.97], [0.79, 2.95, 0.74], f], 0.015, materials.rubber);

  const g = socket(parent, [-0.52, 2.815, -0.58], -1);
  const h = socket(parent, [0.86, 2.37, -0.62], -1, true);
  cable(parent, [g, [-0.67, 3.00, -0.83], [-0.14, 3.12, -0.86], [0.67, 2.99, -0.92], [1.04, 2.60, -0.9], h], 0.021, materials.rubber);

  // Short power jumpers and a tightly coiled red lead on the top accessory cage.
  cable(parent, [[-0.41, 2.86, 0.24], [-0.29, 2.99, 0.20], [0.1, 3.04, 0.29], [0.39, 2.86, 0.4]], 0.016, materials.rubber);
  const helix: THREE.Vector3[] = [];
  for (let i = 0; i <= 180; i++) {
    const t = i / 180;
    const a = t * Math.PI * 2 * 9;
    helix.push(new THREE.Vector3(-0.31 + t * 0.69, 2.934 + Math.sin(a) * 0.031, 0.34 + Math.cos(a) * 0.031));
  }
  parent.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 240, 0.01, 7, false), materials.red));
  cable(parent, [[-0.31, 2.934, 0.371], [-0.43, 2.925, 0.37], [-0.49, 2.87, 0.45]], 0.011, materials.red);
  cable(parent, [[0.38, 2.934, 0.371], [0.53, 2.94, 0.4], [0.6, 2.83, 0.46]], 0.011, materials.red);
  for (const x of [-0.49, 0.6]) {
    cylinder(parent, 0.027, 0.09, [x, 2.86, 0.46], materials.red, 'y');
    torus(parent, 0.027, 0.005, [x, 2.83, 0.46], materials.silver, 'y');
  }
  // A second power loop follows the battery mount down to the base rail.
  const p = socket(parent, [0.90, 1.56, -0.62], -1);
  cable(parent, [p, [1.12, 1.36, -0.92], [1.01, 1.05, -0.82], [0.56, 1.07, -0.72], [0.42, 1.38, -0.66]], 0.022, materials.rubber);
  for (const position of [[-0.76, 2.6, 0.78], [0.75, 2.55, 0.81], [-0.47, 2.94, -0.69]] as Point[]) {
    box(parent, [0.09, 0.037, 0.074], position, materials.dark, 0.008);
    screw(parent, [position[0], position[1] + 0.024, position[2]], 'y', 0.015);
  }
}

export function createCameraBody(): THREE.Group {
  const body = new THREE.Group();
  body.name = 'RED cinema camera chassis';

  box(body, [1.47, 1.38, 1.22], [0, 2.01, 0], materials.body, 0.07);
  box(body, [1.39, 1.265, 1.27], [-0.01, 2.015, 0], materials.dark, 0.06);
  box(body, [1.25, 0.09, 1.38], [0, 1.29, 0], materials.metal, 0.028);
  box(body, [1.42, 0.08, 1.25], [0, 2.735, 0], materials.metal, 0.022);
  box(body, [0.092, 1.26, 1.14], [-0.758, 2.04, 0], materials.metal, 0.027);

  for (const side of [-1, 1]) {
    const z = side * 0.66;
    // A shallow upper electronics panel and separate lower cooling cover.
    box(body, [1.12, 0.495, 0.034], [-0.03, 2.365, z], materials.dark, 0.03);
    sidePlate(body, side);
    box(body, [0.865, 0.68, 0.065], [-0.125, 1.755, z + side * 0.025], materials.body, 0.027);
    box(body, [0.71, 0.537, 0.01], [-0.135, 1.755, z + side * 0.063], materials.recess, 0.008);
    coolingCover(body, side);
    label(body, 'DSMC²', 0.34, 0.038, [0.302, 1.75, side * 0.751], { rotation: [0, side < 0 ? Math.PI : 0, Math.PI / 2], color: '#b8bab4' });
    for (const x of [-0.68, 0.665]) {
      box(body, [0.105, 1.34, 0.075], [x, 2.015, z], materials.metal, 0.022);
      for (const y of [1.415, 1.705, 2.025, 2.415, 2.605]) {
        screw(body, [x, y, z + side * 0.047], 'z', y === 1.415 || y === 2.605 ? 0.046 : 0.028);
      }
    }
    for (const x of [-0.528, 0.284]) {
      for (const y of [1.45, 2.055]) screw(body, [x, y, z + side * 0.067], 'z', 0.022);
    }
    // Stacked accessory sockets along the rear edge of the main module.
    box(body, [0.139, 0.66, 0.037], [0.487, 1.77, z + side * 0.025], materials.dark, 0.011);
    for (const y of [1.51, 1.675, 1.84, 2.005]) {
      torus(body, 0.036, 0.012, [0.489, y, z + side * 0.052], materials.silver, 'z');
      cylinder(body, 0.023, 0.019, [0.489, y, z + side * 0.057], materials.recess, 'z');
    }
    box(body, [0.12, 0.074, 0.012], [0.397, 2.154, z + side * 0.047], materials.dark, 0.005);
    cylinder(body, 0.024, 0.018, [0.397, 2.154, z + side * 0.061], materials.red, 'z');
    label(body, 'REC', 0.08, 0.03, [0.397, 2.101, side * 0.748], { rotation: [0, side < 0 ? Math.PI : 0, 0], weight: 500 });
    label(body, 'SDI', 0.063, 0.026, [0.487, 2.065, side * 0.74], { rotation: [0, side < 0 ? Math.PI : 0, 0] });
  }

  // Raised accessory cage, exposed top fixing screws, and red release pins.
  for (const side of [-1, 1]) {
    box(body, [1.59, 0.116, 0.118], [0.025, 2.823, side * 0.585], materials.metal, 0.022);
    for (let i = 0; i < 8; i++) {
      cylinder(body, 0.025, 0.008, [-0.58 + i * 0.172, 2.886, side * 0.585], materials.recess, 'y');
    }
    for (const x of [-0.63, 0.67]) {
      screw(body, [x, 2.823, side * 0.653], 'z', 0.04);
    }
    cylinder(body, 0.042, 0.125, [0.69, 2.383, side * 0.709], materials.red, 'y');
    cylinder(body, 0.049, 0.025, [0.69, 2.462, side * 0.709], materials.metal, 'y');
  }
  box(body, [0.765, 0.077, 0.585], [-0.075, 2.79, 0], materials.body, 0.018);
  for (const x of [-0.36, 0.22]) {
    for (const z of [-0.21, 0.21]) screw(body, [x, 2.836, z], 'y', 0.027);
  }

  // Open, angled handle supports retain the recognizable cinema-rig silhouette.
  for (const z of [-0.195, 0.195]) {
    brace(body, [-0.46, 2.833, z], [-0.69, 3.28, z], 0.105, 0.14);
    brace(body, [0.59, 2.833, z], [0.81, 3.28, z], 0.125, 0.14);
  }
  handlePlate(body, [0.065, 3.31, 0]);
  box(body, [1.72, 0.047, 0.28], [0.065, 3.455, 0], materials.dark, 0.022);
  for (let i = 0; i < 7; i++) {
    cylinder(body, 0.026, 0.008, [-0.51 + i * 0.185, 3.483, 0], materials.recess, 'y');
  }
  for (const x of [-0.47, 0.60]) {
    cylinder(body, 0.085, 0.56, [x, 2.865, 0], materials.dark, 'z');
    screw(body, [x, 2.865, 0.294], 'z', 0.045);
  }
  const monitorCableStart = makeMonitor(body);
  makeBattery(body);

  // Hardware sockets and naturally hanging cables add depth without lettering.
  cylinder(body, 0.069, 0.143, [0.881, 2.415, 0.635], materials.metal, 'z');
  cylinder(body, 0.044, 0.142, [0.881, 2.415, 0.758], materials.rubber, 'z');
  cylinder(body, 0.043, 0.096, [-0.62, 2.72, 0.66], materials.red, 'z');
  cylinder(body, 0.043, 0.094, [0.42, 2.755, 0.637], materials.red, 'z');
  cable(body, [[-0.62, 2.72, 0.72], [-0.47, 2.68, 0.78], [-0.07, 2.725, 0.83], [0.24, 2.814, 0.79], [0.42, 2.755, 0.71]], 0.017, materials.red);
  cable(body, [monitorCableStart, [0.14, 3.53, 0.89], [-0.37, 3.27, 0.98], [-0.92, 2.76, 0.94], [-0.80, 2.11, 0.95], [-0.34, 2.01, 0.995], [0.27, 2.30, 0.95], [0.53, 3.03, 0.71], [0.881, 2.415, 0.838]], 0.022, materials.rubber);
  cable(body, [[-0.51, 2.775, -0.59], [-0.46, 3.025, -0.38], [0.06, 3.073, 0.11], [0.48, 2.895, 0.26], [0.68, 2.43, 0.65]], 0.017, materials.rubber);
  box(body, [0.079, 0.21, 0.11], [0.859, 1.586, 0.752], materials.red, 0.016);
  cable(body, [[0.875, 1.692, 0.766], [0.885, 1.37, 0.856], [1.063, 1.09, 0.812], [1.159, 1.11, 0.69], [1.045, 1.47, 0.576]], 0.024, materials.rubber);
  addWiring(body);

  return body;
}
