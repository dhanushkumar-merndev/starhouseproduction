import * as THREE from "three";

/** A framed camera feed and on-monitor controls, kept inside the display glass. */
export function createMonitorTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 600;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#0c1010";
  ctx.fillRect(0, 0, 1024, 600);
  const light = ctx.createLinearGradient(0, 60, 960, 500);
  light.addColorStop(0, "#302622");
  light.addColorStop(0.5, "#ac6643");
  light.addColorStop(1, "#2e2925");
  ctx.fillStyle = light;
  ctx.fillRect(34, 72, 956, 452);
  // A warm set with practical lights and a receding architectural interior.
  ctx.fillStyle = "#352d28";
  for (let x = 70; x < 1024; x += 150) ctx.fillRect(x, 72, 30, 452);
  ctx.fillStyle = "#b0734b";
  ctx.fillRect(330, 130, 300, 330);
  ctx.fillStyle = "#201f1c";
  ctx.fillRect(361, 157, 244, 303);
  ctx.fillStyle = "#774931";
  ctx.beginPath(); ctx.moveTo(34, 520); ctx.lineTo(1024, 520); ctx.lineTo(640, 392); ctx.lineTo(355, 392); ctx.closePath(); ctx.fill();
  for (const x of [169, 766, 917]) {
    const lamp = ctx.createRadialGradient(x, 198, 0, x, 198, 88);
    lamp.addColorStop(0, "#ffdf95bb"); lamp.addColorStop(0.16, "#efbd7255"); lamp.addColorStop(1, "#efbd7200");
    ctx.fillStyle = lamp; ctx.fillRect(x - 90, 105, 180, 190);
    ctx.fillStyle = "#e7c38d"; ctx.fillRect(x - 9, 176, 18, 33);
  }
  ctx.fillStyle = "#292721";
  ctx.beginPath(); ctx.ellipse(503, 277, 27, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(463, 327); ctx.quadraticCurveTo(501, 303, 542, 327); ctx.lineTo(557, 446); ctx.lineTo(455, 446); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#e6d9c17a"; ctx.lineWidth = 1.5;
  ctx.strokeRect(94, 101, 842, 386);
  ctx.beginPath(); ctx.moveTo(498, 289); ctx.lineTo(518, 289); ctx.moveTo(508, 279); ctx.lineTo(508, 299); ctx.stroke();
  ctx.fillStyle = "#ddddce";
  ctx.font = '600 22px monospace';
  ctx.fillText("23.98 FPS", 30, 39); ctx.fillText("180°", 222, 39); ctx.fillText("ISO 800", 385, 39); ctx.fillText("5600 K", 579, 39);
  ctx.fillStyle = "#c62726"; ctx.beginPath(); ctx.arc(807, 32, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillText("REC", 826, 39);
  ctx.strokeStyle = "#b8c5af"; ctx.lineWidth = 2; ctx.strokeRect(925, 20, 55, 23); ctx.fillStyle = "#b8c5af"; ctx.fillRect(929, 24, 41, 15);
  ctx.fillStyle = "#ddddce"; ctx.font = '21px monospace'; ctx.fillText("A001_C003", 30, 564); ctx.fillText("01:24:08:16", 425, 564); ctx.fillText("8K  17:9", 815, 564);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}
