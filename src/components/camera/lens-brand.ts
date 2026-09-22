import * as THREE from "three";

function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  y: number,
  tracking: number,
) {
  const letters = [...text];
  const widths = letters.map((letter) => ctx.measureText(letter).width);
  const width = widths.reduce((total, value) => total + value, 0) + tracking * (letters.length - 1);
  let x = centerX - width / 2;
  for (let i = 0; i < letters.length; i += 1) {
    ctx.fillText(letters[i], x, y);
    x += widths[i] + tracking;
  }
}

/** Reflect the original emblem's ink in the glass, without its paper backing. */
export async function createLensBrandTexture(signal: AbortSignal) {
  const response = await fetch("/logo.png", { signal });
  if (!response.ok) throw new Error("The Star Production House logo could not be loaded.");
  const source = await createImageBitmap(await response.blob());
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    source.close();
    throw new Error("Canvas is required for the lens reflection.");
  }

  const ink = document.createElement("canvas");
  ink.width = source.width;
  ink.height = source.height;
  const inkContext = ink.getContext("2d");
  if (!inkContext) {
    source.close();
    throw new Error("Canvas is required for the lens emblem.");
  }
  inkContext.drawImage(source, 0, 0);
  source.close();

  // Recover coverage from the white background, including antialiased edges.
  // The red channel difference distinguishes the brush stroke from black ink.
  const pixels = inkContext.getImageData(0, 0, ink.width, ink.height);
  for (let offset = 0; offset < pixels.data.length; offset += 4) {
    if (pixels.data[offset + 3] === 0) continue;
    const red = pixels.data[offset];
    const green = pixels.data[offset + 1];
    const blue = pixels.data[offset + 2];
    const coverage = (255 - Math.min(red, green, blue)) / 255;
    const accent = Math.min(1, Math.max(0, (red - Math.max(green, blue)) / Math.max(1, coverage * 190)));
    pixels.data[offset] = Math.round(208 + accent * 7);
    pixels.data[offset + 1] = Math.round(201 - accent * 124);
    pixels.data[offset + 2] = Math.round(185 - accent * 124);
    pixels.data[offset + 3] = Math.round(pixels.data[offset + 3] * coverage);
  }
  inkContext.putImageData(pixels, 0, 0);

  const emblemSize = 304;
  const scale = Math.min(emblemSize / ink.width, emblemSize / ink.height);
  const imageWidth = ink.width * scale;
  const imageHeight = ink.height * scale;
  ctx.drawImage(ink, 512 - imageWidth / 2, 236 + (emblemSize - imageHeight) / 2, imageWidth, imageHeight);

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#d0c9b9";
  ctx.font = "500 36px Arial, Helvetica, sans-serif";
  drawTrackedText(ctx, "STAR PRODUCTION HOUSE", 512, 605, 3.2);
  ctx.fillStyle = "#e1e5db";
  ctx.font = "500 30px Arial, Helvetica, sans-serif";
  drawTrackedText(ctx, "COMMERCIALS & 4K CINEMA", 512, 666, 2.4);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.name = "Star Production House lens reflection";
  return texture;
}
