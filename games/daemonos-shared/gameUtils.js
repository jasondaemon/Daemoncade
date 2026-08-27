export const GAMEUTILS_VERSION = "2026-02-08-smart-scaling-v2";

export function createGameSurface({
  baseWidth,
  baseHeight,
  className = "game-canvas",
  fit = "contain",
  pixelArt = true,
  scaleMode = "smart",
} = {}) {
  const content = document.createElement("div");
  content.className = "game-shell";
  content.style.position = "relative";
  content.style.height = "100%";
  content.style.width = "100%";
  content.style.overflow = "hidden";
  content.style.display = "flex";
  content.style.alignItems = "center";
  content.style.justifyContent = "center";

  const surface = document.createElement("div");
  surface.className = "game-surface";
  surface.style.position = "relative";
  surface.style.display = "block";
  content.appendChild(surface);

  const canvas = document.createElement("canvas");
  canvas.className = pixelArt ? `${className} pixel-canvas` : className;
  canvas.style.display = "block";
  if (pixelArt) {
    canvas.style.imageRendering = "pixelated";
  }
  surface.appendChild(canvas);

  const debugEnabled =
    window.location.search.includes("debugGameLayout=1") ||
    localStorage.getItem("debugGameLayout") === "1";
  const debug = debugEnabled ? document.createElement("div") : null;
  if (debug) {
    debug.className = "game-debug";
    content.appendChild(debug);
  }

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = !pixelArt ? true : false;
  const view = {
    scale: 1,
    scaleX: 1,
    scaleY: 1,
    ox: 0,
    oy: 0,
    dpr: 1,
    baseWidth,
    baseHeight,
    fit,
    pixelArt,
    scaleMode,
    rawScale: 1,
    sx: 1,
    sy: 1,
  };

  const updateViewport = () => {
    const rect = content.getBoundingClientRect();
    const rawDpr = window.devicePixelRatio || 1;
    const effectiveDpr = pixelArt ? Math.max(1, Math.round(rawDpr)) : rawDpr;
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    view.dpr = effectiveDpr;
    const rawScale = Math.min(cssW / baseWidth, cssH / baseHeight);
    view.rawScale = rawScale;
    let appliedScale = rawScale;
    if (pixelArt && (scaleMode === "integer" || scaleMode === "smart")) {
      const windowNode = content.closest(".window");
      const isResizing = windowNode?.classList.contains("resizing");
      if (isResizing) {
        appliedScale = rawScale;
      } else if (rawScale < 1) {
        appliedScale = rawScale;
      } else {
        const nearest = Math.round(rawScale);
        const snapTol = 0.08;
        const fitsW = nearest * baseWidth <= cssW + 0.5;
        const fitsH = nearest * baseHeight <= cssH + 0.5;
        if (Math.abs(rawScale - nearest) <= snapTol && fitsW && fitsH) {
          appliedScale = nearest;
        } else {
          appliedScale = rawScale;
        }
      }
    }
    view.scale = appliedScale;
    view.scaleX = appliedScale;
    view.scaleY = appliedScale;

    const scaledW = Math.round(baseWidth * appliedScale);
    const scaledH = Math.round(baseHeight * appliedScale);
    surface.style.width = `${scaledW}px`;
    surface.style.height = `${scaledH}px`;
    canvas.style.width = `${scaledW}px`;
    canvas.style.height = `${scaledH}px`;
    canvas.width = Math.floor(scaledW * effectiveDpr);
    canvas.height = Math.floor(scaledH * effectiveDpr);
    view.ox = 0;
    view.oy = 0;
    view.sx = canvas.width / baseWidth;
    view.sy = canvas.height / baseHeight;

    if (debug) {
      const parentRect = content.parentElement?.getBoundingClientRect();
      debug.textContent = [
        `body: ${parentRect ? Math.round(parentRect.width) + "x" + Math.round(parentRect.height) : "n/a"}`,
        `shell: ${Math.round(rect.width)}x${Math.round(rect.height)}`,
        `surface: ${baseWidth}x${baseHeight} -> ${scaledW}x${scaledH}`,
        `raw: ${rawScale.toFixed(3)} applied: ${appliedScale.toFixed(3)} mode:${scaleMode}`,
        `rawDpr:${rawDpr.toFixed(2)} effDpr:${effectiveDpr.toFixed(2)}`,
        `canvas: ${canvas.width}x${canvas.height}`,
        `ver:${GAMEUTILS_VERSION}`,
      ].join(" | ");
    }
  };

  const clear = () => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = !pixelArt ? true : false;
    ctx.setTransform(view.sx, 0, 0, view.sy, 0, 0);
  };

  const resizeObserver = new ResizeObserver(updateViewport);
  resizeObserver.observe(content);
  updateViewport();

  const onWinResize = () => updateViewport();
  window.addEventListener("resize", onWinResize);

  let ensureTries = 0;
  const ensureSized = () => {
    if (!content.isConnected) {
      if (ensureTries++ < 30) requestAnimationFrame(ensureSized);
      return;
    }
    const r = content.getBoundingClientRect();
    if (r.width <= 2 || r.height <= 2) {
      if (ensureTries++ < 30) requestAnimationFrame(ensureSized);
      return;
    }
    updateViewport();
  };
  requestAnimationFrame(ensureSized);

  const destroy = () => {
    resizeObserver.disconnect();
    window.removeEventListener("resize", onWinResize);
  };

  const cleanupObserver = new MutationObserver(() => {
    if (!content.isConnected) {
      cleanupObserver.disconnect();
      destroy();
    }
  });
  cleanupObserver.observe(document.body, { childList: true, subtree: true });

  return { content, canvas, ctx, view, updateViewport, resizeObserver, clear, destroy };
}

export function startLoop({ step, render, isActive }) {
  let rafId = null;
  let lastTime = 0;
  const loop = (time) => {
    if (!isActive()) return;
    const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
    lastTime = time;
    step(dt);
    render();
    rafId = requestAnimationFrame(loop);
  };
  rafId = requestAnimationFrame(loop);
  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}
