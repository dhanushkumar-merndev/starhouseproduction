import * as THREE from "three";
import { box, cylinder, materials, screw, torus } from "./model-utils";
import { createOpticalElement } from "./camera-optics";

const CENTER_Y = 2.03;

/** A marked cinema prime with a light-tight, flared carbon matte box. */
export function createCameraLens(brandTexture: THREE.Texture): THREE.Group {
  const lens = new THREE.Group();
  lens.name = "Cinema lens and matte box";

  const satin = new THREE.MeshStandardMaterial({
    color: 0x252627,
    metalness: 0.78,
    roughness: 0.29,
  });
  const engraved = new THREE.MeshStandardMaterial({
    color: 0x090b0c,
    metalness: 0.35,
    roughness: 0.43,
  });
  const gold = new THREE.MeshStandardMaterial({
    color: 0xb49b29,
    metalness: 0.25,
    roughness: 0.43,
  });

  const barrel = (x: number, radius: number, length: number, material: THREE.Material = satin) =>
    cylinder(lens, radius, length, [x, CENTER_Y, 0], material, "x");

  // The bayonet, retaining flange, and stepped iris housing remain separate
  // surfaces so that the silver seams catch the studio lighting.
  barrel(-0.83, 0.405, 0.22, materials.dark);
  barrel(-0.939, 0.474, 0.055, materials.silver);
  barrel(-0.981, 0.483, 0.035, satin);
  barrel(-1.07, 0.469, 0.15, materials.body);
  barrel(-1.2, 0.489, 0.125, satin);
  gear(lens, -1.276, 0.51, 0.095, 112, materials.dark);
  barrel(-1.364, 0.509, 0.077, engraved);
  barrel(-1.446, 0.534, 0.105, satin);
  gear(lens, -1.53, 0.555, 0.09, 120, materials.dark);
  barrel(-1.667, 0.562, 0.185, satin);
  barrel(-1.801, 0.59, 0.066, engraved);
  gear(lens, -1.875, 0.619, 0.11, 144, materials.dark);
  barrel(-2.231, 0.619, 0.6, satin);
  barrel(-2.559, 0.647, 0.08, materials.dark);
  barrel(-2.616, 0.659, 0.039, satin);

  // Fine machined edges at the shoulders of the focus and aperture rings.
  for (const [x, radius] of [
    [-0.908, 0.424],
    [-1.007, 0.471],
    [-1.149, 0.482],
    [-1.385, 0.514],
    [-1.465, 0.536],
    [-1.582, 0.557],
    [-1.761, 0.572],
    [-1.814, 0.605],
    [-1.943, 0.621],
    [-2.501, 0.624],
    [-2.591, 0.655],
  ]) {
    torus(lens, radius, 0.009, [x, CENTER_Y, 0], materials.metal, "x");
  }

  // Broad scallops on the focus grip, inset into the central smooth band.
  const gripGeometry = new THREE.CapsuleGeometry(0.026, 0.062, 3, 8);
  const gripInserts = new THREE.InstancedMesh(gripGeometry, engraved, 16);
  const pose = new THREE.Object3D();
  for (let index = 0; index < 16; index += 1) {
    const angle = (index / 16) * Math.PI * 2;
    pose.position.set(-1.669, CENTER_Y + Math.cos(angle) * 0.561, Math.sin(angle) * 0.561);
    pose.rotation.set(angle, 0, Math.PI / 2);
    pose.scale.set(1, 1, 0.48);
    pose.updateMatrix();
    gripInserts.setMatrixAt(index, pose.matrix);
  }
  gripInserts.castShadow = true;
  lens.add(gripInserts);

  calibrationTicks(lens, -1.12, 0.472, 28, gold);
  calibrationTicks(lens, -1.985, 0.621, 42, gold);
  createBarrelMarkings(lens);
  for (let index = 0; index < 6; index += 1) {
    const angle = (index / 6) * Math.PI * 2;
    screw(lens, [-0.972, CENTER_Y + Math.cos(angle) * 0.437, Math.sin(angle) * 0.437], "x", 0.017);
  }

  // Concentric open rings recess the optic; unlike a capped cylinder these
  // leave the optical glass visible from a front or three-quarter angle.
  annulus(lens, -2.672, 0.624, 0.549, 0.084, materials.dark);
  annulus(lens, -2.701, 0.576, 0.512, 0.045, satin);
  annulus(lens, -2.727, 0.533, 0.458, 0.026, materials.dark);
  for (const radius of [0.604, 0.583, 0.548, 0.521, 0.488, 0.469]) {
    torus(lens, radius, 0.004, [-2.746, CENTER_Y, 0], satin, "x");
  }
  // An absorbing liner closes the barrel behind the optical element.
  annulus(lens, -2.69, 0.472, 0.431, 0.1, materials.recess);
  lens.add(createOpticalElement(CENTER_Y, brandTexture));
  createMatteBox(lens);

  return lens;
}

function gear(
  parent: THREE.Group,
  x: number,
  radius: number,
  width: number,
  count: number,
  material: THREE.Material,
) {
  cylinder(parent, radius - 0.012, width, [x, CENTER_Y, 0], material, "x");
  const teeth = new THREE.InstancedMesh(
    new THREE.BoxGeometry(width, 0.024, (Math.PI * radius * 1.14) / count),
    material,
    count,
  );
  const transform = new THREE.Object3D();
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    transform.position.set(x, CENTER_Y + Math.cos(angle) * radius, Math.sin(angle) * radius);
    transform.rotation.x = angle;
    transform.updateMatrix();
    teeth.setMatrixAt(index, transform.matrix);
  }
  teeth.castShadow = true;
  teeth.receiveShadow = true;
  parent.add(teeth);
  torus(parent, radius - 0.003, 0.009, [x - width * 0.55, CENTER_Y, 0], materials.metal, "x");
  torus(parent, radius - 0.003, 0.009, [x + width * 0.55, CENTER_Y, 0], materials.metal, "x");
}

function calibrationTicks(
  parent: THREE.Group,
  x: number,
  radius: number,
  count: number,
  material: THREE.Material,
) {
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.026, 0.0025, 0.008), material, count);
  const transform = new THREE.Object3D();
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    transform.position.set(x, CENTER_Y + Math.cos(angle) * radius, Math.sin(angle) * radius);
    transform.rotation.x = angle;
    transform.scale.x = index % 5 === 0 ? 1.6 : index % 2 === 0 ? 1 : 0.65;
    transform.updateMatrix();
    ticks.setMatrixAt(index, transform.matrix);
  }
  parent.add(ticks);
}

function decalMaterial(canvas: HTMLCanvasElement) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    toneMapped: false,
  });
}

function curvedDecal(
  parent: THREE.Group,
  canvas: HTMLCanvasElement,
  x: number,
  radius: number,
  width: number,
  angularHeight: number,
  side = 1,
  centerAngle = 0,
) {
  const geometry = new THREE.PlaneGeometry(width, angularHeight, 1, 80);
  const positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i += 1) {
    const angle = centerAngle + positions.getY(i) / radius;
    positions.setXYZ(i, x + positions.getX(i) * side, CENTER_Y + Math.sin(angle) * radius, Math.cos(angle) * radius * side);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, decalMaterial(canvas));
  parent.add(mesh);
}

function createBarrelMarkings(parent: THREE.Group) {
  const badge = document.createElement("canvas");
  badge.width = 1024;
  badge.height = 1400;
  const ctx = badge.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#e7e7df";
  ctx.font = '600 54px Arial, sans-serif';
  ctx.fillText("PL", 512, 105);
  ctx.strokeStyle = "#e7e7df";
  ctx.lineWidth = 5;
  ctx.strokeRect(455, 71, 114, 61);
  ctx.font = '700 132px Arial, sans-serif';
  ctx.fillText("FUJINON", 512, 286);
  ctx.fillStyle = "#e6d817";
  ctx.font = '600 400px Arial, sans-serif';
  ctx.fillText("75", 512, 577);
  ctx.fillStyle = "#e4e4dc";
  ctx.font = '500 107px Arial, sans-serif';
  ctx.fillText("T2.9", 512, 842);
  ctx.font = '400 92px Arial, sans-serif';
  ctx.fillText("28–100", 512, 1011);
  ctx.font = '500 49px Arial, sans-serif';
  ctx.fillText("PREMIER", 512, 1241);
  for (const side of [-1, 1]) curvedDecal(parent, badge, -2.247, 0.622, 0.506, 0.69, side, -0.06);

  numberedRing(parent, -2.028, 0.623, 0.065, ["2", "2.5", "3", "3.5", "4", "5", "6", "8", "10", "15", "20", "30", "60", "100", "∞"]);
  numberedRing(parent, -1.1, 0.473, 0.063, ["2.9", "4", "5.6", "8", "11", "16", "22", "2.9", "4", "5.6", "8", "11", "16", "22"]);
  numberedRing(parent, -1.425, 0.537, 0.046, ["28", "35", "50", "75", "100", "28", "35", "50", "75", "100"], "#ece8dd");
}

function numberedRing(
  parent: THREE.Group,
  x: number,
  radius: number,
  width: number,
  numbers: string[],
  color = "#d7c820",
) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 4096;
  const ctx = canvas.getContext("2d")!;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = '600 130px Arial, sans-serif';
  const step = canvas.height / numbers.length;
  for (let index = 0; index < numbers.length; index += 1) {
    const y = (index + 0.5) * step;
    ctx.fillText(numbers[index], 128, y, 230);
    ctx.fillRect(112, y + step * 0.33, 70, 7);
    ctx.fillRect(155, y + step * 0.48, 28, 5);
  }
  for (const side of [-1, 1]) curvedDecal(parent, canvas, x, radius, width, Math.PI * radius, side);
}

function createMatteBoxInsignia(parent: THREE.Group) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.strokeStyle = "#c9cdcb";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(254, 95);
  ctx.bezierCurveTo(465, 151, 478, 279, 478, 490);
  ctx.bezierCurveTo(477, 696, 400, 839, 254, 918);
  ctx.bezierCurveTo(67, 828, 31, 693, 31, 490);
  ctx.bezierCurveTo(31, 273, 70, 177, 254, 95);
  ctx.stroke();
  ctx.fillStyle = "#f1f1e9";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = '700 83px Arial, sans-serif';
  ctx.fillText("FUJINON", 254, 484, 461);
  ctx.font = '500 28px Arial, sans-serif';
  ctx.fillText("CINE LENS", 254, 553);
  ctx.lineWidth = 4;
  ctx.strokeRect(205, 579, 99, 19);
  for (const side of [-1, 1]) {
    const geometry = new THREE.PlaneGeometry(0.272, 0.83);
    const positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index += 1) {
      const x = -2.85 + positions.getX(index) * side;
      // Follow the actual exterior panel, which begins 0.025 behind the rim.
      const z = (1.125 - ((x + 3.015) / 0.33) * 0.26 + 0.009) * side;
      positions.setXYZ(index, x, CENTER_Y + positions.getY(index), z);
    }
    geometry.computeVertexNormals();
    parent.add(new THREE.Mesh(geometry, decalMaterial(canvas)));
  }
}

function annulus(
  parent: THREE.Group,
  x: number,
  outerRadius: number,
  innerRadius: number,
  depth: number,
  material: THREE.Material,
) {
  const profile = [
    new THREE.Vector2(innerRadius, -depth / 2),
    new THREE.Vector2(outerRadius, -depth / 2),
    new THREE.Vector2(outerRadius, depth / 2),
    new THREE.Vector2(innerRadius, depth / 2),
    new THREE.Vector2(innerRadius, -depth / 2),
  ];
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(profile, 96), material);
  mesh.rotation.z = Math.PI / 2;
  mesh.position.set(x, CENTER_Y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function createMatteBox(parent: THREE.Group) {
  const hood = new THREE.Group();
  hood.name = "Open carbon fiber matte box";
  parent.add(hood);
  const frontX = -3.04;
  const rearX = -2.685;
  const frontW = 2.25;
  const frontH = 1.45;
  const rearW = 1.73;
  const rearH = 1.34;

  frame(hood, frontX, frontW, frontH, 1.825, 1.17, 0.045, materials.carbon);
  frame(hood, frontX - 0.02, frontW + 0.022, frontH + 0.022, frontW - 0.03, frontH - 0.03, 0.03, materials.dark);
  frame(hood, frontX + 0.026, 1.858, 1.202, 1.793, 1.14, 0.038, materials.dark);
  frame(hood, rearX, rearW, rearH, 1.51, 1.215, 0.06, materials.dark);

  // Four sloping exterior faces and interior baffles end in a light-tight
  // rectangular donut. Its circular opening wraps tightly around the lens.
  taperedSides(hood, frontX + 0.025, rearX, frontW, frontH, rearW, rearH, materials.carbon);
  taperedSides(
    hood, frontX + 0.011, rearX - 0.015, 1.81, 1.162, 1.51, 1.215,
    new THREE.MeshBasicMaterial({ color: 0x101112, toneMapped: false }),
  );
  const backingShape = new THREE.Shape();
  roundedRectangle(backingShape, 1.77, 1.34, 0.028);
  const circularOpening = new THREE.Path();
  circularOpening.absarc(0, 0, 0.591, 0, Math.PI * 2, true);
  backingShape.holes.push(circularOpening);
  const backing = new THREE.Mesh(
    new THREE.ExtrudeGeometry(backingShape, { depth: 0.026, bevelEnabled: false, curveSegments: 64 }),
    new THREE.MeshBasicMaterial({ color: 0x090a0b, side: THREE.DoubleSide, toneMapped: false }),
  );
  backing.rotation.y = Math.PI / 2;
  backing.position.set(-2.745, CENTER_Y, 0);
  hood.add(backing);
  createMatteBoxInsignia(hood);

  for (const z of [-0.993, 0.993]) {
    for (const y of [-0.636, 0.636]) {
      screw(hood, [frontX - 0.033, CENTER_Y + y, z], "x", 0.022);
    }
  }
  for (const z of [-1.16, 1.16]) {
    for (const y of [-0.706, 0.706]) {
      cylinder(hood, 0.05, 0.09, [frontX + 0.07, CENTER_Y + y, z], materials.dark, "x");
      screw(hood, [frontX + 0.017, CENTER_Y + y, z], "x", 0.028);
    }
    cylinder(hood, 0.023, 1.23, [frontX + 0.101, CENTER_Y, z * 0.977], materials.metal, "y");
    for (const y of [-0.42, 0.42]) {
      box(hood, [0.095, 0.20, 0.057], [frontX + 0.1, CENTER_Y + y, z * 0.977], materials.dark, 0.012);
    }
  }

  // Two filter trays, upper hinge rail, knurled retaining knobs, and clamp.
  for (const x of [-2.765, -2.667]) {
    box(hood, [0.055, 0.056, 1.76], [x, CENTER_Y + 0.694, 0], materials.dark, 0.014);
    box(hood, [0.075, 0.035, 0.64], [x, CENTER_Y + 0.737, 0], materials.metal, 0.009);
    for (const z of [-0.675, 0.675]) {
      cylinder(hood, 0.025, 0.084, [x, CENTER_Y + 0.756, z], materials.silver, "y");
      cylinder(hood, 0.047, 0.027, [x, CENTER_Y + 0.796, z], materials.dark, "y");
      torus(hood, 0.038, 0.006, [x, CENTER_Y + 0.808, z], materials.metal, "y");
    }
  }
  cylinder(hood, 0.028, 2.04, [-2.906, CENTER_Y + 0.753, 0], materials.dark, "z");
  for (const z of [-1.013, 1.013]) {
    cylinder(hood, 0.041, 0.025, [-2.906, CENTER_Y + 0.753, z], materials.metal, "z");
  }
  box(hood, [0.31, 0.13, 0.24], [-2.679, CENTER_Y - 0.751, 0], materials.dark, 0.02);
  cylinder(hood, 0.05, 0.1, [-2.705, CENTER_Y - 0.839, 0], materials.metal, "y");
  box(hood, [0.23, 0.055, 0.35], [-2.705, CENTER_Y - 0.896, 0], materials.dark, 0.01);
}

function roundedRectangle(path: THREE.Path, width: number, height: number, radius: number) {
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
}

function frame(
  parent: THREE.Group,
  x: number,
  width: number,
  height: number,
  innerWidth: number,
  innerHeight: number,
  depth: number,
  material: THREE.Material,
) {
  const shape = new THREE.Shape();
  roundedRectangle(shape, width, height, 0.045);
  const hole = new THREE.Path();
  roundedRectangle(hole, innerWidth, innerHeight, 0.017);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.004,
    bevelThickness: 0.004,
    curveSegments: 5,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.y = Math.PI / 2;
  mesh.position.set(x, CENTER_Y, 0);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}

function taperedSides(
  parent: THREE.Group,
  frontX: number,
  rearX: number,
  frontWidth: number,
  frontHeight: number,
  rearWidth: number,
  rearHeight: number,
  material: THREE.Material,
) {
  const front = [
    [frontX, CENTER_Y - frontHeight / 2, -frontWidth / 2],
    [frontX, CENTER_Y + frontHeight / 2, -frontWidth / 2],
    [frontX, CENTER_Y + frontHeight / 2, frontWidth / 2],
    [frontX, CENTER_Y - frontHeight / 2, frontWidth / 2],
  ];
  const rear = [
    [rearX, CENTER_Y - rearHeight / 2, -rearWidth / 2],
    [rearX, CENTER_Y + rearHeight / 2, -rearWidth / 2],
    [rearX, CENTER_Y + rearHeight / 2, rearWidth / 2],
    [rearX, CENTER_Y - rearHeight / 2, rearWidth / 2],
  ];
  const positions: number[] = [];
  const uv: number[] = [];
  const indices: number[] = [];
  for (let side = 0; side < 4; side += 1) {
    const next = (side + 1) % 4;
    positions.push(...front[side], ...front[next], ...rear[next], ...rear[side]);
    uv.push(0, 0, 1, 0, 1, 0.35, 0, 0.35);
    const offset = side * 4;
    indices.push(offset, offset + 1, offset + 2, offset, offset + 2, offset + 3);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const doubleSided = material.clone();
  doubleSided.side = THREE.DoubleSide;
  const mesh = new THREE.Mesh(geometry, doubleSided);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
}
