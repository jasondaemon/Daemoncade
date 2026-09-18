import * as THREE from "../vendor/three/three.module.min.js";
import { COLS, ROWS, TILE_SIZE, RAMP_AIR_TIME } from "./constants.js?v=12";
import { terrainHeightAt } from "./trailSystems.js?v=13";

const COLORS = [0xd94b55, 0xf0ad37, 0x4ca5d9, 0x72bd75];
const ROUTE_THEMES = [
  { sky: 0x9fc7d0, fog: 0x9fc7d0, ground: 0xc79759, trail: 0xb57e43, wall: 0x74482b },
  { sky: 0xe2ad87, fog: 0xe2ad87, ground: 0xb95732, trail: 0x934329, wall: 0x632b22 },
  { sky: 0x9ac3c3, fog: 0x9ac3c3, ground: 0x75865a, trail: 0x8a7654, wall: 0x48583d },
  { sky: 0x657389, fog: 0x657389, ground: 0x74756f, trail: 0x5c605e, wall: 0x343c42 },
  { sky: 0xd6b47f, fog: 0xd6b47f, ground: 0x9a6845, trail: 0x79513c, wall: 0x4e382f },
];
const mat = (color, roughness = 0.72, metalness = 0.05) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

function box(parent, geometry, material, scale, position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(...scale); mesh.position.set(...position);
  mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}

function createVehicle({ kind, color, index = 0 }) {
  const root = new THREE.Group(), body = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1);
  root.add(body);
  const paint = mat(color, .3, .22), dark = mat(0x111820, .84), glass = mat(0x183d51, .18, .35);
  const white = mat(0xe6e3d8, .5, .08), silver = mat(0x9da8ae, .35, .5);
  const lamp = new THREE.MeshStandardMaterial({ color: 0xfff3c0, emissive: 0xffd06a, emissiveIntensity: 1.2 });
  if (kind === "casey") {
    box(body, cube, paint, [.7, .25, 1.02], [0, .34, 0]);
    box(body, cube, paint, [.64, .28, .55], [0, .58, .17]);
    box(body, cube, white, [.66, .055, .58], [0, .75, .17]);
    box(body, cube, glass, [.58, .18, .04], [0, .61, -.13]);
    box(body, cube, dark, [.73, .09, .14], [0, .28, -.55]);
    box(body, cube, silver, [.53, .04, .02], [0, .4, -.625]);
    for (const x of [-.21, .21]) box(body, cube, lamp, [.13, .06, .025], [x, .43, -.64]);
    box(body, cube, dark, [.58, .035, .52], [0, .8, .16]);
    for (const x of [-.25, .25]) box(body, cube, dark, [.035, .06, .56], [x, .77, .16]);
  } else {
    const length = index === 1 ? .95 : .78;
    box(body, cube, paint, [.67, .23, length], [0, .34, 0]);
    box(body, cube, paint, [.59, .2, .39], [0, .55, .12]);
    box(body, cube, dark, [.55, .12, .04], [0, .57, -.16]);
    box(body, cube, dark, [.7, .08, .12], [0, .27, -length / 2 - .04]);
    for (let x = -.22; x <= .22; x += .11) box(body, cube, silver, [.035, .1, .02], [x, .39, -length / 2 - .105]);
    for (const x of [-.22, .22]) box(body, cube, lamp, [.12, .06, .025], [x, .42, -length / 2 - .12]);
    if (index === 2) box(body, cube, dark, [.62, .025, .48], [0, .72, .12]);
    if (index === 3) box(body, cube, silver, [.76, .08, .12], [0, .31, -length / 2 - .12]);
  }
  const tireGeo = new THREE.CylinderGeometry(.15, .15, .14, 14);
  root.userData.wheels = [];
  for (const x of [-.38, .38]) for (const z of [-.32, .34]) {
    const wheel = new THREE.Mesh(tireGeo, dark); wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, .2, z); wheel.castShadow = true; root.add(wheel); root.userData.wheels.push(wheel);
  }
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .12, 16), dark);
  spare.rotation.z = Math.PI / 2; spare.position.set(0, .47, kind === "casey" ? .64 : .5); body.add(spare);
  root.scale.setScalar(kind === "casey" ? .78 : .72);
  root.userData.body = body; root.userData.baseY = .04; root.userData.paint = paint;
  return root;
}

function createGasCan() {
  const group = new THREE.Group(), cube = new THREE.BoxGeometry(1, 1, 1);
  box(group, cube, mat(0xc83a31, .55, .12), [.2, .26, .08], [0, .17, 0]);
  box(group, cube, mat(0x551917, .75), [.07, .045, .11], [0, .29, 0]);
  return group;
}

function createTire() {
  const group = new THREE.Group();
  const tire = new THREE.Mesh(new THREE.TorusGeometry(.19, .07, 8, 18), mat(0x14191d, .9));
  tire.rotation.x = Math.PI / 2; tire.position.y = .16; tire.castShadow = true; group.add(tire);
  return group;
}

function disposeObject(object) {
  object.traverse((node) => {
    node.geometry?.dispose();
    if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach((entry) => entry.dispose());
  });
}

export function createCaseyView() {
  const content = document.createElement("div"); content.className = "casey-stage";
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.domElement.className = "casey-canvas"; renderer.domElement.setAttribute("aria-label", "Casey off-road maze");
  content.append(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fc7d0); scene.fog = new THREE.Fog(0x9fc7d0, 58, 82);
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 100);
  const cameraTarget = new THREE.Vector3(0, 0, 0);
  const cameraOffset = new THREE.Vector3(13.5, 13.5, 17.5);
  camera.position.copy(cameraOffset); camera.lookAt(cameraTarget);
  scene.add(new THREE.HemisphereLight(0xdff4ff, 0x6d4728, 2.2));
  const sun = new THREE.DirectionalLight(0xffefd0, 3.2); sun.position.set(-12, 25, 10); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -20, right: 20, top: 22, bottom: -22, near: 1, far: 70 });
  sun.shadow.camera.updateProjectionMatrix(); sun.shadow.bias = -.0005; scene.add(sun);
  const world = new THREE.Group(), actors = new THREE.Group(), effects = new THREE.Group(); scene.add(world, actors, effects);
  const playerMesh = createVehicle({ kind: "casey", color: 0x8f9795 }); actors.add(playerMesh);
  const enemyMeshes = COLORS.map((color, index) => { const mesh = createVehicle({ kind: "jeep", color, index }); actors.add(mesh); return mesh; });
  const huntRing = new THREE.Mesh(
    new THREE.TorusGeometry(.62, .045, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0x68b4ff, transparent: true, opacity: .86 }),
  );
  huntRing.rotation.x = Math.PI / 2; huntRing.visible = false; effects.add(huntRing);
  const boostRing = new THREE.Mesh(
    new THREE.TorusGeometry(.72, .065, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xff8a32, transparent: true, opacity: .9 }),
  );
  boostRing.rotation.x = Math.PI / 2; boostRing.visible = false; effects.add(boostRing);
  let mazeRef = null, pickups = new Map(), powers = new Map(), bonusMesh = null, lastFrame = performance.now();
  let previousPellets = null, previousPowers = null, previousLives = null, previousEnemyStates = [];
  let particles = [], impactShake = 0;
  const toWorld = (x, y) => ({ x: x / TILE_SIZE - COLS / 2, z: y / TILE_SIZE - ROWS / 2 });
  const tileHeight = (c, r) => terrainHeightAt(mazeRef?.terrain, c, r);
  const entityHeight = (entity) => terrainHeightAt(mazeRef?.terrain, entity.x / TILE_SIZE, entity.y / TILE_SIZE);

  function sculptPlane(geometry, sample) {
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i += 1) positions.setZ(i, sample(positions.getX(i), positions.getY(i)));
    positions.needsUpdate = true; geometry.computeVertexNormals();
    return geometry;
  }

  function rebuild(maze) {
    while (world.children.length) { const child = world.children.pop(); disposeObject(child); }
    pickups = new Map(); powers = new Map();
    const routeNumber = Number(maze.routeId);
    const theme = ROUTE_THEMES[Number.isFinite(routeNumber) ? routeNumber % ROUTE_THEMES.length : 0];
    scene.background.setHex(theme.sky); scene.fog.color.setHex(theme.fog);
    const groundGeometry = sculptPlane(
      new THREE.PlaneGeometry(COLS + 8, ROWS + 8, COLS + 8, ROWS + 8),
      (x, y) => terrainHeightAt(maze.terrain, x + COLS / 2, -y + ROWS / 2) - .12,
    );
    const ground = new THREE.Mesh(groundGeometry, mat(theme.ground, .98));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
    const wallGeo = new THREE.BoxGeometry(.98, .44, .98), wallMat = mat(theme.wall, .96);
    maze.grid.forEach((row, r) => row.forEach((cell, c) => {
      const height = terrainHeightAt(maze.terrain, c + .5, r + .5);
      if (cell.wall) {
        const rock = new THREE.Mesh(wallGeo, wallMat); rock.position.set(c - COLS / 2 + .5, height + .17 + ((c * 13 + r * 7) % 3) * .018, r - ROWS / 2 + .5);
        rock.scale.y = .76 + ((c * 5 + r * 11) % 4) * .055; rock.castShadow = true; rock.receiveShadow = true; world.add(rock);
        return;
      }
      const key = `${c},${r}`, surface = maze.terrain.surfaces.get(key);
      const surfaceColor = surface === "mud" ? 0x493323 : surface === "water" ? 0x367b91 : surface === "sand" ? 0xc89b58 : theme.trail;
      const roadGeometry = sculptPlane(
        new THREE.PlaneGeometry(.98, .98, 2, 2),
        (x, y) => terrainHeightAt(maze.terrain, c + .5 + x, r + .5 - y) + .018,
      );
      const tile = new THREE.Mesh(roadGeometry, mat(surfaceColor, surface === "water" ? .25 : .95, surface === "water" ? .12 : .02));
      tile.rotation.x = -Math.PI / 2; tile.position.set(c - COLS / 2 + .5, 0, r - ROWS / 2 + .5); tile.receiveShadow = true; world.add(tile);
      if (surface === "ramp") {
        const vertical = !maze.grid[r - 1]?.[c]?.wall && !maze.grid[r + 1]?.[c]?.wall;
        const ramp = new THREE.Mesh(new THREE.BoxGeometry(.72, .12, .72), mat(0xd5a73f, .7, .18));
        ramp.rotation[vertical ? "x" : "z"] = -.18; ramp.position.set(c - COLS / 2 + .5, height + .08, r - ROWS / 2 + .5); ramp.castShadow = true; world.add(ramp);
      }
    }));
    maze.pellets.forEach((key) => { const [c, r] = key.split(",").map(Number), item = createGasCan(); item.position.set(c - COLS / 2 + .5, terrainHeightAt(maze.terrain, c + .5, r + .5) + .02, r - ROWS / 2 + .5); world.add(item); pickups.set(key, item); });
    maze.powers.forEach((key) => { const [c, r] = key.split(",").map(Number), item = createTire(); item.position.set(c - COLS / 2 + .5, terrainHeightAt(maze.terrain, c + .5, r + .5), r - ROWS / 2 + .5); world.add(item); powers.set(key, item); });
    bonusMesh = new THREE.Mesh(new THREE.OctahedronGeometry(.22), mat(0xffcf47, .28, .5)); bonusMesh.castShadow = true; bonusMesh.visible = false; world.add(bonusMesh);
    mazeRef = maze;
    previousPellets = maze.pellets.size; previousPowers = maze.powers.size; previousEnemyStates = []; previousLives = null;
  }

  function spawnBurst(position, color, count = 9, force = 1) {
    for (let i = 0; i < count; i += 1) {
      const material = new THREE.MeshBasicMaterial({ color, transparent: true });
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(.07, .07, .07), material); mesh.position.copy(position); effects.add(mesh);
      const angle = (i / count) * Math.PI * 2 + Math.random() * .35;
      particles.push({ mesh, velocity: new THREE.Vector3(Math.cos(angle) * force, .65 + Math.random() * .8, Math.sin(angle) * force), life: .55 + Math.random() * .25 });
    }
  }

  function updateEffects(dt) {
    particles.forEach((particle) => {
      particle.life -= dt; particle.velocity.y -= 2.4 * dt; particle.mesh.position.addScaledVector(particle.velocity, dt);
      particle.mesh.material.opacity = Math.max(0, particle.life * 1.8); particle.mesh.rotation.x += dt * 5;
    });
    particles.filter((particle) => particle.life <= 0).forEach((particle) => { effects.remove(particle.mesh); particle.mesh.geometry.dispose(); particle.mesh.material.dispose(); });
    particles = particles.filter((particle) => particle.life > 0);
  }

  function syncVehicle(mesh, entity, time, active = true, jump = 0) {
    mesh.visible = Boolean(entity && active); if (!mesh.visible) return;
    const p = toWorld(entity.x, entity.y), height = entityHeight(entity);
    const jumpHeight = jump > 0 ? Math.sin((1 - jump / RAMP_AIR_TIME) * Math.PI) * 1.25 : 0;
    mesh.position.set(p.x, height + mesh.userData.baseY + jumpHeight + Math.sin(time * .012 + p.x) * .018, p.z);
    if (entity.dir.x || entity.dir.y) mesh.rotation.y = Math.atan2(-entity.dir.x, -entity.dir.y);
    mesh.userData.wheels.forEach((wheel) => { wheel.rotation.x -= .12; });
    const c = entity.x / TILE_SIZE, r = entity.y / TILE_SIZE;
    const slopeX = tileHeight(c + 1, r) - tileHeight(c - 1, r), slopeZ = tileHeight(c, r + 1) - tileHeight(c, r - 1);
    mesh.userData.body.rotation.z = -slopeX * .16 + Math.sin(time * .01 + p.z) * .015;
    mesh.userData.body.rotation.x = slopeZ * .16 - (jump > 0 ? Math.cos((1 - jump / RAMP_AIR_TIME) * Math.PI) * .16 : 0);
  }

  function render({ maze, player, enemies, bonus, frightenedUntil, lives, mode, airborneTimer = 0, boostTimer = 0, currentSurface, time }) {
    if (!maze) return; if (maze !== mazeRef) rebuild(maze);
    const frameSeconds = Math.min(.05, Math.max(0, (time - lastFrame) / 1000));
    lastFrame = time;
    if (previousPellets !== null && maze.pellets.size < previousPellets && player) {
      const p = toWorld(player.x, player.y); spawnBurst(new THREE.Vector3(p.x, entityHeight(player) + .28, p.z), 0xffcb50, 5, .55);
    }
    if (previousPowers !== null && maze.powers.size < previousPowers && player) {
      const p = toWorld(player.x, player.y); spawnBurst(new THREE.Vector3(p.x, entityHeight(player) + .3, p.z), 0x69b8ff, 18, 1.45); impactShake = .18;
    }
    if (previousLives !== null && lives < previousLives && player) {
      const p = toWorld(player.x, player.y); spawnBurst(new THREE.Vector3(p.x, entityHeight(player) + .35, p.z), 0xff573d, 22, 1.65); impactShake = .34;
    }
    enemies.forEach((enemy, index) => {
      if (previousEnemyStates[index] === "frightened" && enemy.state === "returning") {
        const p = toWorld(enemy.x, enemy.y); spawnBurst(new THREE.Vector3(p.x, entityHeight(enemy) + .35, p.z), 0xe8f5ff, 20, 1.35); impactShake = .22;
      }
    });
    previousPellets = maze.pellets.size; previousPowers = maze.powers.size; previousLives = lives;
    previousEnemyStates = enemies.map((enemy) => enemy.state);
    updateEffects(frameSeconds);
    pickups.forEach((mesh, key) => { mesh.visible = maze.pellets.has(key); mesh.rotation.y = Math.sin(time * .001 + mesh.position.x) * .12; });
    powers.forEach((mesh, key) => { mesh.visible = maze.powers.has(key); mesh.rotation.y = time * .0015; mesh.position.y = .04 + Math.sin(time * .004 + mesh.position.z) * .04; });
    bonusMesh.visible = Boolean(bonus?.active);
    if (bonus?.active) { bonusMesh.position.set(maze.bonusTile.c - COLS / 2 + .5, tileHeight(maze.bonusTile.c, maze.bonusTile.r) + .35, maze.bonusTile.r - ROWS / 2 + .5); bonusMesh.rotation.y = time * .002; }
    syncVehicle(playerMesh, player, time, true, airborneTimer);
    const boosting = Boolean(player && boostTimer > 0 && mode === "playing");
    playerMesh.userData.paint.emissive.setHex(boosting ? 0xff5b16 : 0x000000);
    playerMesh.userData.paint.emissiveIntensity = boosting ? .75 : 0;
    boostRing.visible = boosting;
    if (boosting) {
      const p = toWorld(player.x, player.y); boostRing.position.set(p.x, entityHeight(player) + .06, p.z);
      boostRing.scale.setScalar(1 + Math.sin(time * .02) * .12); boostRing.rotation.z = -time * .004;
      if (Math.random() < frameSeconds * 22) spawnBurst(new THREE.Vector3(p.x, entityHeight(player) + .14, p.z), 0xff7a28, 2, .6);
    }
    huntRing.visible = Boolean(player && frightenedUntil > 0 && mode === "playing");
    if (huntRing.visible) {
      const p = toWorld(player.x, player.y); huntRing.position.set(p.x, entityHeight(player) + .05, p.z); huntRing.rotation.z = time * .002;
      huntRing.material.opacity = frightenedUntil < 2.2 ? .45 + Math.sin(time * .025) * .35 : .82;
      huntRing.scale.setScalar(1 + Math.sin(time * .008) * .08);
    }
    if (player) {
      const p = toWorld(player.x, player.y);
      const leadX = player.dir.x * 1.35;
      const leadZ = player.dir.y * 1.35;
      const desired = new THREE.Vector3(
        THREE.MathUtils.clamp(p.x + leadX, -9.5, 9.5),
        entityHeight(player) * .45,
        THREE.MathUtils.clamp(p.z + leadZ, -10.5, 10.5),
      );
      const damping = 1 - Math.exp(-6.5 * frameSeconds);
      cameraTarget.lerp(desired, damping);
      camera.position.copy(cameraTarget).add(cameraOffset);
      if (impactShake > 0) {
        camera.position.x += (Math.random() - .5) * impactShake;
        camera.position.z += (Math.random() - .5) * impactShake;
        impactShake = Math.max(0, impactShake - frameSeconds * 1.7);
      }
      camera.lookAt(cameraTarget);
    }
    if (currentSurface === "mud" || currentSurface === "sand") {
      const p = toWorld(player.x, player.y);
      if (Math.random() < frameSeconds * 14) spawnBurst(new THREE.Vector3(p.x, entityHeight(player) + .08, p.z), currentSurface === "mud" ? 0x493323 : 0xc89b58, 2, .28);
    }
    enemyMeshes.forEach((mesh, index) => {
      const enemy = enemies[index]; syncVehicle(mesh, enemy, time, enemy && !["respawn", "in-garage"].includes(enemy.state));
      const frightened = enemy?.state === "frightened" && frightenedUntil > 0;
      const warning = frightened && frightenedUntil < 2.2 && Math.floor(time / 160) % 2 === 0;
      mesh.userData.paint.color.setHex(frightened ? (warning ? 0xf4f7ff : 0x2458d6) : COLORS[index]);
      mesh.userData.paint.emissive.setHex(frightened ? (warning ? 0x596d9e : 0x102a80) : 0x000000);
      mesh.userData.paint.emissiveIntensity = frightened ? .65 : 0;
      mesh.scale.setScalar(frightened ? .69 : .72);
    });
    renderer.render(scene, camera);
  }

  function resize() {
    const width = Math.max(1, content.clientWidth), height = Math.max(1, content.clientHeight), aspect = width / height;
    const vertical = aspect < .8 ? 11.5 : 9.3;
    renderer.setSize(width, height, false); camera.left = -vertical * aspect; camera.right = vertical * aspect; camera.top = vertical; camera.bottom = -vertical; camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(content); requestAnimationFrame(resize);
  const destroy = () => { resizeObserver.disconnect(); disposeObject(world); disposeObject(actors); disposeObject(effects); renderer.dispose(); };
  return { content, renderer, render, resizeObserver, destroy };
}
