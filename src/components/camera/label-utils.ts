import * as THREE from "three";
import type { Point } from "./model-utils";

type LabelOptions = {
  color?: string;
  fontSize?: number;
  font?: string;
  weight?: number;
  outline?: boolean;
  rotation?: Point;
  background?: string;
  fillWidth?: boolean;
};

/** Printed markings sit on the physical part, never in the viewer UI. */
export function label(
  parent: THREE.Object3D,
  text: string,
  width: number,
  height: number,
  position: Point,
  options: LabelOptions = {},
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = Math.max(64, Math.round(1024 * height / width));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is required for camera markings");
  if (options.background) {
    context.fillStyle = options.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  const fontSize = options.fontSize ?? Math.round(canvas.height * 0.76);
  context.font = `${options.weight ?? 600} ${fontSize}px ${options.font ?? "Arial, Helvetica, sans-serif"}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const availableWidth = canvas.width * 0.94;
  const textWidth = context.measureText(text).width;
  context.translate(canvas.width / 2, canvas.height / 2 + fontSize * 0.04);
  context.scale(options.fillWidth ? availableWidth / textWidth : Math.min(1, availableWidth / textWidth), 1);
  context.fillStyle = options.color ?? "#dfdfd9";
  context.strokeStyle = options.color ?? "#dfdfd9";
  if (options.outline) {
    context.lineWidth = Math.max(1.5, fontSize * 0.022);
    context.strokeText(text, 0, 0);
  } else context.fillText(text, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.025,
    depthWrite: false,
    roughness: 0.62,
    metalness: 0.12,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(...position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  mesh.name = `Marking: ${text}`;
  parent.add(mesh);
  return mesh;
}
