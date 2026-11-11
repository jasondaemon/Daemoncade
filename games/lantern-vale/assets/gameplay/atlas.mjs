import manifest from './manifest.mjs';
/** Local raster atlas adapter. Coordinates and sizes are logical canvas pixels. */
export function frameAt(manifest, name, elapsedMs = 0) {
  const animation = manifest.animations[name];
  if (!animation) return manifest.frames[name] || null;
  const total = animation.durationsMs.reduce((a, b) => a + b, 0);
  let t = Math.max(0, Number.isFinite(elapsedMs) ? elapsedMs : 0);
  if (animation.loop) t %= total;
  else if (t >= total) return manifest.frames[animation.frames.at(-1)];
  for (let i = 0; i < animation.frames.length; i++) {
    if (t < animation.durationsMs[i]) return manifest.frames[animation.frames[i]];
    t -= animation.durationsMs[i];
  }
  return null;
}

export function drawFrame(context, image, manifest, name, x, y, elapsedMs = 0, scale = 1) {
  const frame = frameAt(manifest, name, elapsedMs);
  if (!frame) return false;
  const [sx, sy, width, height] = frame.rect;
  const [px, py] = frame.pivot;
  context.imageSmoothingEnabled = false;
  context.drawImage(image, sx, sy, width, height,
    Math.round(x - px * scale), Math.round(y - py * scale), width * scale, height * scale);
  return true;
}

/** Keep this promise outside the render loop. Image decoding completes before drawing. */
export async function loadAtlas() {
  const manifestURL = new URL('./atlas.json', import.meta.url);
  const image = new Image();
  image.src = new URL(manifest.image, manifestURL).href;
  await image.decode();
  if (image.naturalWidth !== manifest.imageSize[0] || image.naturalHeight !== manifest.imageSize[1]) {
    throw new Error('Gameplay atlas dimensions do not match manifest');
  }
  return { manifest, image, draw: (context, name, x, y, elapsedMs = 0, scale = 1) =>
    drawFrame(context, image, manifest, name, x, y, elapsedMs, scale) };
}
