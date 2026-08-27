const CELL = 64;
const COLS = 16;
const ROWS = 8;

const c = (ctx, color) => {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
};

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

const painters = {
  leader0(ctx) {
    c(ctx, "#69f1ff");
    drawRoundedRect(ctx, 16, 18, 32, 34, 10);
    ctx.fill();
    c(ctx, "#1a2f4d");
    ctx.fillRect(22, 28, 8, 8);
    ctx.fillRect(34, 28, 8, 8);
    c(ctx, "#ffd36b");
    ctx.fillRect(20, 14, 24, 8);
  },
  leader1(ctx) {
    painters.leader0(ctx);
    c(ctx, "#8bffb8");
    ctx.fillRect(18, 49, 28, 4);
  },
  leader2(ctx) {
    painters.leader0(ctx);
    c(ctx, "#8bffb8");
    ctx.fillRect(20, 50, 24, 3);
  },
  swarm(ctx) {
    c(ctx, "#9ef4ff");
    drawRoundedRect(ctx, 22, 20, 20, 28, 9);
    ctx.fill();
    c(ctx, "#193447");
    ctx.fillRect(27, 28, 4, 5);
    ctx.fillRect(33, 28, 4, 5);
  },
  enemyGrunt(ctx) {
    c(ctx, "#ff9f6d");
    drawRoundedRect(ctx, 16, 18, 32, 34, 9);
    ctx.fill();
    c(ctx, "#13253a");
    ctx.fillRect(22, 30, 8, 8);
    ctx.fillRect(34, 30, 8, 8);
    c(ctx, "#86ffd1");
    ctx.fillRect(20, 14, 24, 6);
  },
  enemyShield(ctx) {
    c(ctx, "#b086ff");
    drawRoundedRect(ctx, 14, 18, 36, 34, 11);
    ctx.fill();
    c(ctx, "#d0bbff");
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(18, 24);
    ctx.lineTo(46, 46);
    ctx.moveTo(18, 40);
    ctx.lineTo(28, 50);
    ctx.stroke();
    c(ctx, "#13253a");
    ctx.fillRect(22, 30, 8, 8);
    ctx.fillRect(34, 30, 8, 8);
  },
  enemyRunner(ctx) {
    c(ctx, "#73ffb6");
    ctx.beginPath();
    ctx.moveTo(32, 12);
    ctx.lineTo(50, 26);
    ctx.lineTo(44, 52);
    ctx.lineTo(20, 52);
    ctx.lineTo(14, 26);
    ctx.closePath();
    ctx.fill();
    c(ctx, "#14303f");
    ctx.fillRect(22, 30, 7, 8);
    ctx.fillRect(35, 30, 7, 8);
  },
  enemyGunner(ctx) {
    c(ctx, "#79b8ff");
    drawRoundedRect(ctx, 14, 20, 36, 30, 8);
    ctx.fill();
    c(ctx, "#d6f0ff");
    ctx.fillRect(30, 10, 4, 12);
    ctx.fillRect(22, 16, 20, 4);
    c(ctx, "#10263e");
    ctx.fillRect(20, 30, 8, 8);
    ctx.fillRect(36, 30, 8, 8);
  },
  enemyHeavy(ctx) {
    c(ctx, "#ff5f9a");
    drawRoundedRect(ctx, 10, 22, 44, 30, 9);
    ctx.fill();
    c(ctx, "#ff9ec4");
    ctx.fillRect(16, 16, 32, 8);
    c(ctx, "#1a2440");
    ctx.fillRect(20, 32, 8, 8);
    ctx.fillRect(36, 32, 8, 8);
  },
  enemyDrone(ctx) {
    c(ctx, "#ffd06a");
    ctx.beginPath();
    ctx.arc(32, 34, 18, 0, Math.PI * 2);
    ctx.fill();
    c(ctx, "#ffe7a8");
    ctx.fillRect(16, 14, 32, 6);
    c(ctx, "#243147");
    ctx.fillRect(24, 30, 6, 7);
    ctx.fillRect(34, 30, 6, 7);
  },
  boss(ctx) {
    c(ctx, "#ff5f9a");
    drawRoundedRect(ctx, 6, 12, 52, 40, 12);
    ctx.fill();
    c(ctx, "#2b1b37");
    ctx.fillRect(16, 24, 32, 10);
    c(ctx, "#74f1ff");
    ctx.beginPath();
    ctx.arc(32, 37, 7, 0, Math.PI * 2);
    ctx.fill();
  },
  gateFrame(ctx) {
    c(ctx, "#88d5ff");
    ctx.lineWidth = 5;
    drawRoundedRect(ctx, 6, 8, 52, 48, 10);
    ctx.stroke();
    c(ctx, "rgba(130,255,247,0.5)");
    for (let y = 14; y < 52; y += 6) {
      ctx.fillRect(10, y, 44, 2);
    }
  },
  gateWeapon(ctx) {
    painters.gateFrame(ctx);
    c(ctx, "#b99dff");
    drawRoundedRect(ctx, 18, 18, 28, 28, 8);
    ctx.fill();
    c(ctx, "#1f2b45");
    ctx.fillRect(28, 22, 8, 20);
    ctx.fillRect(22, 28, 20, 8);
  },
  gateTemp(ctx) {
    painters.gateFrame(ctx);
    c(ctx, "#9b79ff");
    ctx.beginPath();
    ctx.moveTo(32, 16);
    ctx.lineTo(20, 34);
    ctx.lineTo(30, 34);
    ctx.lineTo(24, 48);
    ctx.lineTo(44, 28);
    ctx.lineTo(34, 28);
    ctx.closePath();
    ctx.fill();
  },
  coin(ctx) {
    c(ctx, "#ffd34f");
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fill();
    c(ctx, "#9a6f04");
    ctx.lineWidth = 4;
    ctx.stroke();
    c(ctx, "#ffe48a");
    ctx.beginPath();
    ctx.arc(26, 24, 6, 0, Math.PI * 2);
    ctx.fill();
  },
  bullet(ctx) {
    c(ctx, "#b9f8ff");
    ctx.beginPath();
    ctx.arc(32, 28, 10, 0, Math.PI * 2);
    ctx.fill();
    c(ctx, "rgba(185,248,255,0.35)");
    ctx.fillRect(29, 28, 6, 26);
  },
  enemyBullet(ctx) {
    c(ctx, "#ff786a");
    ctx.beginPath();
    ctx.arc(32, 30, 10, 0, Math.PI * 2);
    ctx.fill();
    c(ctx, "rgba(255,120,106,0.35)");
    ctx.fillRect(30, 30, 4, 24);
  },
  heart(ctx) {
    c(ctx, "#ff6a8a");
    ctx.beginPath();
    ctx.arc(24, 24, 10, Math.PI, 0);
    ctx.arc(40, 24, 10, Math.PI, 0);
    ctx.lineTo(32, 50);
    ctx.closePath();
    ctx.fill();
  },
  swarmIcon(ctx) {
    c(ctx, "#9ef4ff");
    for (let i = 0; i < 7; i += 1) {
      ctx.beginPath();
      ctx.arc(
        18 + (i % 3) * 14,
        18 + Math.floor(i / 3) * 12,
        5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  },
  scoreIcon(ctx) {
    c(ctx, "#ffd76b");
    ctx.fillRect(16, 16, 32, 32);
    c(ctx, "#1d2f44");
    ctx.fillRect(22, 22, 20, 20);
    c(ctx, "#ffd76b");
    ctx.fillRect(26, 26, 12, 12);
  },
};

const orderedSprites = Object.keys(painters);

function createAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const map = {};
  orderedSprites.forEach((name, idx) => {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = col * CELL;
    const y = row * CELL;
    ctx.save();
    ctx.translate(x, y);
    painters[name](ctx);
    ctx.restore();
    map[name] = { x, y, w: CELL, h: CELL };
  });
  return { atlas: canvas, map };
}

export function buildBlitzArt() {
  const debugArt = window.location.search.includes("debugBlitzArt=1") ||
    localStorage.getItem("debugBlitzArt") === "1";
  if (debugArt) {
    return {
      enabled: false,
      drawSprite: () => {},
      map: {},
    };
  }

  try {
    const { atlas, map } = createAtlas();
    const tintCanvas = document.createElement("canvas");
    tintCanvas.width = CELL;
    tintCanvas.height = CELL;
    const tintCtx = tintCanvas.getContext("2d");

    const drawSprite = (ctx, name, x, y, opts = {}) => {
      const frame = map[name];
      if (!frame) return false;
      const scale = opts.scale ?? 1;
      const rot = opts.rot ?? 0;
      const alpha = opts.alpha ?? 1;
      const anchorX = opts.anchorX ?? 0.5;
      const anchorY = opts.anchorY ?? 0.5;
      const w = frame.w * scale;
      const h = frame.h * scale;

      ctx.save();
      ctx.globalAlpha *= alpha;
      ctx.translate(x, y);
      if (rot) ctx.rotate(rot);
      if (opts.tint) {
        tintCtx.clearRect(0, 0, CELL, CELL);
        tintCtx.drawImage(
          atlas,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          0,
          0,
          CELL,
          CELL,
        );
        tintCtx.globalCompositeOperation = "source-atop";
        tintCtx.fillStyle = opts.tint;
        tintCtx.fillRect(0, 0, CELL, CELL);
        tintCtx.globalCompositeOperation = "source-over";
        ctx.drawImage(
          tintCanvas,
          0,
          0,
          CELL,
          CELL,
          -w * anchorX,
          -h * anchorY,
          w,
          h,
        );
      } else {
        ctx.drawImage(
          atlas,
          frame.x,
          frame.y,
          frame.w,
          frame.h,
          -w * anchorX,
          -h * anchorY,
          w,
          h,
        );
      }
      ctx.restore();
      return true;
    };

    return { enabled: true, drawSprite, map, atlas };
  } catch {
    return {
      enabled: false,
      drawSprite: () => {},
      map: {},
    };
  }
}
