import * as THREE from "three";
import { quadTransform } from "./scroll-story";

/** A viewport-shaped area inside the physical display (letterboxed if needed). */
export function monitorRegion(aspect: number) {
  const height = Math.min(0.775, 1.48 / aspect);
  return { width: height * aspect, height };
}

export function projectScreenPortal(
  screen: THREE.Mesh,
  camera: THREE.PerspectiveCamera,
  portal: HTMLElement,
  width: number,
  height: number,
) {
  const region = monitorRegion(width / height);
  const center = screen.getWorldPosition(new THREE.Vector3());
  const normal = new THREE.Vector3(0, 0, 1).transformDirection(screen.matrixWorld);
  const facing = normal.dot(camera.position.clone().sub(center)) > 0.02;
  const corners = [[-1,1],[1,1],[1,-1],[-1,-1]].map(([x,y]) => {
    const point = new THREE.Vector3(x * region.width / 2, y * region.height / 2, 0)
      .applyMatrix4(screen.matrixWorld).project(camera);
    return [(point.x + 1) * width / 2, (1 - point.y) * height / 2] as const;
  });
  if (facing && corners.every(point => point.every(Number.isFinite))) {
    const matrix = quadTransform(corners, width, height);
    portal.style.transform = `matrix3d(${matrix.join(",")})`;
    portal.style.visibility = "visible";
  } else {
    portal.style.visibility = "hidden";
  }
}
