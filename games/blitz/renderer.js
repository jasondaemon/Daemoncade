import {
  BASE_HEIGHT,
  BASE_WIDTH,
  COLORS,
  HORIZON_Y,
  MAX_WORLD_Z,
  PLAYER_Y,
  PLAYER_Z,
} from "./constants.js";

export function createRenderer(ctx, view, laneCenters, art) {
  const stars = Array.from({ length: 60 }, (_, i) => ({
    x: (i * 47) % BASE_WIDTH,
    y: (i * 97) % (HORIZON_Y - 20),
    r: 0.8 + (i % 4) * 0.35,
  }));

  const skyline = Array.from({ length: 18 }, (_, i) => ({
    x: i * 40 - 30,
    w: 26 + (i % 5) * 10,
    h: 24 + ((i * 13) % 52),
  }));

  const project = (worldX, worldZ, cameraX) => {
    const z = Math.max(1, Math.min(MAX_WORLD_Z, worldZ));
    const t = 1 - z / MAX_WORLD_Z;
    const depthPow = t * t;
    const persp = 0.22 + t * 1.22;
    const screenX = BASE_WIDTH * 0.5 + (worldX - cameraX) * 84 * persp;
    const screenY = HORIZON_Y + depthPow * (PLAYER_Y - HORIZON_Y - 28);
    const scale = 0.42 + t * 1.65;
    return { screenX, screenY, scale, t, z };
  };

  const drawBackdrop = (cameraX, time = 0) => {
    const grad = ctx.createLinearGradient(0, 0, 0, BASE_HEIGHT);
    grad.addColorStop(0, "#040b16");
    grad.addColorStop(0.42, "#051a31");
    grad.addColorStop(1, "#0a1f33");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);

    stars.forEach((s, idx) => {
      const twinkle = 0.35 + 0.65 * Math.sin(time * 0.004 + idx * 0.7);
      ctx.fillStyle = `rgba(180,245,255,${0.2 + twinkle * 0.35})`;
      ctx.beginPath();
      ctx.arc((s.x + cameraX * 24) % BASE_WIDTH, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "rgba(111, 86, 255, 0.18)";
    skyline.forEach((b, i) => {
      const x = ((b.x + cameraX * (4 + (i % 3))) % (BASE_WIDTH + 80)) - 40;
      ctx.fillRect(x, HORIZON_Y - b.h, b.w, b.h);
    });

    ctx.strokeStyle = "rgba(106, 221, 255, 0.14)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 14; i += 1) {
      const y = HORIZON_Y + 6 + i * 8;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(BASE_WIDTH, y);
      ctx.stroke();
    }

    const fog = ctx.createLinearGradient(0, HORIZON_Y, 0, HORIZON_Y + 120);
    fog.addColorStop(0, "rgba(10, 58, 88, 0.34)");
    fog.addColorStop(1, "rgba(8, 20, 32, 0)");
    ctx.fillStyle = fog;
    ctx.fillRect(0, HORIZON_Y, BASE_WIDTH, 140);
  };

  const drawRunway = (cameraX, time = 0) => {
    drawBackdrop(cameraX, time);

    const roadGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, BASE_HEIGHT);
    roadGrad.addColorStop(0, "#253f57");
    roadGrad.addColorStop(1, "#21384d");
    ctx.fillStyle = roadGrad;
    ctx.beginPath();
    ctx.moveTo(BASE_WIDTH * 0.14, BASE_HEIGHT);
    ctx.lineTo(BASE_WIDTH * 0.35, HORIZON_Y);
    ctx.lineTo(BASE_WIDTH * 0.65, HORIZON_Y);
    ctx.lineTo(BASE_WIDTH * 0.86, BASE_HEIGHT);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(117,205,255,0.26)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(BASE_WIDTH * 0.14, BASE_HEIGHT);
    ctx.lineTo(BASE_WIDTH * 0.35, HORIZON_Y);
    ctx.moveTo(BASE_WIDTH * 0.86, BASE_HEIGHT);
    ctx.lineTo(BASE_WIDTH * 0.65, HORIZON_Y);
    ctx.stroke();

    for (let i = 0; i < laneCenters.length; i += 1) {
      const laneX = laneCenters[i];
      for (let z = 15; z < MAX_WORLD_Z; z += 14) {
        const a = project(laneX - 0.55, z, cameraX);
        const b = project(laneX - 0.55, z + 7, cameraX);
        ctx.strokeStyle = "rgba(110,185,255,0.18)";
        ctx.lineWidth = Math.max(1, a.scale * 1.2);
        ctx.beginPath();
        ctx.moveTo(a.screenX, a.screenY);
        ctx.lineTo(b.screenX, b.screenY);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "#67bbff";
    for (let i = 1; i < laneCenters.length; i += 1) {
      const wx = (laneCenters[i - 1] + laneCenters[i]) * 0.5;
      ctx.beginPath();
      for (let z = 20; z < MAX_WORLD_Z; z += 8) {
        const p = project(wx, z, cameraX);
        if (z === 20) ctx.moveTo(p.screenX, p.screenY);
        else ctx.lineTo(p.screenX, p.screenY);
      }
      ctx.stroke();
    }

    const vignette = ctx.createRadialGradient(
      BASE_WIDTH * 0.5,
      BASE_HEIGHT * 0.64,
      BASE_WIDTH * 0.18,
      BASE_WIDTH * 0.5,
      BASE_HEIGHT * 0.64,
      BASE_WIDTH * 0.72,
    );
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(1, "rgba(0,0,0,0.36)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
  };

  const drawPlayer = (player, cameraX, playerZ, time = 0) => {
    const anchor = project(player.x, playerZ, cameraX);
    const x = anchor.screenX;
    const y = anchor.screenY;
    const bob = Math.sin(time * 0.01) * 0.06;

    const count = player.swarm;
    const drawCount = Math.min(120, count);
    for (let i = 0; i < drawCount; i += 1) {
      const ring = Math.floor(Math.sqrt(i));
      const angle = i * 2.399963229728653;
      const spread = (4 + ring * 2.4) * anchor.scale;
      const ox = Math.cos(angle) * spread;
      const oy = Math.sin(angle) * spread * 0.72;
      const scale = Math.max(0.1, 0.12 * anchor.scale * (1 - ring * 0.015));
      if (
        !art.drawSprite(ctx, "swarm", x + ox, y + 14 * anchor.scale + oy, {
          scale,
          alpha: 0.88,
        })
      ) {
        ctx.fillStyle = COLORS.swarm;
        ctx.beginPath();
        ctx.arc(
          x + ox,
          y + oy,
          Math.max(2, (3 - ring * 0.12) * anchor.scale),
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }

    const frame = Math.floor(time / 180) % 3;
    const leaderName = frame === 0
      ? "leader0"
      : frame === 1
      ? "leader1"
      : "leader2";
    if (
      !art.drawSprite(ctx, leaderName, x, y + bob * 6, {
        scale: 0.55 * anchor.scale,
      })
    ) {
      ctx.fillStyle = COLORS.leader;
      ctx.beginPath();
      ctx.arc(x, y, 15 * anchor.scale, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawGate = (gate, cameraX, activeGate, time = 0) => {
    const p = project(gate.x, gate.z, cameraX);
    const width = 62 * p.scale;
    const height = 34 * p.scale;
    const x = p.screenX - width / 2;
    const y = p.screenY - height / 2;

    const frameName = gate.gateType === "weapon"
      ? "gateWeapon"
      : gate.gateType === "tempstat"
      ? "gateTemp"
      : "gateFrame";

    if (
      !art.drawSprite(ctx, frameName, p.screenX, p.screenY, {
        scale: 0.95 * p.scale,
      })
    ) {
      ctx.fillStyle = gate.gateType === "swarm" ? "#3ebc89" : "#8f7cff";
      ctx.fillRect(x, y, width, height);
    }

    ctx.fillStyle = gate.gateType === "swarm"
      ? (gate.value >= 0 ? "rgba(78,220,145,0.86)" : "rgba(255,122,122,0.86)")
      : gate.gateType === "weapon"
      ? "rgba(127,178,255,0.86)"
      : "rgba(180,140,255,0.86)";
    drawRoundedRect(
      ctx,
      x + 6 * p.scale,
      y + 5 * p.scale,
      width - 12 * p.scale,
      height - 10 * p.scale,
      6 * p.scale,
    );
    ctx.fill();

    ctx.globalAlpha = 0.18;
    ctx.fillStyle = "#e6fbff";
    for (
      let sy = y + 4;
      sy < y + height;
      sy += 5 + Math.sin(time * 0.01 + sy) * 0.3
    ) {
      ctx.fillRect(x + 4, sy, width - 8, 1.5);
    }
    ctx.globalAlpha = 1;

    if (activeGate && activeGate.id === gate.id) {
      ctx.strokeStyle = "#fff8b6";
      ctx.lineWidth = Math.max(1, p.scale * 2.6);
      drawRoundedRect(ctx, x - 2, y - 2, width + 4, height + 4, 8 * p.scale);
      ctx.stroke();
    }

    ctx.fillStyle = "#071321";
    ctx.lineWidth = Math.max(2, p.scale * 1.3);
    ctx.strokeStyle = "rgba(255,255,255,0.45)";
    ctx.font = `${
      Math.max(9, Math.round(13 * p.scale))
    }px 'Avenir Next', sans-serif`;
    ctx.textAlign = "center";
    const text = gate.gateType === "swarm"
      ? `${gate.value > 0 ? "+" : ""}${Math.floor(gate.value)}`
      : gate.gateType === "weapon"
      ? "WPN"
      : gate.label;
    ctx.strokeText(text, p.screenX, y + height * 0.62);
    ctx.fillText(text, p.screenX, y + height * 0.62);
  };

  const enemySpriteByType = {
    grunt: "enemyGrunt",
    shield: "enemyShield",
    runner: "enemyRunner",
    gunner: "enemyGunner",
    heavy: "enemyHeavy",
    drone: "enemyDrone",
    brute: "enemyHeavy",
    dash: "enemyRunner",
    armored: "enemyShield",
  };

  const drawEnemy = (enemy, cameraX) => {
    const p = project(enemy.x, enemy.z, cameraX);
    const sprite = enemySpriteByType[enemy.type] ||
      enemySpriteByType[enemy.behavior] || "enemyGrunt";
    const hitAlpha = enemy.hitFlash > 0 ? 0.25 + enemy.hitFlash * 3 : 0;

    if (
      !art.drawSprite(ctx, sprite, p.screenX, p.screenY, {
        scale: 0.56 * p.scale,
        alpha: 1,
      })
    ) {
      ctx.fillStyle = enemy.tint || COLORS.enemy;
      ctx.fillRect(
        p.screenX - 12 * p.scale,
        p.screenY - 15 * p.scale,
        24 * p.scale,
        30 * p.scale,
      );
    }

    if (enemy.armor > 0) {
      ctx.strokeStyle = "rgba(196,159,255,0.7)";
      ctx.lineWidth = Math.max(1, 2 * p.scale);
      drawRoundedRect(
        ctx,
        p.screenX - 14 * p.scale,
        p.screenY - 16 * p.scale,
        28 * p.scale,
        32 * p.scale,
        6 * p.scale,
      );
      ctx.stroke();
    }

    if (hitAlpha > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.7, hitAlpha)})`;
      drawRoundedRect(
        ctx,
        p.screenX - 14 * p.scale,
        p.screenY - 16 * p.scale,
        28 * p.scale,
        32 * p.scale,
        6 * p.scale,
      );
      ctx.fill();
    }

    const hpRatio = Math.max(0, enemy.hp) / Math.max(1, enemy.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(
      p.screenX - 14 * p.scale,
      p.screenY - 21 * p.scale,
      28 * p.scale,
      4 * p.scale,
    );
    ctx.fillStyle = "#83ff98";
    ctx.fillRect(
      p.screenX - 14 * p.scale,
      p.screenY - 21 * p.scale,
      28 * p.scale * hpRatio,
      4 * p.scale,
    );
  };

  const drawBoss = (boss, cameraX, time = 0) => {
    const p = project(boss.x, boss.z, cameraX);
    const scale = 1.26 * p.scale;
    if (!art.drawSprite(ctx, "boss", p.screenX, p.screenY, { scale })) {
      ctx.fillStyle = COLORS.boss;
      ctx.fillRect(
        p.screenX - 52 * p.scale,
        p.screenY - 34 * p.scale,
        104 * p.scale,
        68 * p.scale,
      );
    }

    const pulse = 0.5 + 0.5 * Math.sin(time * 0.01);
    ctx.fillStyle = `rgba(116,241,255,${0.2 + pulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(
      p.screenX,
      p.screenY + 8 * p.scale,
      9 * p.scale + pulse * 2.5,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    const hpRatio = Math.max(0, boss.hp) / Math.max(1, boss.maxHp);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(BASE_WIDTH * 0.2, 134, BASE_WIDTH * 0.6, 12);
    const bossGrad = ctx.createLinearGradient(
      BASE_WIDTH * 0.2,
      0,
      BASE_WIDTH * 0.8,
      0,
    );
    bossGrad.addColorStop(0, "#ff6a7d");
    bossGrad.addColorStop(1, "#ff9ec4");
    ctx.fillStyle = bossGrad;
    ctx.fillRect(BASE_WIDTH * 0.2, 134, BASE_WIDTH * 0.6 * hpRatio, 12);
    ctx.strokeStyle = "rgba(255,255,255,0.26)";
    ctx.strokeRect(BASE_WIDTH * 0.2, 134, BASE_WIDTH * 0.6, 12);
  };

  const drawBullet = (bullet, cameraX, isEnemy) => {
    const p = project(bullet.x, bullet.z, cameraX);
    const trail = project(
      bullet.x - bullet.vx * 0.02,
      bullet.z - bullet.vz * 0.06,
      cameraX,
    );
    ctx.strokeStyle = isEnemy
      ? "rgba(255,120,106,0.45)"
      : "rgba(185,248,255,0.45)";
    ctx.lineWidth = Math.max(1, p.scale * 2.1);
    ctx.beginPath();
    ctx.moveTo(trail.screenX, trail.screenY);
    ctx.lineTo(p.screenX, p.screenY);
    ctx.stroke();

    const sprite = isEnemy ? "enemyBullet" : "bullet";
    if (
      !art.drawSprite(ctx, sprite, p.screenX, p.screenY, {
        scale: 0.2 * p.scale,
      })
    ) {
      ctx.fillStyle = isEnemy ? COLORS.enemyBullet : COLORS.bullet;
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, Math.max(2, p.scale * 2), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawCoin = (coin, cameraX, time = 0) => {
    const p = project(coin.x, coin.z, cameraX);
    const spinScale = 0.24 * p.scale *
      (0.8 + 0.2 * Math.sin(time * 0.014 + coin.z));
    if (
      !art.drawSprite(ctx, "coin", p.screenX, p.screenY, { scale: spinScale })
    ) {
      ctx.fillStyle = COLORS.coin;
      ctx.beginPath();
      ctx.arc(p.screenX, p.screenY, Math.max(3, p.scale * 4.2), 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawParticles = (particles, cameraX) => {
    particles.forEach((pcl) => {
      const p = project(pcl.x, pcl.z, cameraX);
      ctx.fillStyle = pcl.color;
      ctx.globalAlpha = Math.max(0, pcl.life / pcl.maxLife);
      ctx.beginPath();
      ctx.arc(
        p.screenX,
        p.screenY,
        Math.max(1.5, p.scale * pcl.size),
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  };

  const drawFloats = (floats, cameraX) => {
    floats.forEach((f) => {
      const p = project(f.x, f.z, cameraX);
      const alpha = Math.max(0, f.life / f.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = f.color;
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 2;
      ctx.font = `${
        Math.max(12, Math.round(14 * p.scale))
      }px 'Avenir Next', sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeText(f.text, p.screenX, p.screenY - (1 - alpha) * 12);
      ctx.fillText(f.text, p.screenX, p.screenY - (1 - alpha) * 12);
      ctx.globalAlpha = 1;
    });
  };

  const drawHud = (game) => {
    const {
      player,
      levelTime,
      levelDuration,
      score,
      runCoins,
      difficultyLabel,
    } = game;

    const panelGrad = ctx.createLinearGradient(0, 12, 0, 96);
    panelGrad.addColorStop(0, "rgba(10,24,40,0.92)");
    panelGrad.addColorStop(1, "rgba(8,20,34,0.82)");
    ctx.fillStyle = panelGrad;
    drawRoundedRect(ctx, 10, 10, BASE_WIDTH - 20, 84, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(158,220,255,0.25)";
    ctx.stroke();

    art.drawSprite(ctx, "scoreIcon", 28, 30, { scale: 0.28 });
    art.drawSprite(ctx, "swarmIcon", 28, 56, { scale: 0.24 });

    ctx.font = "16px 'Avenir Next', sans-serif";
    ctx.fillStyle = "#dff1ff";
    ctx.textAlign = "left";
    ctx.fillText(`Score ${Math.floor(score)}`, 48, 34);
    ctx.fillText(`Swarm ${player.swarm}`, 48, 58);

    for (let i = 0; i < player.lives; i += 1) {
      art.drawSprite(ctx, "heart", 46 + i * 18, 78, { scale: 0.18 });
    }

    ctx.textAlign = "right";
    ctx.fillText(`Coins ${runCoins}`, BASE_WIDTH - 24, 34);
    ctx.fillText(
      `${difficultyLabel}  Lv ${game.levelIndex}`,
      BASE_WIDTH - 24,
      58,
    );

    const hpX = 176;
    const hpY = 54;
    const hpW = 198;
    drawRoundedRect(ctx, hpX, hpY, hpW, 13, 5);
    ctx.fillStyle = "rgba(25,53,63,0.95)";
    ctx.fill();
    const hpGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
    hpGrad.addColorStop(0, "#5af09b");
    hpGrad.addColorStop(1, "#4ef4c4");
    ctx.fillStyle = hpGrad;
    drawRoundedRect(ctx, hpX, hpY, hpW * (player.hp / player.maxHp), 13, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.24)";
    drawRoundedRect(ctx, hpX, hpY, hpW, 13, 5);
    ctx.stroke();

    const t = Math.max(0, 1 - levelTime / Math.max(1, levelDuration));
    ctx.fillStyle = "rgba(18,32,46,0.9)";
    drawRoundedRect(ctx, hpX, 72, hpW, 10, 4);
    ctx.fill();
    const tGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
    tGrad.addColorStop(0, "#ffd76b");
    tGrad.addColorStop(1, "#ff9d68");
    ctx.fillStyle = tGrad;
    drawRoundedRect(ctx, hpX, 72, hpW * t, 10, 4);
    ctx.fill();

    if (game.activeGateHint) {
      ctx.textAlign = "center";
      drawRoundedRect(ctx, BASE_WIDTH * 0.5 - 160, 102, 320, 28, 8);
      ctx.fillStyle = "rgba(5,12,20,0.74)";
      ctx.fill();
      ctx.fillStyle = "#fff7bf";
      ctx.fillText(game.activeGateHint, BASE_WIDTH * 0.5, 122);
    }
  };

  const drawOverlay = (text, subtext) => {
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.textAlign = "center";
    ctx.fillStyle = "#eaf5ff";
    ctx.font = "48px 'Avenir Next', sans-serif";
    ctx.fillText(text, BASE_WIDTH / 2, BASE_HEIGHT / 2 - 30);
    ctx.font = "24px 'Avenir Next', sans-serif";
    ctx.fillText(subtext, BASE_WIDTH / 2, BASE_HEIGHT / 2 + 18);
  };

  return {
    project,
    drawRunway,
    drawPlayer,
    drawGate,
    drawEnemy,
    drawBoss,
    drawBullet,
    drawCoin,
    drawParticles,
    drawFloats,
    drawHud,
    drawOverlay,
  };
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, Math.min(w, h) * 0.45);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}
