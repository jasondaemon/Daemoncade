(() => {
  const storageKey = "jasondaemon.sinkhole-city.best.v1";
  const durationMs = 120000;
  const world = { width: 2600, height: 1800 };
  const basecampWorld = { width: 4200, height: 3000 };
  const metroWorld = { width: 4400, height: 3200 };
  const metroRoadX = [540, 1460, 2440, 3420, 4140];
  const metroRoadY = [430, 1240, 2110, 2860];
  const metroParks = [
    { x: 690, y: 1380, w: 610, h: 570 },
    { x: 2640, y: 1400, w: 610, h: 540 },
  ];
  const metroPlazas = [
    { x: 1610, y: 560, w: 650, h: 510 },
    { x: 3540, y: 2240, w: 420, h: 460 },
  ];
  const basecampRoads = [
    [{ x: 120, y: 520 }, { x: 940, y: 500 }, { x: 1510, y: 820 }, { x: 2580, y: 790 }, { x: 4040, y: 510 }],
    [{ x: 580, y: 120 }, { x: 620, y: 960 }, { x: 900, y: 1640 }, { x: 760, y: 2860 }],
    [{ x: 150, y: 1940 }, { x: 980, y: 1780 }, { x: 1770, y: 2050 }, { x: 2760, y: 1880 }, { x: 4080, y: 2220 }],
    [{ x: 2820, y: 120 }, { x: 2740, y: 900 }, { x: 3130, y: 1570 }, { x: 3420, y: 2860 }],
  ];
  const basecampSites = [
    { x: 430, y: 360 }, { x: 1120, y: 610 }, { x: 1920, y: 480 }, { x: 3340, y: 420 },
    { x: 520, y: 1430 }, { x: 1460, y: 1450 }, { x: 2390, y: 1320 }, { x: 3630, y: 1390 },
    { x: 1220, y: 2520 }, { x: 2260, y: 2500 }, { x: 3650, y: 2570 },
  ];
  const basecampRiverPath = [
    { x: -80, y: 2760 }, { x: 720, y: 2570 }, { x: 1380, y: 2340 },
    { x: 2030, y: 2240 }, { x: 2740, y: 2110 }, { x: 3260, y: 1740 }, { x: 4280, y: 1510 },
  ];
  const tiers = [
    { name: "small", min: 7, max: 16, score: 18, growth: .18 },
    { name: "medium", min: 17, max: 27, score: 48, growth: .36 },
    { name: "large", min: 28, max: 43, score: 120, growth: .74 },
    { name: "huge", min: 44, max: 76, score: 310, growth: 1.45 },
  ];
  const environments = [
    {
      id: "campsite",
      name: "Basecamp",
      catalog: {
        small: ["rock", "cone", "trash", "shrub", "chair", "cooler", "lantern", "campfire", "backpack"],
        medium: ["picnic", "sign", "mailbox", "tent", "bike", "stove", "barrel", "campTable"],
        large: ["jeep", "trailer", "tree", "foodtruck", "cabin", "outhouse", "pump"],
        huge: ["rv", "lodge", "boulder", "watertower", "bridge", "giantsign"],
      },
    },
    {
      id: "city",
      name: "Metro Sink",
      catalog: {
        small: ["cone", "trash", "hydrant", "parkingMeter", "streetlight", "newspaperBox", "bench"],
        medium: ["trafficLight", "mailbox", "bike", "scooter", "dumpster", "busStop", "roadBarrier"],
        large: ["car", "taxi", "van", "foodtruck", "bus", "storefront", "utilityTruck"],
        huge: ["building", "skyscraper", "parkingGarage", "bridge", "billboard", "watertower"],
      },
    },
    {
      id: "space",
      name: "Orbit Collapse",
      catalog: {
        small: ["starRock", "meteor", "probe", "moonBuggy", "spaceDebris", "smallPlanet"],
        medium: ["satellite", "capsule", "lander", "asteroid", "comet", "spaceBuoy"],
        large: ["spaceship", "xwing", "shuttle", "stationModule", "largeAsteroid", "moon"],
        huge: ["spaceStation", "enterprise", "deathstar", "planet", "wormholeGate", "mothership"],
      },
    },
    {
      id: "underwater",
      name: "Deep Sink",
      catalog: {
        small: ["fish", "shell", "starfish", "urchin", "seaweed", "bubbleCluster", "crab"],
        medium: ["coral", "jellyfish", "turtle", "ray", "diver", "anchor", "treasureChest"],
        large: ["shark", "dolphin", "submarine", "reef", "shipwreck", "octopus"],
        huge: ["whale", "giantSquid", "sunkenShip", "kelpForest", "seaStack", "underseaBase"],
      },
    },
    {
      id: "alien",
      name: "Alien World",
      catalog: {
        small: ["crystal", "spore", "alienRock", "glowPod", "crawler", "tinyUfo", "tentacleBud"],
        medium: ["crystalCluster", "mushroomTower", "alienShrub", "hoverDrone", "eggSac", "plasmaVent"],
        large: ["walker", "ufo", "monolith", "alienTree", "crawlerQueen", "bioDome"],
        huge: ["mothership", "alienTemple", "megaCrystal", "hiveTower", "leviathan", "portal"],
      },
    },
  ];
  const sfxBase = "./assets/sfx";
  const basecampSpriteTypes = [
    "rock", "cone", "trash", "shrub", "chair", "cooler",
    "lantern", "campfire", "backpack", "picnic", "sign", "mailbox",
    "tent", "bike", "stove", "barrel", "campTable", "jeep",
    "trailer", "tree", "foodtruck", "cabin", "outhouse", "pump",
    "rv", "lodge", "boulder", "watertower", "bridge", "giantsign",
  ];
  const basecampSpriteIndex = new Map(basecampSpriteTypes.map((type, index) => [type, index]));
  const basecampSpriteAtlas = new Image();
  basecampSpriteAtlas.decoding = "async";
  basecampSpriteAtlas.src = "./assets/sprites/basecamp.webp";
  const basecampJeepSprite = new Image();
  basecampJeepSprite.decoding = "async";
  basecampJeepSprite.src = "./assets/sprites/basecamp-jeep.png?v=20260824-1";
  const basecampFjSprite = new Image();
  basecampFjSprite.decoding = "async";
  basecampFjSprite.src = "./assets/sprites/basecamp-fj-cruiser.png?v=20260824-1";
  const basecampAmphitheaterSprite = new Image();
  basecampAmphitheaterSprite.decoding = "async";
  basecampAmphitheaterSprite.src = "./assets/sprites/basecamp-amphitheater.png?v=20260824-1";
  const basecampObservationTowerSprite = new Image();
  basecampObservationTowerSprite.decoding = "async";
  basecampObservationTowerSprite.src = "./assets/sprites/basecamp-observation-tower.png?v=20260824-1";
  const basecampPicnicShelterSprite = new Image();
  basecampPicnicShelterSprite.decoding = "async";
  basecampPicnicShelterSprite.src = "./assets/sprites/basecamp-picnic-shelter.png?v=20260824-1";
  const basecampExtraTypes = [
    "campMug", "crushedCan", "firewood", "hikingBoot", "trailMarker", "mushroomCluster",
    "tackleBox", "campBlanket", "waterJug", "portableToilet", "canoe", "kayak",
    "rangerPickup", "atv", "dirtBike", "fishingBoat", "foodLocker", "picnicShelter",
    "rangerStation", "showerHouse", "welcomeKiosk", "observationTower", "maintenanceShed", "amphitheaterEntrance",
  ];
  const basecampExtraIndex = new Map(basecampExtraTypes.map((type, index) => [type, index]));
  const basecampExtraAtlas = new Image();
  basecampExtraAtlas.decoding = "async";
  basecampExtraAtlas.src = "./assets/sprites/basecamp-extra.png?v=20260824-5";
  const basecampWildlifeTypes = ["squirrel", "dog", "bear", "moose"];
  const basecampWildlifeIndex = new Map(basecampWildlifeTypes.map((type, index) => [type, index]));
  const basecampWildlifeAtlas = new Image();
  basecampWildlifeAtlas.decoding = "async";
  basecampWildlifeAtlas.src = "./assets/sprites/basecamp-wildlife-animated.png";
  const basecampTerrain = Object.fromEntries(["grass", "gravel", "water", "trail"].map((name) => {
    const image = new Image();
    image.decoding = "async";
    image.src = `./assets/terrain/basecamp-${name}.webp`;
    return [name, image];
  }));
  const basecampTerrainPatterns = new Map();
  const metroSpriteTypes = [
    "cone", "trash", "hydrant", "parkingMeter", "streetlight", "newspaperBox",
    "bench", "trafficLight", "mailbox", "bike", "scooter", "dumpster",
    "busStop", "roadBarrier", "car", "taxi", "van", "foodtruck",
    "bus", "storefront", "utilityTruck", "building", "skyscraper", "parkingGarage",
  ];
  const metroSpriteIndex = new Map(metroSpriteTypes.map((type, index) => [type, index]));
  const metroSpriteAtlas = new Image();
  metroSpriteAtlas.decoding = "async";
  metroSpriteAtlas.src = "./assets/sprites/metro-sink.png?v=20260824-2";
  const metroExtraTypes = [
    "coffeeCup", "garbageBag", "sidewalkPlanter", "bollard", "cafeSign", "pigeon",
    "newspaperBundle", "vendingMachine", "cafeTable", "phoneBooth", "shippingPallet", "motorcycle",
    "suv", "pickup", "ambulance", "municipalSedan", "boxTruck", "excavator",
    "townhouse", "warehouse", "hotel", "officeTower", "craneBase", "stadiumEntrance",
  ];
  const metroExtraIndex = new Map(metroExtraTypes.map((type, index) => [type, index]));
  const metroExtraAtlas = new Image();
  metroExtraAtlas.decoding = "async";
  metroExtraAtlas.src = "./assets/sprites/metro-extra.png?v=20260824-1";
  const metroLifeTypes = ["pedestrian", "hotdogVendor", "parkDog", "raccoon"];
  const metroLifeIndex = new Map(metroLifeTypes.map((type, index) => [type, index]));
  const metroLifeAtlas = new Image();
  metroLifeAtlas.decoding = "async";
  metroLifeAtlas.src = "./assets/sprites/metro-life.png?v=20260824-2";
  const deepSinkLifeTypes = ["shark", "dolphin", "jellyfish", "diver"];
  const deepSinkLifeIndex = new Map(deepSinkLifeTypes.map((type, index) => [type, index]));
  const deepSinkLifeAtlas = new Image();
  deepSinkLifeAtlas.decoding = "async";
  deepSinkLifeAtlas.src = "./assets/sprites/deep-sink-life.png?v=20260824-1";
  const metroTerrain = Object.fromEntries(["asphalt", "sidewalk", "grass", "brick"].map((name) => {
    const image = new Image();
    image.decoding = "async";
    image.src = `./assets/terrain/metro-${name}.webp`;
    return [name, image];
  }));
  const metroTerrainPatterns = new Map();
  const metroObjectSizes = {
    coffeeCup: 6, pigeon: 6, newspaperBundle: 7, pedestrian: 8, raccoon: 8, garbageBag: 9,
    cone: 9, parkingMeter: 9, bollard: 9, cafeSign: 10, trash: 11, hydrant: 11,
    streetlight: 11, newspaperBox: 12, sidewalkPlanter: 12, scooter: 12, parkDog: 13,
    mailbox: 14, bike: 14, bench: 15, trafficLight: 16, vendingMachine: 16,
    phoneBooth: 17, motorcycle: 17, cafeTable: 18, shippingPallet: 18, hotdogVendor: 19,
    roadBarrier: 20, dumpster: 22, busStop: 24, car: 31, taxi: 31, municipalSedan: 31,
    suv: 33, pickup: 35, van: 37, foodtruck: 39, utilityTruck: 41, ambulance: 41,
    tree: 34, excavator: 42, boxTruck: 43, bus: 49, storefront: 58, townhouse: 64,
    building: 70, craneBase: 72, stadiumEntrance: 74, hotel: 76, parkingGarage: 78,
    warehouse: 80, skyscraper: 85, officeTower: 86,
  };
  const basecampObjectSizes = {
    campMug: 6, crushedCan: 6, rock: 7, squirrel: 7, mushroomCluster: 7,
    hikingBoot: 8, cone: 9, lantern: 9, trash: 10, backpack: 10, firewood: 10,
    trailMarker: 10, shrub: 11, cooler: 11, chair: 12, tackleBox: 12,
    campBlanket: 12, waterJug: 13, mailbox: 13, dog: 13, bike: 14,
    campfire: 14, sign: 15, stove: 16, barrel: 16, campTable: 18,
    portableToilet: 16, foodLocker: 18, picnic: 19, kayak: 20, tent: 21,
    dirtBike: 16, canoe: 22, bear: 25, atv: 26, outhouse: 29, moose: 30,
    welcomeKiosk: 30, pump: 31, jeep: 32, tree: 34, fishingBoat: 34,
    rangerPickup: 35, fjCruiser: 35, trailer: 36, foodtruck: 39, picnicShelter: 40, boulder: 40,
    showerHouse: 44, giantsign: 44, cabin: 48, rangerStation: 48,
    maintenanceShed: 48, rv: 50, amphitheaterEntrance: 52, watertower: 55,
    observationTower: 58, bridge: 60, lodge: 65,
  };
  const soundFiles = {
    ui: "ui_select.mp3",
    countdownTick: "countdown_tick.mp3",
    countdownGo: "countdown_go.mp3",
    grow: "grow_up.mp3",
    gameOver: "game_over.mp3",
    small: "swallow_small.mp3",
    medium: "swallow_medium.mp3",
    large: "swallow_large.mp3",
    huge: "swallow_huge.mp3",
  };
  const ranks = [
    { min: 0, label: "Pothole" },
    { min: 34, label: "Sinkhole" },
    { min: 48, label: "Street Eater" },
    { min: 68, label: "Block Crusher" },
    { min: 92, label: "City Collapse" },
  ];
  const cpuProfiles = {
    easy: {
      speedScale: .7,
      vision: 560,
      reactionMs: 720,
      targetLimit: 10,
      edibleMargin: .69,
      largeBias: .35,
      wanderMs: 1050,
      mistakeRate: .36,
      chaseRatio: 1.32,
      fleeRatio: 1.04,
      chaseRange: 300,
      fleeRange: 300,
    },
    medium: {
      speedScale: .92,
      vision: 980,
      reactionMs: 360,
      targetLimit: 22,
      edibleMargin: .76,
      largeBias: .95,
      wanderMs: 760,
      mistakeRate: .12,
      chaseRatio: 1.16,
      fleeRatio: 1.08,
      chaseRange: 520,
      fleeRange: 390,
    },
    hard: {
      speedScale: 1.08,
      vision: 1800,
      reactionMs: 150,
      targetLimit: 60,
      edibleMargin: .8,
      largeBias: 1.65,
      wanderMs: 520,
      mistakeRate: 0,
      chaseRatio: 1.04,
      fleeRatio: 1.02,
      chaseRange: 760,
      fleeRange: 560,
    },
  };

  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const $ = (id) => document.getElementById(id);
  const state = {
    profile: loadProfile(),
    mode: "menu",
    seed: 6205,
    dpr: 1,
    width: 1,
    height: 1,
    objects: [],
    particles: [],
    player: null,
    opponents: [],
    camera: { x: 0, y: 0, shake: 0, zoom: 1.5 },
    viewBounds: null,
    input: { x: 0, y: 0, keys: new Set(), pointerId: null, originX: 0, originY: 0 },
    last: 0,
    startAt: 0,
    pausedAt: 0,
    scoreRecorded: false,
    best: Number(localStorage.getItem(storageKey) || 0),
    audioReady: false,
    audioLoading: null,
    audioContext: null,
    soundBuffers: {},
    soundLastAt: {},
    matchMode: "solo",
    battleVariant: "objects",
    cpuDifficulty: "medium",
    remoteGameId: "",
    remoteMark: "",
    remotePoll: null,
    remotePublishAt: 0,
    remoteEatenPublished: new Set(),
    environment: environments[0],
  };
  const backgroundMusic = new Audio(`${sfxBase}/background.mp3`);
  backgroundMusic.preload = "auto";
  backgroundMusic.loop = true;
  backgroundMusic.volume = .28;

  function unlockAudio() {
    if (state.audioReady || state.audioLoading) return state.audioLoading;
    state.audioLoading = (async () => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return;
        const audioContext = state.audioContext || new AudioContextClass();
        state.audioContext = audioContext;
        if (audioContext.state === "suspended") await audioContext.resume();
        const entries = Object.entries(soundFiles);
        await Promise.all(entries.map(async ([key, file]) => {
          if (state.soundBuffers[key]) return;
          const response = await fetch(`${sfxBase}/${file}`, { cache: "force-cache" });
          if (!response.ok) throw new Error(`SFX ${file} failed: ${response.status}`);
          const bytes = await response.arrayBuffer();
          state.soundBuffers[key] = await audioContext.decodeAudioData(bytes.slice(0));
        }));
        state.audioReady = true;
      } catch {
        state.audioReady = false;
      }
    })();
    try {
      backgroundMusic.load();
    } catch {
      // Background audio is optional.
    }
    return state.audioLoading;
  }

  function playSound(name, volume = null) {
    const buffer = state.soundBuffers[name];
    const audioContext = state.audioContext;
    if (!buffer || !audioContext || audioContext.state === "closed") return;
    const now = performance.now();
    const minGap = name === "small" ? 55 : name === "medium" ? 70 : name === "large" ? 90 : name === "huge" ? 125 : 35;
    if (now - (state.soundLastAt[name] || 0) < minGap) return;
    state.soundLastAt[name] = now;
    try {
      if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
      const source = audioContext.createBufferSource();
      const gain = audioContext.createGain();
      source.buffer = buffer;
      gain.gain.value = volume ?? (name.startsWith("countdown") ? .72 : .82);
      source.connect(gain);
      gain.connect(audioContext.destination);
      source.start();
    } catch {
      // Audio failures must never block gameplay.
    }
  }

  function startBackgroundMusic() {
    try {
      backgroundMusic.currentTime = 0;
      backgroundMusic.play().catch(() => {});
    } catch {
      // Background audio is optional.
    }
  }

  function stopBackgroundMusic() {
    try {
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
    } catch {
      // Ignore optional audio teardown failures.
    }
  }

  function cleanName(value) {
    return String(value || "").replace(/[\x00-\x1f]+/g, "").trim().slice(0, 24);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function playerColor(mark) {
    return {
      A: "#7ee58b",
      B: "#ffd451",
      C: "#62d8ff",
      D: "#ff8fcd",
      P1: "#7ee58b",
      P2: "#ffd451",
    }[String(mark || "A")] || "#f7fff0";
  }

  function spawnForMark(mark) {
    return {
      A: { x: 420, y: 420 },
      B: { x: world.width - 420, y: world.height - 420 },
      C: { x: world.width - 420, y: 420 },
      D: { x: 420, y: world.height - 420 },
    }[String(mark || "A")] || { x: 420, y: 420 };
  }

  function loadProfile() {
    return { id: "local", name: "Player" };
  }

  function rng(seed) {
    let t = seed >>> 0;
    return () => {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function environmentForSeed(seed) {
    return environments[Math.abs(Number(seed || 0)) % environments.length] || environments[0];
  }

  function seedForRequestedEnvironment(seed) {
    const requested = new URLSearchParams(window.location.search).get("world");
    if (!requested || !environments.some((environment) => environment.id === requested)) return seed;
    let candidate = seed;
    while (environmentForSeed(candidate).id !== requested) candidate += 1;
    return candidate;
  }

  function resize() {
    state.dpr = Math.min(2, window.devicePixelRatio || 1);
    state.width = Math.max(1, window.innerWidth);
    state.height = Math.max(1, window.innerHeight);
    canvas.width = Math.floor(state.width * state.dpr);
    canvas.height = Math.floor(state.height * state.dpr);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  function rankFor(radius) {
    return ranks.reduce((best, rank) => (radius >= rank.min ? rank : best), ranks[0]);
  }

  function createPlayer(options = {}) {
    return {
      id: options.id || state.profile.id,
      name: options.name || state.profile.name,
      mark: options.mark || "A",
      isLocal: options.isLocal !== false,
      isCpu: Boolean(options.isCpu),
      x: options.x ?? 420,
      y: options.y ?? 420,
      vx: 0,
      vy: 0,
      radius: 24,
      targetRadius: 24,
      score: 0,
      combo: 0,
      maxCombo: 0,
      comboUntil: 0,
      swallowed: 0,
      lastRank: "Pothole",
      alive: true,
      pulse: 0,
      color: options.color || "#7ee58b",
      respawnUntil: 0,
      aiTargetId: "",
    };
  }

  function makeObject(id, type, tier, x, y, radius, rotation = 0) {
    const config = tiers.find((item) => item.name === tier);
    const fixedFacing = new Set([
      "cone", "trash", "chair", "cooler", "lantern", "campfire", "backpack", "picnic", "campTable", "sign", "mailbox", "tent", "stove", "barrel",
      "hydrant", "parkingMeter", "streetlight", "trafficLight", "busStop", "newspaperBox", "bench", "dumpster", "roadBarrier",
      "cabin", "building", "lodge", "skyscraper", "parkingGarage", "storefront", "underseaBase", "bioDome", "alienTemple", "hiveTower",
      "pump", "watertower", "giantsign", "billboard", "portal", "wormholeGate",
    ]);
    return {
      id,
      type,
      tier,
      x,
      y,
      radius,
      width: radius * (1.55 + (id % 5) * .08),
      height: radius * (1.05 + (id % 3) * .1),
      rotation: fixedFacing.has(type) ? 0 : rotation,
      visualScale: tier === "small" ? 1.28 : tier === "medium" ? 1.18 : tier === "large" ? 1.1 : 1.04,
      scoreValue: Math.round(config.score * (radius / config.min)),
      growthValue: config.growth * (radius / config.min),
      swallowed: false,
      swallowProgress: 0,
      swallowStartX: x,
      swallowStartY: y,
      swallowTurns: 1.1 + (id % 5) * .28,
      swallowDir: id % 2 ? 1 : -1,
      reject: 0,
    };
  }

  function generateWorld(seed = state.seed) {
    const rand = rng(seed);
    state.environment = environmentForSeed(seed);
    if (state.environment.id === "campsite") {
      world.width = basecampWorld.width;
      world.height = basecampWorld.height;
      state.objects = generateBasecampObjects(rand);
      return;
    }
    if (state.environment.id === "city") {
      world.width = metroWorld.width;
      world.height = metroWorld.height;
      state.objects = generateMetroObjects(rand);
      return;
    }
    if (state.environment.id === "underwater") {
      world.width = 4200;
      world.height = 3000;
      state.objects = generateUnderwaterObjects(rand);
      return;
    }
    world.width = 2600;
    world.height = 1800;
    const objects = [];
    let id = 1;
    const add = (tier, count, zones = null) => {
      const config = tiers.find((item) => item.name === tier);
      const names = state.environment.catalog[tier];
      for (let i = 0; i < count; i += 1) {
        const zone = zones ? zones[Math.floor(rand() * zones.length)] : null;
        const x = zone ? zone.x + rand() * zone.w : 120 + rand() * (world.width - 240);
        const y = zone ? zone.y + rand() * zone.h : 120 + rand() * (world.height - 240);
        const radius = (config.min + config.max) / 2;
        const type = names[Math.floor(rand() * names.length)];
        objects.push(makeObject(id, type, tier, x, y, radius, rand() * Math.PI * 2));
        id += 1;
      }
    };
    const starterZones = [
      { x: 210, y: 210, w: 680, h: 430 },
      { x: 280, y: 680, w: 520, h: 380 },
    ];
    add("small", 105, starterZones);
    add("small", 120);
    add("medium", 88);
    add("large", 54);
    add("huge", 25);
    state.objects = objects;
  }

  function generateUnderwaterObjects(rand) {
    const objects = [];
    let id = 1;
    const tierFor = (tier) => tiers.find((item) => item.name === tier);
    const addAt = (type, tier, x, y, rotation = 0) => {
      const config = tierFor(tier);
      const radius = (config.min + config.max) / 2;
      const object = makeObject(id++, type, tier, x, y, radius, rotation);
      objects.push(object);
      return object;
    };
    const pointIn = (zone, margin = 0) => ({
      x: zone.x + margin + rand() * Math.max(1, zone.w - margin * 2),
      y: zone.y + margin + rand() * Math.max(1, zone.h - margin * 2),
    });
    const reefZones = [
      { x: 260 + rand() * 260, y: 1880 + rand() * 210, w: 720 + rand() * 260, h: 640 },
      { x: 1580 + rand() * 360, y: 2050 + rand() * 180, w: 850 + rand() * 240, h: 620 },
      { x: 3040 + rand() * 220, y: 1770 + rand() * 260, w: 700 + rand() * 250, h: 720 },
    ];
    const wreckZones = [
      { x: 960 + rand() * 420, y: 1280 + rand() * 300, w: 520, h: 420 },
      { x: 2740 + rand() * 420, y: 930 + rand() * 390, w: 580, h: 460 },
    ];
    state.underwaterZones = { reefs: reefZones, wrecks: wreckZones };

    for (const zone of reefZones) {
      const reefCenter = pointIn(zone, 100);
      addAt("reef", "large", reefCenter.x, reefCenter.y);
      for (let i = 0; i < 18 + Math.floor(rand() * 9); i += 1) {
        const point = pointIn(zone, 35);
        const type = rand() < .34 ? "coral" : rand() < .58 ? "seaweed" : rand() < .78 ? "urchin" : rand() < .9 ? "starfish" : "crab";
        addAt(type, type === "coral" ? "medium" : "small", point.x, point.y, rand() * Math.PI * 2);
      }
      for (let i = 0; i < 3 + Math.floor(rand() * 3); i += 1) {
        const point = pointIn(zone, 70);
        addAt(rand() > .45 ? "turtle" : "ray", "medium", point.x, point.y, rand() * Math.PI * 2);
      }
    }

    for (const zone of wreckZones) {
      const point = pointIn(zone, 90);
      addAt(rand() > .48 ? "shipwreck" : "sunkenShip", "huge", point.x, point.y, rand() * .35 - .18);
      for (let i = 0; i < 7; i += 1) {
        const detail = pointIn(zone, 35);
        addAt(["anchor", "treasureChest", "shell", "crab"][Math.floor(rand() * 4)], rand() > .55 ? "medium" : "small", detail.x, detail.y, rand() * Math.PI * 2);
      }
      const diver = addAt("diver", "medium", point.x + 120, point.y - 105, 0);
      diver.mobile = true;
      diver.moveSpeed = 22 + rand() * 12;
      diver.heading = rand() * Math.PI * 2;
      diver.turnAt = 0;
      diver.movementBounds = { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
    }

    state.underwaterSchools = [];
    const schoolColors = ["#ffd34d", "#31c6ca", "#f48b3c", "#b8d8e8"];
    for (let schoolId = 0; schoolId < 10; schoolId += 1) {
      const center = { x: 320 + rand() * 3560, y: 300 + rand() * 1650 };
      const school = { x: center.x, y: center.y, heading: rand() * Math.PI * 2, speed: 28 + rand() * 34, turnAt: 0 };
      state.underwaterSchools.push(school);
      const count = 10 + Math.floor(rand() * 11);
      for (let i = 0; i < count; i += 1) {
        const fish = addAt("fish", "small", center.x, center.y, school.heading);
        fish.schoolId = schoolId;
        fish.schoolOffsetX = (rand() - .5) * 290;
        fish.schoolOffsetY = (rand() - .5) * 150;
        fish.schoolColor = schoolColors[schoolId % schoolColors.length];
        fish.motionPhase = rand() * Math.PI * 2;
      }
    }

    state.underwaterPods = [];
    for (let pod = 0; pod < 3; pod += 1) {
      const center = { x: 500 + rand() * 3200, y: 300 + rand() * 1100 };
      const heading = rand() * Math.PI * 2;
      state.underwaterPods.push({ x: center.x, y: center.y, heading, speed: 54 + rand() * 14, turnAt: 0 });
      for (let i = 0; i < 2 + Math.floor(rand() * 2); i += 1) {
        const dolphin = addAt("dolphin", "large", center.x + (i - 1) * 115, center.y + (rand() - .5) * 90, 0);
        dolphin.podId = pod;
        dolphin.podOffsetX = (i - 1) * 125 + (rand() - .5) * 35;
        dolphin.podOffsetY = (rand() - .5) * 100;
        dolphin.heading = heading;
        dolphin.motionPhase = rand() * Math.PI * 2;
      }
    }
    for (let i = 0; i < 5; i += 1) {
      const shark = addAt("shark", "large", 360 + rand() * 3480, 320 + rand() * 1500, 0);
      shark.mobile = true;
      shark.moveSpeed = 42 + rand() * 20;
      shark.heading = rand() * Math.PI * 2;
      shark.turnAt = 0;
      shark.movementBounds = { x: 120, y: 120, w: world.width - 240, h: 1840 };
    }
    for (let i = 0; i < 14; i += 1) {
      const jelly = addAt("jellyfish", "medium", 220 + rand() * 3760, 260 + rand() * 2050, 0);
      jelly.mobile = true;
      jelly.moveSpeed = 9 + rand() * 10;
      jelly.heading = -Math.PI / 2 + (rand() - .5) * .5;
      jelly.turnAt = 0;
      jelly.movementBounds = { x: 120, y: 120, w: world.width - 240, h: 2320 };
    }
    for (let i = 0; i < 3; i += 1) {
      const whale = addAt("whale", "huge", 620 + rand() * 2960, 320 + rand() * 1050, 0);
      whale.mobile = true;
      whale.moveSpeed = 15 + rand() * 8;
      whale.heading = rand() > .5 ? 0 : Math.PI;
      whale.turnAt = 0;
      whale.movementBounds = { x: 180, y: 180, w: world.width - 360, h: 1320 };
    }
    for (let i = 0; i < 3; i += 1) addAt(i === 0 ? "giantSquid" : "octopus", i === 0 ? "huge" : "large", 500 + rand() * 3200, 2050 + rand() * 620, rand() * Math.PI * 2);
    for (let i = 0; i < 90; i += 1) addAt(rand() > .46 ? "bubbleCluster" : "shell", "small", 100 + rand() * (world.width - 200), 130 + rand() * (world.height - 260), rand() * Math.PI * 2);
    return objects;
  }

  function generateMetroObjects(rand) {
    const objects = [];
    let id = 1;
    const tierFor = (tier) => tiers.find((item) => item.name === tier);
    const jitter = (amount) => (rand() - .5) * amount;
    const addAt = (type, tier, x, y, rotation = 0, _radiusScale = 1) => {
      const config = tierFor(tier);
      const radius = metroObjectSizes[type] || (config.min + config.max) / 2;
      const object = makeObject(id++, type, tier, x, y, radius, rotation);
      object.rotation = rotation;
      object.visualScale = 1;
      objects.push(object);
      return object;
    };

    const blocks = [];
    const xs = [90, ...metroRoadX.map((x) => x + 105)];
    const xe = [...metroRoadX.map((x) => x - 105), metroWorld.width - 90];
    const ys = [90, ...metroRoadY.map((y) => y + 105)];
    const ye = [...metroRoadY.map((y) => y - 105), metroWorld.height - 90];
    for (let row = 0; row < ys.length; row += 1) {
      for (let col = 0; col < xs.length; col += 1) {
        if (xe[col] - xs[col] < 230 || ye[row] - ys[row] < 230) continue;
        blocks.push({ x: xs[col], y: ys[row], w: xe[col] - xs[col], h: ye[row] - ys[row], row, col });
      }
    }

    for (const block of blocks) {
      const centerX = block.x + block.w * .5;
      const centerY = block.y + block.h * .5;
      const park = metroParks.some((area) => centerX > area.x && centerX < area.x + area.w && centerY > area.y && centerY < area.y + area.h);
      const plaza = metroPlazas.some((area) => block.x < area.x + area.w && block.x + block.w > area.x && block.y < area.y + area.h && block.y + block.h > area.y);
      if (park) continue;
      if (plaza) {
        addAt("storefront", "large", block.x + block.w * .5, block.y + block.h * .38, 0, 1.08);
        addAt("bench", "small", block.x + block.w * .25, block.y + block.h * .78, 0);
        addAt("newspaperBox", "small", block.x + block.w * .73, block.y + block.h * .78, 0);
        continue;
      }
      const major = (block.row + block.col) % 4 === 0;
      const lots = [
        { x: .27, y: .29 }, { x: .72, y: .29 },
        { x: .27, y: .69 }, { x: .72, y: .69 },
      ];
      const buildingCount = block.w > 600 && block.h > 520 ? 4 : block.w > 430 ? 3 : 2;
      for (let lot = 0; lot < buildingCount; lot += 1) {
        const spot = lots[lot];
        const landmark = major && lot === 0;
        const landmarkTypes = ["skyscraper", "officeTower", "hotel"];
        const neighborhoodTypes = ["building", "building", "parkingGarage", "townhouse", "warehouse"];
        const type = landmark ? landmarkTypes[(block.row + block.col) % landmarkTypes.length] : neighborhoodTypes[Math.floor(rand() * neighborhoodTypes.length)];
        addAt(type, "huge", block.x + block.w * spot.x + jitter(24), block.y + block.h * spot.y + jitter(20), 0, landmark ? .76 : .61 + rand() * .12);
      }
      const storefrontCount = block.w > 560 ? 2 : 1;
      for (let shop = 0; shop < storefrontCount; shop += 1) {
        addAt("storefront", "large", block.x + block.w * ((shop + 1) / (storefrontCount + 1)) + jitter(25), block.y + block.h - 58 + jitter(12), 0, .66 + rand() * .1);
      }
    }

    for (const park of metroParks) {
      const trees = [
        [.11, .12], [.3, .13], [.7, .13], [.89, .12],
        [.12, .34], [.88, .34], [.12, .66], [.88, .66],
        [.11, .88], [.3, .87], [.7, .87], [.89, .88],
      ];
      for (const [px, py] of trees) {
        addAt("tree", "large", park.x + park.w * px + jitter(12), park.y + park.h * py + jitter(12), 0);
      }
      const benches = [
        [.18, .18], [.5, .18], [.82, .18], [.18, .82], [.5, .82], [.82, .82], [.26, .5], [.74, .5],
      ];
      for (const [px, py] of benches) addAt("bench", "small", park.x + park.w * px + jitter(14), park.y + park.h * py + jitter(14), 0, .88);
      const lamps = [[.08, .08], [.5, .08], [.92, .08], [.08, .5], [.92, .5], [.08, .92], [.5, .92], [.92, .92]];
      for (const [px, py] of lamps) addAt("streetlight", "small", park.x + park.w * px, park.y + park.h * py, 0, .84);
      for (let i = 0; i < 7; i += 1) {
        const type = i % 3 === 0 ? "trash" : i % 3 === 1 ? "bike" : "scooter";
        addAt(type, "small", park.x + 70 + rand() * (park.w - 140), park.y + 65 + rand() * (park.h - 130), 0, .72 + rand() * .12);
      }
      for (let i = 0; i < 3; i += 1) {
        const dog = addAt("parkDog", "medium", park.x + 90 + rand() * (park.w - 180), park.y + 90 + rand() * (park.h - 180), 0, .68);
        dog.mobile = true;
        dog.moveSpeed = 38 + rand() * 15;
        dog.heading = rand() * Math.PI * 2;
        dog.turnAt = 0;
        dog.movementBounds = { x: park.x + 45, y: park.y + 45, w: park.w - 90, h: park.h - 90 };
      }
      for (let i = 0; i < 2; i += 1) {
        const raccoon = addAt("raccoon", "small", park.x + 70 + rand() * (park.w - 140), park.y + 70 + rand() * (park.h - 140), 0, .62);
        raccoon.mobile = true;
        raccoon.moveSpeed = 48 + rand() * 20;
        raccoon.heading = rand() * Math.PI * 2;
        raccoon.turnAt = 0;
        raccoon.movementBounds = { x: park.x + 25, y: park.y + 25, w: park.w - 50, h: park.h - 50 };
      }
    }

    for (let i = 0; i < 16; i += 1) {
      const roadY = metroRoadY[i % metroRoadY.length];
      const side = i % 2 ? 1 : -1;
      const pedestrian = addAt("pedestrian", "small", 140 + rand() * (metroWorld.width - 280), roadY + side * (112 + rand() * 12), 0, .7);
      pedestrian.mobile = true;
      pedestrian.moveSpeed = 34 + rand() * 18;
      pedestrian.heading = rand() > .5 ? 0 : Math.PI;
      pedestrian.turnAt = Number.POSITIVE_INFINITY;
      pedestrian.colorVariant = i % 5;
      pedestrian.movementBounds = { x: 80, y: roadY + side * 132 - 24, w: metroWorld.width - 160, h: 48 };
    }

    const vendorZones = [...metroParks, ...metroParks, ...metroPlazas];
    for (const zone of vendorZones) {
      const verticalEdge = rand() > .5;
      const x = verticalEdge ? zone.x + (rand() > .5 ? 48 : zone.w - 48) : zone.x + 75 + rand() * (zone.w - 150);
      const y = verticalEdge ? zone.y + 75 + rand() * (zone.h - 150) : zone.y + (rand() > .5 ? 58 : zone.h - 58);
      const vendor = addAt("hotdogVendor", "medium", x, y, 0, .78);
      vendor.animated = true;
      vendor.motionPhase = rand() * Math.PI * 2;
      const customerCount = 1 + Math.floor(rand() * 2);
      for (let i = 0; i < customerCount; i += 1) {
        const angle = rand() * Math.PI * 2;
        const pedestrian = addAt("pedestrian", "small", x + Math.cos(angle) * (42 + rand() * 35), y + Math.sin(angle) * (42 + rand() * 35), 0, .68);
        pedestrian.mobile = true;
        pedestrian.moveSpeed = 18 + rand() * 13;
        pedestrian.heading = rand() * Math.PI * 2;
        pedestrian.turnAt = 0;
        pedestrian.colorVariant = Math.floor(rand() * 5);
        pedestrian.movementBounds = { x: zone.x + 24, y: zone.y + 24, w: zone.w - 48, h: zone.h - 48 };
      }
    }

    for (let i = 0; i < 4; i += 1) {
      const plaza = metroPlazas[i % metroPlazas.length];
      const raccoon = addAt("raccoon", "small", plaza.x + 55 + rand() * (plaza.w - 110), plaza.y + 55 + rand() * (plaza.h - 110), 0, .6);
      raccoon.mobile = true;
      raccoon.moveSpeed = 44 + rand() * 18;
      raccoon.heading = rand() * Math.PI * 2;
      raccoon.turnAt = 0;
      raccoon.movementBounds = { x: plaza.x + 20, y: plaza.y + 20, w: plaza.w - 40, h: plaza.h - 40 };
    }

    for (const x of metroRoadX) {
      for (const y of metroRoadY) {
        addAt("trafficLight", "medium", x - 82, y - 78, 0, .82);
        if (rand() > .4) addAt("hydrant", "small", x + 82, y + 78, 0, .88);
        if (rand() > .52) addAt("newspaperBox", "small", x - 75, y + 86, 0, .86);
      }
    }

    const curbTypes = ["parkingMeter", "streetlight", "trash", "mailbox", "bike", "scooter", "bench"];
    for (let i = 0; i < 115; i += 1) {
      const vertical = rand() > .44;
      if (vertical) {
        const x = metroRoadX[Math.floor(rand() * metroRoadX.length)] + (rand() > .5 ? 88 : -88);
        addAt(curbTypes[Math.floor(rand() * curbTypes.length)], "small", x + jitter(18), 120 + rand() * (metroWorld.height - 240), 0, .8 + rand() * .25);
      } else {
        const y = metroRoadY[Math.floor(rand() * metroRoadY.length)] + (rand() > .5 ? 88 : -88);
        addAt(curbTypes[Math.floor(rand() * curbTypes.length)], "small", 120 + rand() * (metroWorld.width - 240), y + jitter(18), 0, .8 + rand() * .25);
      }
    }

    const tinyStreetTypes = ["coffeeCup", "garbageBag", "sidewalkPlanter", "bollard", "cafeSign", "pigeon", "newspaperBundle"];
    for (let i = 0; i < 92; i += 1) {
      const vertical = rand() > .45;
      const type = tinyStreetTypes[Math.floor(rand() * tinyStreetTypes.length)];
      if (vertical) {
        const x = metroRoadX[Math.floor(rand() * metroRoadX.length)] + (rand() > .5 ? 120 : -120) + jitter(24);
        addAt(type, "small", x, 100 + rand() * (metroWorld.height - 200), 0);
      } else {
        const y = metroRoadY[Math.floor(rand() * metroRoadY.length)] + (rand() > .5 ? 120 : -120) + jitter(24);
        addAt(type, "small", 100 + rand() * (metroWorld.width - 200), y, 0);
      }
    }

    const plazaTypes = ["vendingMachine", "cafeTable", "phoneBooth", "shippingPallet", "motorcycle"];
    for (const plaza of metroPlazas) {
      for (let i = 0; i < 6; i += 1) {
        addAt(plazaTypes[Math.floor(rand() * plazaTypes.length)], "medium", plaza.x + 45 + rand() * (plaza.w - 90), plaza.y + 45 + rand() * (plaza.h - 90), 0);
      }
    }

    const vehicles = ["car", "taxi", "van", "foodtruck", "utilityTruck", "bus", "suv", "pickup", "ambulance", "municipalSedan", "boxTruck", "excavator"];
    for (let i = 0; i < 68; i += 1) {
      const vertical = rand() > .48;
      const type = vehicles[Math.floor(rand() * vehicles.length)];
      const tier = type === "bus" ? "large" : "large";
      if (vertical) {
        const x = metroRoadX[Math.floor(rand() * metroRoadX.length)] + (rand() > .5 ? 29 : -29);
        addAt(type, tier, x, 150 + rand() * (metroWorld.height - 300), Math.PI / 2 + (rand() > .5 ? Math.PI : 0), type === "bus" ? 1.04 : .83);
      } else {
        const y = metroRoadY[Math.floor(rand() * metroRoadY.length)] + (rand() > .5 ? 29 : -29);
        addAt(type, tier, 150 + rand() * (metroWorld.width - 300), y, rand() > .5 ? Math.PI : 0, type === "bus" ? 1.04 : .83);
      }
    }

    for (let i = 0; i < 44; i += 1) {
      const vertical = rand() > .5;
      const x = vertical ? metroRoadX[Math.floor(rand() * metroRoadX.length)] + jitter(70) : 150 + rand() * (metroWorld.width - 300);
      const y = vertical ? 150 + rand() * (metroWorld.height - 300) : metroRoadY[Math.floor(rand() * metroRoadY.length)] + jitter(70);
      addAt(rand() > .35 ? "cone" : "roadBarrier", rand() > .35 ? "small" : "medium", x, y, 0, .82);
    }
    return objects;
  }

  function generateBasecampObjects(rand) {
    const objects = [];
    let id = 1;
    const tierFor = (tier) => tiers.find((item) => item.name === tier);
    const addAt = (type, tier, x, y, rotation = 0, _radiusScale = 1) => {
      const config = tierFor(tier);
      const radius = basecampObjectSizes[type] || (config.min + config.max) / 2;
      const object = makeObject(id++, type, tier, x, y, radius, rotation);
      object.rotation = rotation;
      object.visualScale = 1;
      objects.push(object);
      return object;
    };
    const jitter = (amount) => (rand() - .5) * amount;
    const pick = (items) => items[Math.floor(rand() * items.length)];
    const distanceToSegment = (point, a, b) => {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lengthSquared = dx * dx + dy * dy || 1;
      const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
      return Math.hypot(point.x - (a.x + dx * t), point.y - (a.y + dy * t));
    };
    const nearRiver = (x, y, margin = 105) => basecampRiverPath.some((point, index) => index && distanceToSegment({ x, y }, basecampRiverPath[index - 1], point) < margin);
    const pointAlong = (path, offset = 0) => {
      const segment = Math.floor(rand() * (path.length - 1));
      const a = path[segment];
      const b = path[segment + 1];
      const t = .12 + rand() * .76;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      return {
        x: a.x + (b.x - a.x) * t - Math.sin(angle) * offset,
        y: a.y + (b.y - a.y) * t + Math.cos(angle) * offset,
        angle,
      };
    };
    const randomLandPoint = (padding = 130) => {
      for (let attempt = 0; attempt < 80; attempt += 1) {
        const point = { x: padding + rand() * (world.width - padding * 2), y: padding + rand() * (world.height - padding * 2) };
        if (!nearRiver(point.x, point.y, 145)) return point;
      }
      return { x: padding, y: padding };
    };
    const siteCandidates = basecampRoads.flatMap((road) => road.slice(0, -1).map((a, index) => {
      const b = road[index + 1];
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const t = .22 + rand() * .56;
      const side = rand() > .5 ? 1 : -1;
      const offset = side * (150 + rand() * 105);
      return {
        x: Math.max(190, Math.min(world.width - 190, a.x + (b.x - a.x) * t - Math.sin(angle) * offset)),
        y: Math.max(190, Math.min(world.height - 190, a.y + (b.y - a.y) * t + Math.cos(angle) * offset)),
      };
    })).filter((site) => !nearRiver(site.x, site.y, 220));
    const activeSites = [];
    while (siteCandidates.length && activeSites.length < 11) {
      const index = Math.floor(rand() * siteCandidates.length);
      const candidate = siteCandidates.splice(index, 1)[0];
      if (activeSites.every((site) => Math.hypot(site.x - candidate.x, site.y - candidate.y) > 330)) activeSites.push(candidate);
    }
    while (activeSites.length < 9) activeSites.push(randomLandPoint(240));
    state.generatedBasecampSites = activeSites;

    for (const site of activeSites) {
      const cx = site.x + jitter(90);
      const cy = site.y + jitter(90);
      addAt("campfire", "small", cx, cy, 0, 1.08);
      const chairCount = rand() > .45 ? 3 : 2;
      for (let i = 0; i < chairCount; i += 1) {
        const angle = -.7 + i * (1.4 / Math.max(1, chairCount - 1)) + jitter(.16);
        const distance = 74 + rand() * 24;
        addAt("chair", "small", cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, angle + Math.PI / 2);
      }
      addAt("tent", "medium", cx + jitter(55), cy - 126 - rand() * 35, jitter(.12));
      addAt("cooler", "small", cx + 105 + jitter(28), cy + 28 + jitter(35), jitter(.12));
      addAt("lantern", "small", cx - 75 + jitter(24), cy + 62 + jitter(28), 0);
      if (rand() > .45) addAt("backpack", "small", cx - 112 + jitter(20), cy - 45 + jitter(30), jitter(.18));
      if (rand() > .55) addAt("picnic", "medium", cx + 165 + jitter(30), cy - 70 + jitter(35), jitter(.1));
      const campClutter = ["campMug", "crushedCan", "firewood", "hikingBoot", "tackleBox", "campBlanket", "waterJug"];
      const clutterCount = 3 + Math.floor(rand() * 3);
      for (let i = 0; i < clutterCount; i += 1) {
        const angle = rand() * Math.PI * 2;
        const distance = 95 + rand() * 115;
        const type = campClutter[Math.floor(rand() * campClutter.length)];
        addAt(type, basecampObjectSizes[type] >= 12 ? "medium" : "small", cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance, jitter(.3));
      }
    }

    const roadsideTypes = ["cabin", "cabin", "pump", "lodge", "cabin", "outhouse", "lodge", "cabin", "pump", "cabin", "lodge", "cabin"];
    for (const type of roadsideTypes) {
      const point = pointAlong(pick(basecampRoads), (rand() > .5 ? 1 : -1) * (105 + rand() * 55));
      if (!nearRiver(point.x, point.y, 145)) addAt(type, type === "lodge" ? "huge" : "large", point.x, point.y, point.angle + (rand() > .5 ? Math.PI : 0));
    }
    for (let i = 0; i < 6; i += 1) {
      const point = pointAlong(pick(basecampRoads), (rand() > .5 ? 1 : -1) * (80 + rand() * 35));
      addAt(rand() > .32 ? "sign" : "giantsign", rand() > .32 ? "medium" : "huge", point.x, point.y, point.angle);
    }
    addAt("bridge", "huge", 2080, 2210, -.38);
    const landmarkTypes = [
      ["watertower", "huge"], ["rv", "huge"], ["rangerStation", "huge"], ["showerHouse", "huge"],
      ["welcomeKiosk", "large"], ["observationTower", "huge"], ["maintenanceShed", "huge"],
      ["amphitheaterEntrance", "huge"], ["picnicShelter", "large"], ["foodLocker", "medium"], ["portableToilet", "medium"],
    ];
    const landmarkSites = [];
    let landmarkAttempts = 0;
    while (landmarkSites.length < landmarkTypes.length && landmarkAttempts < 220) {
      landmarkAttempts += 1;
      const point = pointAlong(pick(basecampRoads), (rand() > .5 ? 1 : -1) * (185 + rand() * 115));
      if (!nearRiver(point.x, point.y, 165)
        && activeSites.every((site) => Math.hypot(site.x - point.x, site.y - point.y) > 260)
        && landmarkSites.every((site) => Math.hypot(site.x - point.x, site.y - point.y) > 240)) landmarkSites.push(point);
    }
    while (landmarkSites.length < landmarkTypes.length) landmarkSites.push(randomLandPoint(210));
    for (const [type, tier] of landmarkTypes) {
      const site = landmarkSites.pop() || randomLandPoint(210);
      addAt(type, tier, site.x + jitter(120), site.y + jitter(110), jitter(.08));
    }

    for (const type of ["canoe", "kayak", "canoe", "kayak", "fishingBoat"]) {
      const point = pointAlong(basecampRiverPath, jitter(18));
      addAt(type, type === "fishingBoat" ? "large" : "medium", point.x, point.y, point.angle);
    }

    const vehicleTypes = ["jeep", "fjCruiser", "trailer", "foodtruck", "rangerPickup", "atv", "dirtBike"];
    for (const road of basecampRoads) {
      for (let segment = 0; segment < road.length - 1; segment += 1) {
        const a = road[segment];
        const b = road[segment + 1];
        const angle = Math.atan2(b.y - a.y, b.x - a.x);
        const count = 1 + (rand() > .58 ? 1 : 0);
        for (let i = 0; i < count; i += 1) {
          const t = .22 + rand() * .56;
          const side = rand() > .5 ? 1 : -1;
          const offset = side * (34 + rand() * 22);
          const x = a.x + (b.x - a.x) * t - Math.sin(angle) * offset;
          const y = a.y + (b.y - a.y) * t + Math.cos(angle) * offset;
          const type = vehicleTypes[Math.floor(rand() * vehicleTypes.length)];
          const tier = type === "dirtBike" || type === "atv" ? "medium" : "large";
          addAt(type, tier, x, y, angle + (side < 0 ? Math.PI : 0));
        }
      }
    }

    for (let i = 0; i < 260; i += 1) {
      const type = rand() < .47 ? "rock" : rand() < .82 ? "shrub" : "backpack";
      const point = randomLandPoint(90);
      addAt(type, "small", point.x, point.y, rand() * Math.PI * 2);
    }
    const trailDetails = ["trailMarker", "mushroomCluster", "crushedCan", "campMug", "firewood", "hikingBoot"];
    for (let i = 0; i < 85; i += 1) {
      const type = trailDetails[Math.floor(rand() * trailDetails.length)];
      const point = randomLandPoint(100);
      addAt(type, "small", point.x, point.y, rand() * Math.PI * 2);
    }
    for (let i = 0; i < 70; i += 1) {
      const edge = rand() > .5;
      const x = edge ? (rand() > .5 ? 100 + rand() * 260 : world.width - 360 + rand() * 260) : 120 + rand() * (world.width - 240);
      const y = edge ? 120 + rand() * (world.height - 240) : (rand() > .5 ? 100 + rand() * 250 : world.height - 350 + rand() * 250);
      if (!nearRiver(x, y, 155)) addAt(rand() > .22 ? "tree" : "boulder", rand() > .22 ? "large" : "huge", x, y, rand() * Math.PI * 2);
    }
    const wildlife = [
      { type: "squirrel", tier: "small", count: 7, speed: 82, radiusScale: .72 },
      { type: "dog", tier: "medium", count: 4, speed: 52, radiusScale: .78 },
      { type: "bear", tier: "large", count: 2, speed: 31, radiusScale: .92 },
      { type: "moose", tier: "huge", count: 2, speed: 27, radiusScale: .88 },
    ];
    for (const animal of wildlife) {
      for (let i = 0; i < animal.count; i += 1) {
        const nearSite = animal.type === "dog" ? activeSites[Math.floor(rand() * activeSites.length)] : null;
        const x = nearSite ? nearSite.x + jitter(320) : 180 + rand() * (world.width - 360);
        const y = nearSite ? nearSite.y + jitter(260) : 180 + rand() * (world.height - 360);
        const object = addAt(animal.type, animal.tier, x, y, 0, animal.radiusScale);
        object.mobile = true;
        object.moveSpeed = animal.speed * (.82 + rand() * .32);
        object.heading = rand() * Math.PI * 2;
        object.turnAt = 0;
      }
    }
    return objects;
  }

  async function startSolo() {
    const audioLoad = unlockAudio();
    await Promise.race([
      audioLoad || Promise.resolve(),
      new Promise((resolve) => window.setTimeout(resolve, 450)),
    ]);
    playSound("ui");
    stopRemotePoll();
    state.matchMode = "solo";
    state.battleVariant = "objects";
    state.opponents = [];
    state.mode = "countdown";
    state.seed = seedForRequestedEnvironment(Date.now() & 0xfffffff);
    state.player = createPlayer();
    state.camera.zoom = 1.5;
    state.particles = [];
    state.scoreRecorded = false;
    generateWorld(state.seed);
    hidePanels();
    startBackgroundMusic();
    countdown(3);
  }

  async function startCpuBattle() {
    const audioLoad = unlockAudio();
    await Promise.race([
      audioLoad || Promise.resolve(),
      new Promise((resolve) => window.setTimeout(resolve, 450)),
    ]);
    playSound("ui");
    stopRemotePoll();
    state.matchMode = "cpu";
    state.cpuDifficulty = $("cpuDifficulty").value || "medium";
    state.battleVariant = $("cpuVariant").value || "objects";
    state.mode = "countdown";
    state.seed = Date.now() & 0xfffffff;
    state.player = createPlayer({ mark: "A", color: "#7ee58b", x: 420, y: 420 });
    state.camera.zoom = 1.5;
    state.opponents = [
      createPlayer({ id: `cpu-${state.cpuDifficulty}`, name: `CPU ${state.cpuDifficulty}`, mark: "B", isLocal: false, isCpu: true, color: "#ffd451", x: world.width - 420, y: world.height - 420 }),
    ];
    state.particles = [];
    state.scoreRecorded = false;
    generateWorld(state.seed);
    hidePanels();
    startBackgroundMusic();
    countdown(3);
  }

  function countdown(value) {
    $("countdownScreen").hidden = false;
    $("countdownScreen").textContent = value > 0 ? String(value) : "Go";
    if (value < 0) {
      $("countdownScreen").hidden = true;
      state.mode = "playing";
      state.startAt = performance.now();
      state.last = state.startAt;
      requestAnimationFrame(loop);
      return;
    }
    playSound(value > 0 ? "countdownTick" : "countdownGo");
    window.setTimeout(() => countdown(value - 1), value === 0 ? 450 : 650);
  }

  function hidePanels() {
    ["startScreen", "howScreen", "endScreen"].forEach((id) => { $(id).hidden = true; });
  }

  function showStart() {
    state.mode = "menu";
    hidePanels();
    $("startScreen").hidden = false;
  }

  function showHow() {
    unlockAudio();
    playSound("ui");
    hidePanels();
    $("howScreen").hidden = false;
  }

  function stopRemotePoll() {
    if (state.remotePoll) window.clearInterval(state.remotePoll);
    state.remotePoll = null;
    state.remoteGameId = "";
    state.remoteMark = "";
  }

  function togglePause() {
    if (state.mode === "playing") {
      playSound("ui", .55);
      state.mode = "paused";
      state.pausedAt = performance.now();
      $("pauseButton").textContent = "▶";
      backgroundMusic.pause();
      return;
    }
    if (state.mode === "paused") {
      unlockAudio();
      playSound("ui", .55);
      const delta = performance.now() - state.pausedAt;
      state.startAt += delta;
      state.last = performance.now();
      state.mode = "playing";
      $("pauseButton").textContent = "Ⅱ";
      backgroundMusic.play().catch(() => {});
      requestAnimationFrame(loop);
    }
  }

  function elapsed(now = performance.now()) {
    return Math.max(0, now - state.startAt);
  }

  function timeLeft(now = performance.now()) {
    return Math.max(0, durationMs - elapsed(now));
  }

  function formatTime(ms) {
    const total = Math.ceil(ms / 1000);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  }

  function loop(now) {
    if (state.mode !== "playing") {
      render(now || performance.now());
      return;
    }
    const dt = Math.min(.034, Math.max(.001, (now - state.last) / 1000 || .016));
    state.last = now;
    update(dt, now);
    render(now);
    if (timeLeft(now) <= 0) return endGame();
    if (state.battleVariant === "objects" && state.objects.length === 0) return endGame("cleared");
    requestAnimationFrame(loop);
  }

  function inputVector() {
    let x = state.input.x;
    let y = state.input.y;
    if (state.input.keys.has("arrowleft") || state.input.keys.has("a")) x -= 1;
    if (state.input.keys.has("arrowright") || state.input.keys.has("d")) x += 1;
    if (state.input.keys.has("arrowup") || state.input.keys.has("w")) y -= 1;
    if (state.input.keys.has("arrowdown") || state.input.keys.has("s")) y += 1;
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len } : { x, y };
  }

  function update(dt, now) {
    const p = state.player;
    updateActor(p, inputVector(), dt, now);
    updateWildlife(dt, now);
    for (const opponent of state.opponents) {
      if (opponent.isCpu) updateActor(opponent, cpuInput(opponent, now), dt, now);
      else {
        opponent.radius += (opponent.targetRadius - opponent.radius) * Math.min(1, dt * 5);
        opponent.pulse = (opponent.pulse || 0) + dt * 4;
      }
    }

    for (const obj of state.objects) {
      if (obj.swallowed) {
        obj.swallowProgress += dt * 5.6;
        continue;
      }
      obj.reject = Math.max(0, obj.reject - dt * 3);
      for (const actor of actors()) {
        const dx = obj.x - actor.x;
        const dy = obj.y - actor.y;
        const dist = Math.hypot(dx, dy);
        const canEat = obj.radius <= actor.radius * .78;
        const overlap = dist < Math.max(12, actor.radius * .78);
        if (overlap && canEat) {
          eatObject(actor, obj, now);
          break;
        } else if (overlap && !canEat && actor.isLocal) {
          obj.reject = 1;
        }
      }
    }
    if (state.battleVariant === "swallow") updatePlayerSwallows(now);
    state.objects = state.objects.filter((obj) => obj.swallowProgress < 1);
    updateParticles(dt);
    state.camera.x += (p.x - state.camera.x) * Math.min(1, dt * 5);
    state.camera.y += (p.y - state.camera.y) * Math.min(1, dt * 5);
    const desiredZoom = Math.max(.62, Math.min(1.5, 1.5 - Math.max(0, p.radius - 24) * .009));
    state.camera.zoom += (desiredZoom - state.camera.zoom) * Math.min(1, dt * 2.8);
    state.camera.shake = Math.max(0, state.camera.shake - dt * 9);
    updateHud(now);
  }

  function updateWildlife(dt, now) {
    const player = state.player;
    if (state.environment?.id === "underwater" && state.underwaterSchools) {
      for (const school of state.underwaterSchools) {
        if (now >= (school.turnAt || 0)) {
          school.heading += (Math.random() - .5) * .65;
          school.turnAt = now + 1500 + Math.random() * 2600;
        }
        school.x += Math.cos(school.heading) * school.speed * dt;
        school.y += Math.sin(school.heading) * school.speed * dt;
        if (school.x < 220 || school.x > world.width - 220) {
          school.x = Math.max(220, Math.min(world.width - 220, school.x));
          school.heading = Math.PI - school.heading;
        }
        if (school.y < 220 || school.y > 1940) {
          school.y = Math.max(220, Math.min(1940, school.y));
          school.heading = -school.heading;
        }
      }
      for (const fish of state.objects) {
        if (fish.swallowed || fish.schoolId === undefined) continue;
        const school = state.underwaterSchools[fish.schoolId];
        if (!school) continue;
        const wave = Math.sin(now * .0025 + fish.id * .73) * 10;
        const cos = Math.cos(school.heading);
        const sin = Math.sin(school.heading);
        fish.x = school.x + fish.schoolOffsetX * cos - (fish.schoolOffsetY + wave) * sin;
        fish.y = school.y + fish.schoolOffsetX * sin + (fish.schoolOffsetY + wave) * cos;
        fish.rotation = school.heading;
        fish.motionPhase = (fish.motionPhase || 0) + dt * school.speed * .16;
      }
    }
    if (state.environment?.id === "underwater" && state.underwaterPods) {
      for (const pod of state.underwaterPods) {
        if (now >= (pod.turnAt || 0)) {
          pod.heading += (Math.random() - .5) * .42;
          pod.turnAt = now + 2200 + Math.random() * 3200;
        }
        pod.x += Math.cos(pod.heading) * pod.speed * dt;
        pod.y += Math.sin(pod.heading) * pod.speed * dt;
        if (pod.x < 260 || pod.x > world.width - 260) {
          pod.x = Math.max(260, Math.min(world.width - 260, pod.x));
          pod.heading = Math.PI - pod.heading;
        }
        if (pod.y < 220 || pod.y > 1580) {
          pod.y = Math.max(220, Math.min(1580, pod.y));
          pod.heading = -pod.heading;
        }
      }
      for (const dolphin of state.objects) {
        if (dolphin.swallowed || dolphin.podId === undefined) continue;
        const pod = state.underwaterPods[dolphin.podId];
        if (!pod) continue;
        const cos = Math.cos(pod.heading);
        const sin = Math.sin(pod.heading);
        dolphin.x = pod.x + dolphin.podOffsetX * cos - dolphin.podOffsetY * sin;
        dolphin.y = pod.y + dolphin.podOffsetX * sin + dolphin.podOffsetY * cos + Math.sin(now * .002 + dolphin.id) * 9;
        dolphin.heading = pod.heading;
        dolphin.motionPhase = (dolphin.motionPhase || 0) + dt * pod.speed * .13;
      }
    }
    for (const animal of state.objects) {
      if (animal.swallowed) continue;
      if (animal.animated && !animal.mobile) {
        animal.motionPhase = (animal.motionPhase || 0) + dt * 2.4;
        continue;
      }
      if (!animal.mobile) continue;
      const dx = player ? animal.x - player.x : 0;
      const dy = player ? animal.y - player.y : 0;
      const distance = Math.hypot(dx, dy);
      const flees = ["squirrel", "dog", "parkDog", "raccoon"].includes(animal.type);
      if (flees && distance < 220) {
        animal.heading = Math.atan2(dy, dx);
        animal.turnAt = now + 650;
      } else if (now >= (animal.turnAt || 0)) {
        animal.heading += (Math.random() - .5) * (animal.type === "squirrel" ? 1.7 : .9);
        animal.turnAt = now + 900 + Math.random() * (animal.type === "squirrel" ? 1100 : 2400);
      }
      const pace = animal.moveSpeed * (flees && distance < 220 ? 1.45 : 1);
      animal.x += Math.cos(animal.heading) * pace * dt;
      animal.y += Math.sin(animal.heading) * pace * dt;
      if (state.environment?.id === "underwater" && !deepSinkLifeIndex.has(animal.type)) animal.rotation = animal.heading;
      const margin = Math.max(40, animal.radius * 2);
      const bounds = animal.movementBounds || { x: margin, y: margin, w: world.width - margin * 2, h: world.height - margin * 2 };
      const minX = bounds.x;
      const maxX = bounds.x + bounds.w;
      const minY = bounds.y;
      const maxY = bounds.y + bounds.h;
      if (animal.x < minX || animal.x > maxX) {
        animal.x = Math.max(minX, Math.min(maxX, animal.x));
        animal.heading = Math.PI - animal.heading;
      }
      if (animal.y < minY || animal.y > maxY) {
        animal.y = Math.max(minY, Math.min(maxY, animal.y));
        animal.heading = -animal.heading;
      }
      animal.motionPhase = (animal.motionPhase || 0) + dt * pace * .13;
    }
  }

  function actors() {
    return [state.player, ...state.opponents].filter(Boolean);
  }

  function updateActor(actor, input, dt, now) {
    if (!actor || now < (actor.respawnUntil || 0)) return;
    const profile = actor.isCpu ? cpuProfiles[state.cpuDifficulty] || cpuProfiles.medium : null;
    const speed = Math.max(actor.isCpu ? 145 : 170, 300 - actor.radius * 1.25) * (profile?.speedScale || 1);
    actor.vx += (input.x * speed - actor.vx) * Math.min(1, dt * 8);
    actor.vy += (input.y * speed - actor.vy) * Math.min(1, dt * 8);
    actor.x = Math.max(0, Math.min(world.width, actor.x + actor.vx * dt));
    actor.y = Math.max(0, Math.min(world.height, actor.y + actor.vy * dt));
    actor.radius += (actor.targetRadius - actor.radius) * Math.min(1, dt * 5);
    const currentRank = rankFor(actor.radius).label;
    if (currentRank !== actor.lastRank) {
      actor.lastRank = currentRank;
      if (actor.isLocal) playSound("grow");
    }
    actor.pulse += dt * 4;
    if (now > actor.comboUntil) actor.combo = 0;
  }

  function cpuInput(cpu, now) {
    const profile = cpuProfiles[state.cpuDifficulty] || cpuProfiles.medium;
    const player = state.player;
    if (state.battleVariant === "swallow" && player) {
      const distToPlayer = Math.hypot(player.x - cpu.x, player.y - cpu.y);
      if (player.radius > cpu.radius * profile.fleeRatio && distToPlayer < profile.fleeRange) {
        cpu.cpuTarget = null;
        cpu.cpuNextThinkAt = now + profile.reactionMs;
        return normalize(cpu.x - player.x, cpu.y - player.y);
      }
      if (cpu.radius > player.radius * profile.chaseRatio && distToPlayer < profile.chaseRange) {
        cpu.cpuTarget = null;
        cpu.cpuNextThinkAt = now + profile.reactionMs;
        return normalize(player.x - cpu.x, player.y - cpu.y);
      }
    }
    if (!cpu.cpuTarget || cpu.cpuTarget.swallowed || now >= (cpu.cpuNextThinkAt || 0)) {
      cpu.cpuTarget = chooseCpuTarget(cpu, profile);
      cpu.cpuNextThinkAt = now + profile.reactionMs;
    }
    if (!cpu.cpuTarget) {
      if (!cpu.cpuWanderUntil || now >= cpu.cpuWanderUntil) {
        const angle = now / profile.wanderMs + (cpu.mark || "B").charCodeAt(0);
        cpu.cpuWander = { x: Math.cos(angle), y: Math.sin(angle * .7) };
        cpu.cpuWanderUntil = now + profile.wanderMs;
      }
      return cpu.cpuWander || { x: 0, y: 0 };
    }
    return normalize(cpu.cpuTarget.x - cpu.x, cpu.cpuTarget.y - cpu.y);
  }

  function chooseCpuTarget(cpu, profile) {
    const candidates = [];
    for (const obj of state.objects) {
      if (obj.swallowed || obj.radius > cpu.radius * profile.edibleMargin) continue;
      const dist = Math.hypot(obj.x - cpu.x, obj.y - cpu.y);
      if (dist > profile.vision) continue;
      const value = obj.scoreValue + obj.growthValue * 42 + obj.radius * profile.largeBias;
      const travelCost = dist / Math.max(1, 300 - cpu.radius * 1.25);
      const score = state.cpuDifficulty === "hard"
        ? value / Math.max(.28, travelCost)
        : dist - value * profile.largeBias;
      candidates.push({ obj, score, dist });
    }
    if (!candidates.length) return null;
    candidates.sort((a, b) => state.cpuDifficulty === "hard" ? b.score - a.score : a.score - b.score);
    const limit = Math.min(profile.targetLimit, candidates.length);
    const pool = candidates.slice(0, limit);
    if (profile.mistakeRate > 0 && Math.random() < profile.mistakeRate) {
      return pool[Math.floor(Math.random() * pool.length)]?.obj || candidates[0].obj;
    }
    return candidates[0].obj;
  }

  function normalize(x, y) {
    const len = Math.hypot(x, y) || 1;
    return { x: x / len, y: y / len };
  }

  function updatePlayerSwallows(now) {
    const list = actors();
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (now < (a.respawnUntil || 0) || now < (b.respawnUntil || 0)) continue;
        const radiusDelta = a.radius - b.radius;
      if (Math.abs(radiusDelta) <= 0.01) continue;
        const winner = radiusDelta > 0 ? a : b;
        const loser = radiusDelta > 0 ? b : a;
        const dist = Math.hypot(loser.x - winner.x, loser.y - winner.y);
        if (dist < Math.max(18, winner.radius * .62)) {
          swallowActor(winner, loser, now);
        }
      }
    }
  }

  function swallowActor(actor, other, now) {
    actor.score += Math.round(350 + other.score * .08);
    actor.targetRadius = Math.min(118, actor.targetRadius + Math.max(2, other.radius * .05));
    actor.swallowed += 1;
    if (actor.isLocal) {
      playSound("huge");
      state.camera.shake = 8;
    }
    respawnActor(other, now);
  }

  function respawnActor(actor, now) {
    const spot = spawnForMark(actor.mark);
    actor.x = spot.x;
    actor.y = spot.y;
    actor.vx = 0;
    actor.vy = 0;
    actor.radius = Math.max(20, actor.radius * .72);
    actor.targetRadius = actor.radius;
    actor.respawnUntil = now + 900;
  }

  function eatObject(actor, obj, now) {
    obj.swallowed = true;
    obj.swallowedBy = actor.mark || "A";
    obj.swallowTarget = actor;
    obj.swallowStartX = obj.x;
    obj.swallowStartY = obj.y;
    obj.swallowProgress = 0;
    actor.combo = now < actor.comboUntil ? actor.combo + 1 : 1;
    actor.maxCombo = Math.max(actor.maxCombo, actor.combo);
    actor.comboUntil = now + 1400;
    const comboBonus = Math.max(0, actor.combo - 1) * 8;
    actor.score += obj.scoreValue + comboBonus;
    actor.targetRadius = Math.min(118, actor.targetRadius + obj.growthValue);
    actor.swallowed += 1;
    if (actor.isLocal) playSound(obj.tier);
    if (actor.isLocal && (obj.tier === "large" || obj.tier === "huge")) state.camera.shake = obj.tier === "huge" ? 7 : 4;
    burstParticles(obj.x, obj.y, obj.tier);
  }

  function burstParticles(x, y, tier) {
    const count = tier === "huge" ? 18 : tier === "large" ? 13 : 8;
    const colors = ["#7ee58b", "#ffd451", "#62d8ff", "#ffffff"];
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const s = 40 + Math.random() * 170;
      state.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        life: .55 + Math.random() * .35,
        max: .9,
        color: colors[i % colors.length],
        size: 2 + Math.random() * 5,
      });
    }
  }

  function updateParticles(dt) {
    for (const particle of state.particles) {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vx *= .92;
      particle.vy *= .92;
      particle.life -= dt;
    }
    state.particles = state.particles.filter((particle) => particle.life > 0);
  }

  function updateHud(now = performance.now()) {
    const p = state.player || createPlayer();
    $("timeText").textContent = formatTime(timeLeft(now));
    $("scoreText").textContent = String(p.score);
    $("sizeText").textContent = rankFor(p.radius).label;
    $("comboText").hidden = p.combo < 2 || now > p.comboUntil;
    if (!$("comboText").hidden) $("comboText").textContent = `Combo x${p.combo}`;
  }

  function endGame(reason = "timer") {
    if (state.mode === "ended") return;
    state.mode = "ended";
    stopBackgroundMusic();
    playSound("gameOver");
    const p = state.player;
    const standings = actors().sort((a, b) => (b.score || 0) - (a.score || 0));
    const winner = standings[0] || p;
    const rank = rankFor(p.radius).label;
    $("endRank").textContent = reason === "cleared"
      ? "Board cleared"
      : winner === p ? `${rank} wins` : `${winner.name || winner.mark} wins`;
    $("finalScore").textContent = String(p.score);
    $("finalSize").textContent = `${Math.round(p.radius)}`;
    $("finalEaten").textContent = String(p.swallowed);
    $("scoreCompare").innerHTML = "";
    $("endScreen").hidden = false;
    localStorage.setItem(storageKey, String(Math.max(state.best, p.score)));
    recordScore();
  }

  function recordScore() {
    if (state.scoreRecorded || !state.player) return;
    state.scoreRecorded = true;
    const p = state.player;
    window.GameScores?.record({
      game: "sinkhole-city",
      mode: "solo",
      difficulty: state.environment?.id || "campsite",
      metric: "score",
      value: p.score,
      meta: { radius: Math.round(p.radius), swallowed: p.swallowed, maxCombo: p.maxCombo, rank: rankFor(p.radius).label },
    });
    const best = Math.max(state.best, p.score);
    $("scoreCompare").innerHTML = `<strong>Local best</strong><span>${best} points</span>`;
    $("scoreMessage").textContent = "Score saved on this device.";
  }

  function render(now = performance.now()) {
    const shake = state.camera.shake ? (Math.random() - .5) * state.camera.shake : 0;
    const zoom = state.camera.zoom || 1;
    const halfViewWidth = Math.min(world.width / 2, state.width / (2 * zoom));
    const halfViewHeight = Math.min(world.height / 2, state.height / (2 * zoom));
    const camX = Math.max(halfViewWidth, Math.min(world.width - halfViewWidth, state.camera.x || 420));
    const camY = Math.max(halfViewHeight, Math.min(world.height - halfViewHeight, state.camera.y || 420));
    const cullMargin = 190;
    state.viewBounds = {
      left: camX - halfViewWidth - cullMargin,
      right: camX + halfViewWidth + cullMargin,
      top: camY - halfViewHeight - cullMargin,
      bottom: camY + halfViewHeight + cullMargin,
    };
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.save();
    ctx.translate(state.width / 2 + shake, state.height / 2 - shake);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);
    drawTown();
    drawObjects(now, false);
    drawParticles();
    drawPlayers(now);
    drawObjects(now, true);
    ctx.restore();
    drawMinimap(camX, camY);
    if (state.mode === "paused") drawPaused();
  }

  function drawTown() {
    const env = state.environment?.id || "campsite";
    if (env === "city") return drawCityWorld();
    if (env === "space") return drawSpaceWorld();
    if (env === "underwater") return drawUnderwaterWorld();
    if (env === "alien") return drawAlienWorld();
    drawCampsiteWorld();
  }

  function drawCampsiteWorld() {
    const grass = ctx.createLinearGradient(0, 0, world.width, world.height);
    grass.addColorStop(0, "#8eb17d");
    grass.addColorStop(.5, "#709865");
    grass.addColorStop(1, "#557b50");
    ctx.fillStyle = terrainPattern("grass") || grass;
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.fillStyle = grass;
    ctx.globalAlpha = .24;
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.globalAlpha = 1;
    for (let i = 0; i < 42; i += 1) {
      const x = 130 + (i * 617) % (world.width - 260);
      const y = 120 + (i * 389) % (world.height - 240);
      ctx.fillStyle = i % 3 ? "rgba(174, 202, 137, .14)" : "rgba(38, 86, 50, .13)";
      ctx.beginPath();
      ctx.ellipse(x, y, 145 + (i % 5) * 38, 82 + (i % 4) * 24, (i % 7) * .19, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(47, 72, 43, .58)";
    ctx.lineWidth = 96;
    drawBasecampRoads();
    ctx.strokeStyle = terrainPattern("gravel") || "#b9a779";
    ctx.lineWidth = 78;
    drawBasecampRoads();
    ctx.strokeStyle = "rgba(235, 220, 172, .45)";
    ctx.lineWidth = 5;
    drawBasecampRoads();

    ctx.strokeStyle = terrainPattern("trail") || "rgba(61, 74, 43, .6)";
    ctx.lineWidth = 22;
    const activeSites = state.generatedBasecampSites || basecampSites;
    for (let i = 0; i < activeSites.length - 1; i += 1) {
      const a = activeSites[i];
      const b = activeSites[i + 1];
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.quadraticCurveTo((a.x + b.x) / 2, (a.y + b.y) / 2 + (i % 2 ? 80 : -80), b.x, b.y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(37, 83, 79, .7)";
    ctx.lineWidth = 118;
    ctx.beginPath();
    ctx.moveTo(-80, 2760);
    ctx.bezierCurveTo(760, 2580, 1280, 2340, 2030, 2240);
    ctx.bezierCurveTo(2820, 2140, 3180, 1660, 4280, 1510);
    ctx.stroke();
    ctx.strokeStyle = terrainPattern("water") || "#4f9db0";
    ctx.lineWidth = 86;
    ctx.stroke();
    ctx.strokeStyle = "rgba(191, 235, 225, .38)";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "rgba(29, 62, 39, .22)";
    for (let i = 0; i < 170; i += 1) {
      const x = (i * 733 + 91) % world.width;
      const y = (i * 431 + 173) % world.height;
      ctx.beginPath();
      ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function terrainPattern(name) {
    if (basecampTerrainPatterns.has(name)) return basecampTerrainPatterns.get(name);
    const image = basecampTerrain[name];
    if (!image?.complete || !image.naturalWidth) return null;
    const pattern = ctx.createPattern(image, "repeat");
    basecampTerrainPatterns.set(name, pattern);
    return pattern;
  }

  function metroPattern(name) {
    if (metroTerrainPatterns.has(name)) return metroTerrainPatterns.get(name);
    const image = metroTerrain[name];
    if (!image?.complete || !image.naturalWidth) return null;
    const pattern = ctx.createPattern(image, "repeat");
    metroTerrainPatterns.set(name, pattern);
    return pattern;
  }

  function drawBasecampRoads() {
    for (const road of basecampRoads) {
      ctx.beginPath();
      ctx.moveTo(road[0].x, road[0].y);
      for (let i = 1; i < road.length; i += 1) ctx.lineTo(road[i].x, road[i].y);
      ctx.stroke();
    }
  }

  function drawCityWorld() {
    ctx.fillStyle = metroPattern("sidewalk") || "#9c9b96";
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.fillStyle = "rgba(58, 67, 70, .16)";
    ctx.fillRect(0, 0, world.width, world.height);

    for (const park of metroParks) {
      ctx.fillStyle = "rgba(45, 64, 43, .38)";
      ctx.beginPath();
      ctx.roundRect(park.x - 18, park.y - 18, park.w + 36, park.h + 36, 34);
      ctx.fill();
      ctx.fillStyle = metroPattern("grass") || "#567f46";
      ctx.beginPath();
      ctx.roundRect(park.x, park.y, park.w, park.h, 26);
      ctx.fill();
      ctx.strokeStyle = "rgba(226, 219, 188, .65)";
      ctx.lineWidth = 20;
      ctx.beginPath();
      ctx.moveTo(park.x + 45, park.y + park.h / 2);
      ctx.lineTo(park.x + park.w - 45, park.y + park.h / 2);
      ctx.moveTo(park.x + park.w / 2, park.y + 45);
      ctx.lineTo(park.x + park.w / 2, park.y + park.h - 45);
      ctx.stroke();
    }
    for (const plaza of metroPlazas) {
      ctx.fillStyle = metroPattern("brick") || "#956653";
      ctx.beginPath();
      ctx.roundRect(plaza.x, plaza.y, plaza.w, plaza.h, 18);
      ctx.fill();
    }

    ctx.lineCap = "butt";
    ctx.strokeStyle = "rgba(44, 47, 47, .8)";
    ctx.lineWidth = 188;
    drawMetroRoads();
    ctx.strokeStyle = metroPattern("asphalt") || "#34383a";
    ctx.lineWidth = 164;
    drawMetroRoads();
    ctx.strokeStyle = "rgba(245, 214, 97, .9)";
    ctx.lineWidth = 5;
    ctx.setLineDash([34, 28]);
    drawMetroRoads();
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(247, 244, 230, .52)";
    ctx.lineWidth = 3;
    for (const x of metroRoadX) {
      ctx.beginPath();
      ctx.moveTo(x - 55, 0);
      ctx.lineTo(x - 55, world.height);
      ctx.moveTo(x + 55, 0);
      ctx.lineTo(x + 55, world.height);
      ctx.stroke();
    }
    for (const y of metroRoadY) {
      ctx.beginPath();
      ctx.moveTo(0, y - 55);
      ctx.lineTo(world.width, y - 55);
      ctx.moveTo(0, y + 55);
      ctx.lineTo(world.width, y + 55);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(242, 240, 223, .76)";
    for (const x of metroRoadX) {
      for (const y of metroRoadY) {
        for (let stripe = -3; stripe <= 3; stripe += 1) {
          ctx.fillRect(x - 104 + stripe * 25, y - 101, 13, 36);
          ctx.fillRect(x - 104 + stripe * 25, y + 65, 13, 36);
          ctx.fillRect(x - 101, y - 104 + stripe * 25, 36, 13);
          ctx.fillRect(x + 65, y - 104 + stripe * 25, 36, 13);
        }
      }
    }
  }

  function drawMetroRoads() {
    ctx.beginPath();
    for (const x of metroRoadX) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.height);
    }
    for (const y of metroRoadY) {
      ctx.moveTo(0, y);
      ctx.lineTo(world.width, y);
    }
    ctx.stroke();
  }

  function drawSpaceWorld() {
    const grd = ctx.createRadialGradient(world.width * .55, world.height * .45, 140, world.width * .5, world.height * .5, world.width);
    grd.addColorStop(0, "#182a4b");
    grd.addColorStop(.55, "#071126");
    grd.addColorStop(1, "#01030a");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.fillStyle = "rgba(255,255,255,.8)";
    for (let i = 0; i < 170; i += 1) {
      const x = (i * 419) % world.width;
      const y = (i * 233) % world.height;
      ctx.globalAlpha = .28 + (i % 7) * .09;
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(117, 210, 255, .18)";
    ctx.lineWidth = 3;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.ellipse(620 + i * 310, 820, 560 + i * 80, 110 + i * 12, -.25, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawUnderwaterWorld() {
    const grd = ctx.createLinearGradient(0, 0, 0, world.height);
    grd.addColorStop(0, "#46c4d7");
    grd.addColorStop(.42, "#147d92");
    grd.addColorStop(.76, "#075064");
    grd.addColorStop(1, "#04313f");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, world.width, world.height);

    const seabed = ctx.createLinearGradient(0, 1900, 0, world.height);
    seabed.addColorStop(0, "rgba(73, 125, 119, 0)");
    seabed.addColorStop(.25, "rgba(100, 137, 116, .72)");
    seabed.addColorStop(1, "#7b8064");
    ctx.fillStyle = seabed;
    ctx.fillRect(0, 1750, world.width, world.height - 1750);

    ctx.strokeStyle = "rgba(205, 251, 246, .13)";
    ctx.lineWidth = 5;
    for (let y = 170; y < 1780; y += 230) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x <= world.width; x += 300) ctx.quadraticCurveTo(x + 125, y - 48, x + 300, y);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(220, 236, 194, .12)";
    for (let i = 0; i < 75; i += 1) {
      const x = 70 + (i * 547) % (world.width - 140);
      const y = 1950 + (i * 313) % 900;
      ctx.beginPath();
      ctx.ellipse(x, y, 55 + (i % 5) * 18, 11 + (i % 3) * 5, (i % 7) * .27, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const zone of state.underwaterZones?.reefs || []) {
      const glow = ctx.createRadialGradient(zone.x + zone.w / 2, zone.y + zone.h / 2, 20, zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w * .55);
      glow.addColorStop(0, "rgba(48, 152, 117, .25)");
      glow.addColorStop(1, "rgba(14, 68, 67, 0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.ellipse(zone.x + zone.w / 2, zone.y + zone.h / 2, zone.w * .56, zone.h * .48, -.08, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(220, 252, 255, .35)";
    for (let i = 0; i < 95; i += 1) {
      const x = (i * 769 + 113) % world.width;
      const y = (i * 397 + 71) % world.height;
      ctx.beginPath();
      ctx.arc(x, y, 1 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawAlienWorld() {
    const grd = ctx.createLinearGradient(0, 0, world.width, world.height);
    grd.addColorStop(0, "#47265f");
    grd.addColorStop(.45, "#214c52");
    grd.addColorStop(1, "#473f16");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, world.width, world.height);
    drawSoftBlobs("rgba(126, 229, 139, .22)", 11, 260, 280, 280, 330);
    drawSoftBlobs("rgba(255, 116, 216, .16)", 9, 350, 1440, 260, -260);
    ctx.strokeStyle = "rgba(255, 212, 81, .16)";
    ctx.lineWidth = 5;
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.moveTo(120 + i * 270, 0);
      ctx.bezierCurveTo(240 + i * 220, 430, 10 + i * 280, 920, 240 + i * 260, world.height);
      ctx.stroke();
    }
    drawGrid("rgba(255,255,255,.06)", 180);
  }

  function drawSoftBlobs(fill, count, startX, startY, stepX, stepY) {
    ctx.fillStyle = fill;
    for (let i = 0; i < count; i += 1) {
      ctx.beginPath();
      ctx.ellipse(startX + i * stepX, startY + (i % 3) * stepY, 170, 90, .25 + i * .03, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRiver(stroke, width) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(140, 1500);
    ctx.bezierCurveTo(590, 1320, 720, 980, 1180, 930);
    ctx.bezierCurveTo(1630, 880, 1740, 460, 2450, 360);
    ctx.stroke();
  }

  function drawGrid(stroke, size) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    for (let x = 0; x <= world.width; x += size) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, world.height);
      ctx.stroke();
    }
    for (let y = 0; y <= world.height; y += size) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(world.width, y);
      ctx.stroke();
    }
  }

  function drawRoads() {
    ctx.beginPath();
    ctx.moveTo(120, 340);
    ctx.lineTo(900, 340);
    ctx.lineTo(1180, 620);
    ctx.lineTo(2220, 620);
    ctx.moveTo(460, 120);
    ctx.lineTo(460, 1540);
    ctx.moveTo(1180, 120);
    ctx.lineTo(1020, 740);
    ctx.lineTo(1050, 1660);
    ctx.moveTo(180, 1110);
    ctx.lineTo(860, 990);
    ctx.lineTo(1580, 1180);
    ctx.lineTo(2450, 1100);
    ctx.moveTo(1600, 190);
    ctx.lineTo(1660, 760);
    ctx.lineTo(2140, 1550);
    ctx.stroke();
  }

  function drawObjects(now, swallowedOnly = false) {
    const view = state.viewBounds;
    const items = state.objects
      .filter((obj) => obj.swallowed || !view || (obj.x + obj.radius * 6 >= view.left && obj.x - obj.radius * 6 <= view.right && obj.y + obj.radius * 6 >= view.top && obj.y - obj.radius * 6 <= view.bottom))
      .sort((a, b) => a.y - b.y);
    for (const obj of items) {
      if (swallowedOnly !== Boolean(obj.swallowed)) continue;
      const p = state.player;
      const canEat = p && obj.radius <= p.radius * .78;
      const locksToSpritePerspective = ((state.environment?.id === "campsite" || (state.environment?.id === "city" && obj.type === "tree")) && (basecampSpriteIndex.has(obj.type) || basecampExtraIndex.has(obj.type) || basecampWildlifeIndex.has(obj.type) || obj.type === "fjCruiser"))
        || (state.environment?.id === "city" && (metroSpriteIndex.has(obj.type) || metroExtraIndex.has(obj.type) || metroLifeIndex.has(obj.type)))
        || (state.environment?.id === "underwater" && deepSinkLifeIndex.has(obj.type));
      ctx.save();
      if (obj.swallowed) {
        const t = obj.swallowProgress;
        const target = obj.swallowTarget || p;
        const eased = 1 - Math.pow(1 - Math.min(1, t), 2.2);
        const sx = obj.swallowStartX ?? obj.x;
        const sy = obj.swallowStartY ?? obj.y;
        const dx = sx - target.x;
        const dy = sy - target.y;
        const dist = Math.hypot(dx, dy);
        const baseAngle = Math.atan2(dy, dx);
        const spin = obj.swallowDir * obj.swallowTurns * Math.PI * 2 * eased;
        const orbit = dist * (1 - eased);
        const x = target.x + Math.cos(baseAngle + spin) * orbit;
        const y = target.y + Math.sin(baseAngle + spin) * orbit;
        drawSwallowTrail(target.x, target.y, sx, sy, baseAngle, dist, obj, eased);
        ctx.translate(x, y);
        ctx.rotate((locksToSpritePerspective ? 0 : obj.rotation) + obj.swallowDir * t * 13);
        const scale = Math.max(0, Math.pow(1 - t, 1.35));
        ctx.scale(scale, scale);
      } else {
        const bounce = obj.reject ? Math.sin(now / 35) * obj.reject * 3 : 0;
        ctx.translate(obj.x, obj.y + bounce);
        ctx.rotate(locksToSpritePerspective ? 0 : obj.rotation);
      }
      ctx.scale(obj.visualScale || 1, obj.visualScale || 1);
      drawObjectShape(obj);
      if (!canEat && obj.reject > 0) {
        ctx.strokeStyle = `rgba(255, 90, 90, ${obj.reject})`;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawSwallowTrail(targetX, targetY, startX, startY, baseAngle, dist, obj, eased) {
    if (eased <= .04 || dist < 16) return;
    ctx.save();
    ctx.lineWidth = Math.max(2, obj.radius * .13);
    ctx.lineCap = "round";
    ctx.strokeStyle = `rgba(126, 229, 139, ${Math.max(0, .28 * (1 - eased))})`;
    ctx.beginPath();
    for (let i = 0; i <= 8; i += 1) {
      const k = i / 8;
      const localEase = Math.max(0, eased - k * .055);
      const spin = obj.swallowDir * obj.swallowTurns * Math.PI * 2 * localEase;
      const orbit = dist * (1 - localEase);
      const x = targetX + Math.cos(baseAngle + spin) * orbit;
      const y = targetY + Math.sin(baseAngle + spin) * orbit;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 212, 81, ${Math.max(0, .45 * (1 - eased))})`;
    for (let i = 2; i <= 8; i += 3) {
      const k = i / 8;
      const localEase = Math.max(0, eased - k * .055);
      const spin = obj.swallowDir * obj.swallowTurns * Math.PI * 2 * localEase;
      const orbit = dist * (1 - localEase);
      ctx.beginPath();
      ctx.arc(targetX + Math.cos(baseAngle + spin) * orbit, targetY + Math.sin(baseAngle + spin) * orbit, Math.max(1.5, obj.radius * .08), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawObjectShape(obj) {
    const r = obj.radius;
    if (state.environment?.id === "underwater" && drawDeepSinkLife(obj, r)) return;
    if (state.environment?.id === "campsite" && drawBasecampWildlife(obj, r)) return;
    if (state.environment?.id === "campsite" && obj.type === "jeep" && drawBasecampJeep(obj, r)) return;
    if (state.environment?.id === "campsite" && obj.type === "fjCruiser" && drawBasecampStandaloneVehicle(basecampFjSprite, r)) return;
    if (state.environment?.id === "campsite" && obj.type === "amphitheaterEntrance" && drawBasecampStandaloneSprite(basecampAmphitheaterSprite, r, 3.85)) return;
    if (state.environment?.id === "campsite" && obj.type === "observationTower" && drawBasecampStandaloneSprite(basecampObservationTowerSprite, r, 3.85)) return;
    if (state.environment?.id === "campsite" && obj.type === "picnicShelter" && drawBasecampStandaloneSprite(basecampPicnicShelterSprite, r, 3.85)) return;
    if (state.environment?.id === "campsite" && drawBasecampExtraSprite(obj, r)) return;
    if (state.environment?.id === "campsite" && drawBasecampSprite(obj, r)) return;
    if (state.environment?.id === "city" && obj.type === "tree" && drawBasecampSprite(obj, r)) return;
    if (state.environment?.id === "city" && drawMetroLife(obj, r)) return;
    if (state.environment?.id === "city" && drawMetroExtraSprite(obj, r)) return;
    if (state.environment?.id === "city" && drawMetroSprite(obj, r)) return;
    ctx.lineWidth = Math.max(2, r * .12);
    ctx.strokeStyle = "rgba(0,0,0,.28)";
    if (["rock", "boulder", "alienRock", "starRock", "asteroid", "largeAsteroid", "meteor"].includes(obj.type)) return blob(obj.type.includes("Asteroid") || obj.type === "meteor" ? "#786d7f" : "#7d8171", r);
    if (["cone", "trafficCone"].includes(obj.type)) return cone(r);
    if (obj.type === "trash" || obj.type === "barrel") return can(obj.type === "barrel" ? "#9d5e32" : "#56645c", r);
    if (["shrub", "tree", "alienShrub", "alienTree", "kelpForest", "seaweed"].includes(obj.type)) return shrub(obj.type.includes("Tree") || obj.type === "tree" || obj.type === "kelpForest" ? r * 1.2 : r);
    if (obj.type === "chair") return rect("#3ba7d8", r * 1.4, r, true);
    if (obj.type === "cooler") return rect("#59c7df", r * 1.5, r, true);
    if (obj.type === "lantern") return lantern(r);
    if (["campfire"].includes(obj.type)) return campfire(r);
    if (["backpack"].includes(obj.type)) return backpack(r);
    if (["picnic", "campTable"].includes(obj.type)) return picnic(r);
    if (["sign", "giantsign", "billboard", "roadBarrier"].includes(obj.type)) return sign(r, ["giantsign", "billboard"].includes(obj.type));
    if (obj.type === "mailbox") return rect("#4c7be8", r * 1.5, r, true);
    if (obj.type === "tent") return tent(r);
    if (obj.type === "bike") return bike(r);
    if (obj.type === "scooter") return scooter(r);
    if (obj.type === "stove") return rect("#30383a", r * 1.6, r, true);
    if (["car", "foodtruck", "jeep", "taxi", "van", "bus", "utilityTruck"].includes(obj.type)) return vehicleColor(obj.type, r);
    if (obj.type === "trailer" || obj.type === "rv") return vehicle("#e9e4d4", r * 1.2, obj.type);
    if (["cabin", "building", "lodge", "skyscraper", "parkingGarage", "storefront", "underseaBase", "bioDome", "alienTemple", "hiveTower"].includes(obj.type)) return buildingForType(obj.type, r);
    if (obj.type === "outhouse") return rect("#7b573d", r * 1.1, r * 1.5, true);
    if (obj.type === "pump") return pump(r);
    if (["hydrant", "parkingMeter", "streetlight", "trafficLight", "busStop", "newspaperBox", "bench", "dumpster"].includes(obj.type)) return streetFixture(obj.type, r);
    if (obj.type === "watertower") return waterTower(r);
    if (obj.type === "bridge") return bridge(r);
    if (["fish", "shark", "whale", "dolphin"].includes(obj.type)) return fishShape(obj.type, r, obj);
    if (["coral", "jellyfish", "turtle", "ray", "anchor", "treasureChest", "reef", "shipwreck", "octopus", "giantSquid", "sunkenShip", "seaStack", "shell", "starfish", "urchin", "bubbleCluster", "crab"].includes(obj.type)) return seaObject(obj.type, r);
    if (["satellite", "probe", "capsule", "lander", "spaceBuoy", "spaceship", "xwing", "shuttle", "stationModule", "spaceStation", "enterprise", "deathstar", "planet", "smallPlanet", "moon", "moonBuggy", "spaceDebris", "comet", "wormholeGate"].includes(obj.type)) return spaceObject(obj.type, r);
    if (["crystal", "crystalCluster", "megaCrystal", "spore", "glowPod", "crawler", "crawlerQueen", "tinyUfo", "ufo", "hoverDrone", "tentacleBud", "mushroomTower", "eggSac", "plasmaVent", "walker", "monolith", "mothership", "leviathan", "portal"].includes(obj.type)) return alienObject(obj.type, r);
    rect("#d9bb84", r * 1.6, r * 1.1, true);
  }

  function drawDeepSinkLife(obj, r) {
    const index = deepSinkLifeIndex.get(obj.type);
    if (index === undefined || !deepSinkLifeAtlas.complete || !deepSinkLifeAtlas.naturalWidth) return false;
    const cellWidth = deepSinkLifeAtlas.naturalWidth / 4;
    const cellHeight = deepSinkLifeAtlas.naturalHeight / 4;
    const frame = Math.floor((obj.motionPhase || 0) / (Math.PI * .5)) % 4;
    const scale = obj.type === "shark" ? 5.15 : obj.type === "dolphin" ? 5 : obj.type === "jellyfish" ? 4.35 : 4.65;
    const width = r * scale;
    const height = width * (cellHeight / cellWidth);
    ctx.save();
    if (obj.type !== "jellyfish" && Math.cos(obj.heading || 0) < 0) ctx.scale(-1, 1);
    if (obj.type === "jellyfish") {
      const pulse = 1 + Math.sin(obj.motionPhase || 0) * .045;
      ctx.scale(1 / pulse, pulse);
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(deepSinkLifeAtlas, frame * cellWidth, index * cellHeight, cellWidth, cellHeight, -width / 2, -height / 2, width, height);
    ctx.restore();
    return true;
  }

  function drawBasecampSprite(obj, r) {
    const index = basecampSpriteIndex.get(obj.type);
    if (index === undefined || !basecampSpriteAtlas.complete || !basecampSpriteAtlas.naturalWidth) return false;
    const cell = 256;
    const sx = (index % 6) * cell;
    const sy = Math.floor(index / 6) * cell;
    const size = r * (obj.tier === "small" ? 3.25 : obj.tier === "medium" ? 3.45 : obj.tier === "large" ? 3.65 : 3.85);
    ctx.save();
    ctx.fillStyle = "rgba(6, 18, 24, .24)";
    ctx.beginPath();
    ctx.ellipse(0, r * .58, size * .31, size * .105, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(basecampSpriteAtlas, sx, sy, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawBasecampJeep(obj, r) {
    return drawBasecampStandaloneVehicle(basecampJeepSprite, r);
  }

  function drawBasecampStandaloneVehicle(image, r) {
    return drawBasecampStandaloneSprite(image, r, 3.65);
  }

  function drawBasecampStandaloneSprite(image, r, scale) {
    if (!image.complete || !image.naturalWidth) return false;
    const size = r * scale;
    ctx.save();
    ctx.fillStyle = "rgba(6, 18, 24, .2)";
    ctx.beginPath();
    ctx.ellipse(0, r * .56, size * .29, size * .085, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawBasecampExtraSprite(obj, r) {
    const index = basecampExtraIndex.get(obj.type);
    if (index === undefined || !basecampExtraAtlas.complete || !basecampExtraAtlas.naturalWidth) return false;
    const cell = 256;
    const sx = (index % 6) * cell;
    const sy = Math.floor(index / 6) * cell;
    const size = r * (obj.tier === "small" ? 3.25 : obj.tier === "medium" ? 3.45 : obj.tier === "large" ? 3.65 : 3.85);
    ctx.save();
    ctx.fillStyle = "rgba(6, 18, 24, .2)";
    ctx.beginPath();
    ctx.ellipse(0, r * .56, size * .29, size * .085, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(basecampExtraAtlas, sx, sy, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawBasecampWildlife(obj, r) {
    const index = basecampWildlifeIndex.get(obj.type);
    if (index === undefined || !basecampWildlifeAtlas.complete || !basecampWildlifeAtlas.naturalWidth) return false;
    const cell = 256;
    const size = r * (obj.type === "squirrel" ? 4.1 : obj.type === "dog" ? 3.85 : 3.65);
    ctx.save();
    ctx.fillStyle = "rgba(6, 18, 24, .2)";
    ctx.beginPath();
    ctx.ellipse(0, r * .55, size * .3, size * .09, 0, 0, Math.PI * 2);
    ctx.fill();
    if (Math.cos(obj.heading || 0) < 0) ctx.scale(-1, 1);
    const frame = Math.floor((obj.motionPhase || 0) / (Math.PI * .5)) % 4;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(basecampWildlifeAtlas, frame * cell, index * cell, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawMetroSprite(obj, r) {
    const index = metroSpriteIndex.get(obj.type);
    if (index === undefined || !metroSpriteAtlas.complete || !metroSpriteAtlas.naturalWidth) return false;
    const cell = 256;
    const sx = (index % 6) * cell;
    const sy = Math.floor(index / 6) * cell;
    const scale = obj.tier === "small" ? 3.45 : obj.tier === "medium" ? 3.65 : obj.tier === "large" ? 3.85 : 4.05;
    const size = r * scale;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(metroSpriteAtlas, sx, sy, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawMetroExtraSprite(obj, r) {
    const index = metroExtraIndex.get(obj.type);
    if (index === undefined || !metroExtraAtlas.complete || !metroExtraAtlas.naturalWidth) return false;
    const cell = 256;
    const sx = (index % 6) * cell;
    const sy = Math.floor(index / 6) * cell;
    const size = r * (obj.tier === "small" ? 3.45 : obj.tier === "medium" ? 3.65 : obj.tier === "large" ? 3.85 : 4.05);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(metroExtraAtlas, sx, sy, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function drawMetroLife(obj, r) {
    const index = metroLifeIndex.get(obj.type);
    if (index === undefined || !metroLifeAtlas.complete || !metroLifeAtlas.naturalWidth) return false;
    const cell = 256;
    const frame = Math.floor((obj.motionPhase || 0) / (Math.PI * .5)) % 4;
    const size = r * (obj.type === "hotdogVendor" ? 4.5 : obj.type === "pedestrian" ? 4.15 : 3.8);
    ctx.save();
    if (obj.type !== "hotdogVendor" && Math.cos(obj.heading || 0) < 0) ctx.scale(-1, 1);
    if (obj.type === "pedestrian" && obj.colorVariant) ctx.filter = `hue-rotate(${obj.colorVariant * 47}deg)`;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(metroLifeAtlas, frame * cell, index * cell, cell, cell, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  function vehicleColor(type, r) {
    const fill = {
      foodtruck: "#ffcf54",
      jeep: "#526d3f",
      taxi: "#ffd451",
      van: "#9aa7b6",
      bus: "#e89b30",
      utilityTruck: "#e9e4d4",
    }[type] || "#d85b4c";
    vehicle(fill, type === "bus" || type === "foodtruck" ? r * 1.16 : r, type);
    if (type === "jeep") {
      ctx.strokeStyle = "#1f2d1b";
      ctx.beginPath();
      ctx.arc(-r * .74, -r * .52, r * .18, 0, Math.PI * 2);
      ctx.arc(r * .74, -r * .52, r * .18, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function buildingForType(type, r) {
    if (type === "skyscraper") {
      rect("#88939c", r * 1.25, r * 2.7, true);
      ctx.fillStyle = "#cce6ff";
      for (let y = -1; y <= 1; y += 1) {
        ctx.fillRect(-r * .28, y * r * .55, r * .18, r * .22);
        ctx.fillRect(r * .1, y * r * .55, r * .18, r * .22);
      }
      return;
    }
    if (type === "bioDome" || type === "underseaBase") {
      ctx.fillStyle = type === "bioDome" ? "#7ee58b" : "#7ed8e5";
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.25, r, 0, Math.PI, 0);
      ctx.lineTo(r * 1.2, r * .75);
      ctx.lineTo(-r * 1.2, r * .75);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }
    if (type === "alienTemple" || type === "hiveTower") {
      ctx.fillStyle = type === "hiveTower" ? "#8f5fe8" : "#5cd3bd";
      ctx.beginPath();
      ctx.moveTo(0, -r * 1.25);
      ctx.lineTo(r * 1.25, r);
      ctx.lineTo(-r * 1.25, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      return;
    }
    building(type === "building" || type === "lodge" || type === "parkingGarage" ? r * 1.25 : r);
  }

  function streetFixture(type, r) {
    if (type === "hydrant") return hydrant(r);
    if (type === "parkingMeter") return parkingMeter(r);
    if (type === "streetlight") return streetlight(r);
    if (type === "trafficLight") return trafficLight(r);
    if (type === "dumpster") return rect("#466c55", r * 1.9, r * 1.05, true);
    if (type === "bench") return picnic(r * .8);
    if (type === "busStop") return sign(r, false);
    rect("#386a96", r * 1.5, r, true);
  }

  function campfire(r) {
    ctx.fillStyle = "#714320";
    ctx.fillRect(-r * .75, r * .45, r * 1.5, r * .22);
    ctx.fillStyle = "#ff7f2a";
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.bezierCurveTo(r * .8, -r * .2, r * .35, r * .5, 0, r * .55);
    ctx.bezierCurveTo(-r * .7, r * .12, -r * .45, -r * .45, 0, -r);
    ctx.fill();
    ctx.fillStyle = "#ffd451";
    ctx.beginPath();
    ctx.moveTo(0, -r * .55);
    ctx.lineTo(r * .28, r * .35);
    ctx.lineTo(-r * .28, r * .35);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function backpack(r) {
    rect("#7157d8", r * 1.1, r * 1.35, true);
    ctx.strokeStyle = "#f4f1dc";
    ctx.beginPath();
    ctx.arc(0, -r * .42, r * .35, Math.PI, 0);
    ctx.moveTo(-r * .35, r * .1);
    ctx.lineTo(r * .35, r * .1);
    ctx.stroke();
  }

  function hydrant(r) {
    rect("#d9362e", r * .72, r * 1.25, true);
    ctx.fillStyle = "#d9362e";
    ctx.beginPath();
    ctx.arc(0, -r * .7, r * .38, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-r * .62, -r * .18, r * 1.24, r * .28);
  }

  function parkingMeter(r) {
    ctx.strokeStyle = "#26331f";
    ctx.lineWidth = Math.max(2, r * .18);
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(0, -r * .25);
    ctx.stroke();
    ctx.fillStyle = "#bec7c1";
    ctx.beginPath();
    ctx.arc(0, -r * .55, r * .48, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#26331f";
    ctx.fillRect(-r * .08, -r * .74, r * .16, r * .35);
  }

  function streetlight(r) {
    ctx.strokeStyle = "#26331f";
    ctx.lineWidth = Math.max(2, r * .16);
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(0, -r * 1.05);
    ctx.quadraticCurveTo(r * .55, -r * 1.05, r * .65, -r * .62);
    ctx.stroke();
    ctx.fillStyle = "#ffd451";
    ctx.beginPath();
    ctx.arc(r * .65, -r * .55, r * .2, 0, Math.PI * 2);
    ctx.fill();
  }

  function trafficLight(r) {
    rect("#26331f", r * .58, r * 1.55, true);
    ["#ff5d5d", "#ffd451", "#7ee58b"].forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, -r * .48 + index * r * .48, r * .16, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function scooter(r) {
    ctx.strokeStyle = "#26331f";
    ctx.lineWidth = Math.max(2, r * .15);
    ctx.beginPath();
    ctx.arc(-r * .45, r * .5, r * .22, 0, Math.PI * 2);
    ctx.arc(r * .55, r * .5, r * .22, 0, Math.PI * 2);
    ctx.moveTo(-r * .45, r * .35);
    ctx.lineTo(r * .35, r * .35);
    ctx.lineTo(r * .2, -r * .65);
    ctx.stroke();
  }

  function fishShape(type, r, obj = null) {
    const fill = { shark: "#7f8f99", whale: "#536c85", dolphin: "#6aa6bd" }[type] || obj?.schoolColor || "#ff9c42";
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.15, r * .52, 0, 0, Math.PI * 2);
    ctx.moveTo(-r * 1.05, 0);
    ctx.lineTo(-r * 1.65, -r * .55);
    ctx.lineTo(-r * 1.45, 0);
    ctx.lineTo(-r * 1.65, r * .55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#eef";
    ctx.beginPath();
    ctx.arc(r * .55, -r * .12, r * .11, 0, Math.PI * 2);
    ctx.fill();
    if (type === "shark") {
      ctx.fillStyle = "#dfe8ec";
      ctx.beginPath();
      ctx.moveTo(0, -r * .45);
      ctx.lineTo(r * .25, -r * 1.0);
      ctx.lineTo(r * .45, -r * .35);
      ctx.fill();
    }
  }

  function seaObject(type, r) {
    if (type === "coral" || type === "reef") {
      ctx.strokeStyle = "#ff7f9a";
      ctx.lineWidth = Math.max(3, r * .18);
      ctx.beginPath();
      for (let i = -2; i <= 2; i += 1) {
        ctx.moveTo(0, r);
        ctx.quadraticCurveTo(i * r * .25, 0, i * r * .42, -r * (.55 + Math.abs(i) * .12));
      }
      ctx.stroke();
      return;
    }
    if (type === "jellyfish") {
      ctx.fillStyle = "rgba(229, 151, 255, .78)";
      ctx.beginPath();
      ctx.ellipse(0, -r * .25, r, r * .62, 0, Math.PI, 0);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#e597ff";
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * r * .25, r * .15);
        ctx.quadraticCurveTo(i * r * .42, r * .65, i * r * .12, r * 1.1);
        ctx.stroke();
      }
      return;
    }
    if (type === "turtle") return turtle(r);
    if (type === "ray") return ray(r);
    if (type === "anchor") return anchor(r);
    if (type === "treasureChest") return rect("#8b5e32", r * 1.6, r, true);
    if (type === "octopus" || type === "giantSquid") return octopus(r);
    if (type === "shipwreck" || type === "sunkenShip") return vehicle("#7b573d", r * 1.2, "wreck");
    if (type === "starfish") return starShape("#f39a54", r, 5);
    if (type === "shell") return shell(r);
    if (type === "crab") return crab(r);
    if (type === "bubbleCluster") return bubbles(r);
    blob("#7ed8e5", r);
  }

  function spaceObject(type, r) {
    if (type === "satellite" || type === "probe") {
      rect("#c9cfd4", r, r * .65, true);
      ctx.fillStyle = "#4169e1";
      ctx.fillRect(-r * 1.7, -r * .28, r * 1.0, r * .56);
      ctx.fillRect(r * .7, -r * .28, r * 1.0, r * .56);
      ctx.strokeRect(-r * 1.7, -r * .28, r * 1.0, r * .56);
      ctx.strokeRect(r * .7, -r * .28, r * 1.0, r * .56);
      return;
    }
    if (["spaceship", "shuttle", "enterprise", "xwing", "mothership"].includes(type)) return spaceship(type, r);
    if (type === "deathstar") return deathStar(r);
    if (["planet", "smallPlanet", "moon"].includes(type)) return planet(type, r);
    if (type === "comet") {
      blob("#86c7ff", r);
      ctx.strokeStyle = "rgba(134,199,255,.45)";
      ctx.beginPath();
      ctx.moveTo(-r, 0);
      ctx.lineTo(-r * 3, -r * .65);
      ctx.moveTo(-r, 0);
      ctx.lineTo(-r * 3, r * .65);
      ctx.stroke();
      return;
    }
    if (type === "wormholeGate") return portalShape(r);
    if (type === "moonBuggy") return vehicle("#d5d7d9", r * .8, "buggy");
    rect("#9aa7b6", r * 1.5, r, true);
  }

  function alienObject(type, r) {
    if (["crystal", "crystalCluster", "megaCrystal"].includes(type)) return crystal(type, r);
    if (["tinyUfo", "ufo", "hoverDrone"].includes(type)) return ufo(r);
    if (type === "portal") return portalShape(r);
    if (type === "mushroomTower") return mushroom(r);
    if (type === "walker" || type === "crawler" || type === "crawlerQueen" || type === "leviathan") return alienCreature(type, r);
    if (type === "monolith") return rect("#2b2736", r, r * 2.2, true);
    if (type === "plasmaVent") return campfire(r);
    if (type === "eggSac" || type === "spore" || type === "glowPod") return blob(type === "glowPod" ? "#9effd0" : "#d7a3ff", r);
    blob("#9effd0", r);
  }

  function turtle(r) {
    ctx.fillStyle = "#5aa55d";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * .9, r * .65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#79c984";
    for (const [x, y] of [[1, 0], [-.85, -.45], [-.85, .45], [.15, -.75], [.15, .75]]) {
      ctx.beginPath();
      ctx.ellipse(x * r, y * r, r * .24, r * .18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  function ray(r) {
    ctx.fillStyle = "#6c8190";
    ctx.beginPath();
    ctx.moveTo(r * 1.25, 0);
    ctx.quadraticCurveTo(0, -r * 1.1, -r * 1.1, 0);
    ctx.quadraticCurveTo(0, r * 1.1, r * 1.25, 0);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * .9, 0);
    ctx.lineTo(-r * 1.8, r * .18);
    ctx.stroke();
  }

  function anchor(r) {
    ctx.strokeStyle = "#27343c";
    ctx.lineWidth = Math.max(2, r * .18);
    ctx.beginPath();
    ctx.arc(0, -r * .8, r * .22, 0, Math.PI * 2);
    ctx.moveTo(0, -r * .55);
    ctx.lineTo(0, r * .55);
    ctx.moveTo(-r * .7, -r * .08);
    ctx.lineTo(r * .7, -r * .08);
    ctx.moveTo(-r * .85, r * .15);
    ctx.quadraticCurveTo(-r * .55, r * .9, 0, r * .9);
    ctx.quadraticCurveTo(r * .55, r * .9, r * .85, r * .15);
    ctx.stroke();
  }

  function octopus(r) {
    ctx.fillStyle = "#a66ce0";
    ctx.beginPath();
    ctx.ellipse(0, -r * .25, r * .82, r * .9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#a66ce0";
    ctx.lineWidth = Math.max(2, r * .16);
    for (let i = -3; i <= 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * r * .18, r * .35);
      ctx.quadraticCurveTo(i * r * .35, r * .8, i * r * .55, r * 1.05);
      ctx.stroke();
    }
  }

  function shell(r) {
    ctx.fillStyle = "#f0d6b4";
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * .78, 0, Math.PI, 0);
    ctx.lineTo(r, r * .55);
    ctx.lineTo(-r, r * .55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#b08b69";
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, -r * .72);
      ctx.lineTo(i * r * .35, r * .52);
      ctx.stroke();
    }
  }

  function crab(r) {
    ctx.fillStyle = "#e95b48";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * .8, r * .55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#e95b48";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * .75, -r * .15);
      ctx.lineTo(side * r * 1.25, -r * .55);
      ctx.moveTo(side * r * .75, r * .15);
      ctx.lineTo(side * r * 1.25, r * .55);
      ctx.stroke();
    }
  }

  function bubbles(r) {
    ctx.strokeStyle = "rgba(218, 250, 255, .75)";
    ctx.lineWidth = Math.max(1.5, r * .09);
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc((i - 2) * r * .28, Math.sin(i) * r * .35, r * (.16 + i * .035), 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function spaceship(type, r) {
    if (type === "xwing") {
      ctx.fillStyle = "#e7e9ec";
      rect("#e7e9ec", r * 1.7, r * .45, true);
      ctx.strokeStyle = "#d85b4c";
      ctx.beginPath();
      ctx.moveTo(-r * .2, 0);
      ctx.lineTo(-r * 1.2, -r);
      ctx.moveTo(-r * .2, 0);
      ctx.lineTo(-r * 1.2, r);
      ctx.moveTo(r * .2, 0);
      ctx.lineTo(r * 1.2, -r);
      ctx.moveTo(r * .2, 0);
      ctx.lineTo(r * 1.2, r);
      ctx.stroke();
      return;
    }
    if (type === "enterprise") {
      ctx.fillStyle = "#d9dde2";
      ctx.beginPath();
      ctx.ellipse(-r * .45, 0, r * .78, r * .5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      rect("#d9dde2", r * 1.45, r * .28, true);
      ctx.fillStyle = "#d9dde2";
      ctx.fillRect(r * .35, -r * .8, r * .75, r * .22);
      ctx.fillRect(r * .35, r * .58, r * .75, r * .22);
      ctx.strokeRect(r * .35, -r * .8, r * .75, r * .22);
      ctx.strokeRect(r * .35, r * .58, r * .75, r * .22);
      return;
    }
    ctx.fillStyle = type === "mothership" ? "#8f5fe8" : "#c9cfd4";
    ctx.beginPath();
    ctx.moveTo(r * 1.35, 0);
    ctx.lineTo(-r * .85, -r * .7);
    ctx.lineTo(-r * .45, 0);
    ctx.lineTo(-r * .85, r * .7);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#62d8ff";
    ctx.fillRect(-r * .25, -r * .18, r * .55, r * .36);
  }

  function deathStar(r) {
    ctx.fillStyle = "#a9adb2";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#70757b";
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(r, 0);
    ctx.arc(r * .35, -r * .35, r * .23, 0, Math.PI * 2);
    ctx.stroke();
  }

  function planet(type, r) {
    ctx.fillStyle = type === "moon" ? "#c7c1b2" : "#68b88c";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (type !== "moon") {
      ctx.strokeStyle = "rgba(255, 212, 81, .75)";
      ctx.lineWidth = Math.max(2, r * .12);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.45, r * .36, .22, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function portalShape(r) {
    for (let i = 0; i < 4; i += 1) {
      ctx.strokeStyle = `rgba(${126 + i * 24}, ${229 - i * 20}, 255, ${.75 - i * .12})`;
      ctx.lineWidth = Math.max(2, r * (.16 - i * .02));
      ctx.beginPath();
      ctx.ellipse(0, 0, r * (1.05 - i * .14), r * (.78 - i * .09), i * .42, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function crystal(type, r) {
    ctx.fillStyle = type === "megaCrystal" ? "#62d8ff" : "#9f7cff";
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.2);
    ctx.lineTo(r * .72, -r * .2);
    ctx.lineTo(r * .45, r);
    ctx.lineTo(-r * .45, r);
    ctx.lineTo(-r * .72, -r * .2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (type !== "crystal") {
      ctx.save();
      ctx.translate(r * .72, r * .2);
      ctx.scale(.65, .65);
      crystal("crystal", r);
      ctx.restore();
    }
  }

  function ufo(r) {
    ctx.fillStyle = "#a9adb2";
    ctx.beginPath();
    ctx.ellipse(0, r * .1, r * 1.35, r * .42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(126, 229, 255, .82)";
    ctx.beginPath();
    ctx.ellipse(0, -r * .35, r * .62, r * .48, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }

  function mushroom(r) {
    ctx.fillStyle = "#ff74d8";
    ctx.beginPath();
    ctx.ellipse(0, -r * .38, r, r * .55, 0, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    rect("#a7ffd5", r * .48, r * 1.15, true);
  }

  function alienCreature(type, r) {
    ctx.fillStyle = type === "leviathan" ? "#3bd6b0" : "#8f5fe8";
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * .62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd451";
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * r * .35, -r * .18, r * .12, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = ctx.fillStyle;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(side * r * .65, r * .25);
      ctx.lineTo(side * r * 1.2, r * .82);
      ctx.stroke();
    }
  }

  function starShape(fill, r, points = 5) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i += 1) {
      const rr = i % 2 ? r * .45 : r;
      const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  function rect(fill, w, h, stroke = false) {
    ctx.fillStyle = fill;
    roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * .18);
    ctx.fill();
    if (stroke) ctx.stroke();
  }

  function roundRect(x, y, w, h, r) {
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
  }

  function blob(fill, r) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    for (let i = 0; i < 16; i += 1) {
      const a = (i / 16) * Math.PI * 2;
      const rr = r * (.74 + (i % 5) * .045 + Math.sin(i * 1.7) * .055);
      const x = Math.cos(a) * rr;
      const y = Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.22)";
    ctx.lineWidth = Math.max(1, r * .08);
    ctx.beginPath();
    ctx.moveTo(-r * .35, -r * .22);
    ctx.quadraticCurveTo(0, -r * .52, r * .38, -r * .18);
    ctx.stroke();
  }

  function cone(r) {
    ctx.fillStyle = "#ff8a21";
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * .75, r);
    ctx.lineTo(-r * .75, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f4f1dc";
    ctx.lineWidth = Math.max(1.5, r * .12);
    for (const y of [-.25, .35]) {
      ctx.beginPath();
      ctx.moveTo(-r * (.32 + y * .18), r * y);
      ctx.lineTo(r * (.32 + y * .18), r * y);
      ctx.stroke();
    }
    ctx.fillStyle = "#222";
    ctx.fillRect(-r * .9, r * .88, r * 1.8, r * .18);
  }

  function can(fill, r) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(0, -r * .55, r * .7, r * .28, 0, 0, Math.PI * 2);
    ctx.rect(-r * .7, -r * .55, r * 1.4, r * 1.2);
    ctx.ellipse(0, r * .65, r * .7, r * .28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.lineWidth = Math.max(1, r * .07);
    ctx.beginPath();
    ctx.moveTo(-r * .45, -r * .1);
    ctx.lineTo(r * .45, -r * .1);
    ctx.moveTo(-r * .45, r * .3);
    ctx.lineTo(r * .45, r * .3);
    ctx.stroke();
  }

  function shrub(r) {
    ctx.fillStyle = "#4fae58";
    for (let i = 0; i < 9; i += 1) {
      ctx.beginPath();
      ctx.arc(Math.cos(i * 1.7) * r * .38, Math.sin(i * 2.3) * r * .32, r * (.28 + (i % 3) * .055), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(21, 76, 28, .75)";
    ctx.lineWidth = Math.max(1, r * .08);
    ctx.stroke();
  }

  function lantern(r) {
    rect("#ffd451", r, r * 1.2, true);
    ctx.strokeStyle = "#26331f";
    ctx.beginPath();
    ctx.arc(0, -r * .55, r * .45, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.5)";
    ctx.fillRect(-r * .22, -r * .18, r * .44, r * .52);
    ctx.strokeRect(-r * .22, -r * .18, r * .44, r * .52);
  }

  function picnic(r) {
    rect("#8b5e32", r * 2, r * .45, true);
    ctx.fillStyle = "#67401f";
    ctx.fillRect(-r * .9, r * .35, r * 1.8, r * .25);
    ctx.strokeStyle = "#4b2f18";
    ctx.lineWidth = Math.max(1.5, r * .1);
    ctx.beginPath();
    ctx.moveTo(-r * .7, r * .58);
    ctx.lineTo(-r * 1.0, r * 1.05);
    ctx.moveTo(r * .7, r * .58);
    ctx.lineTo(r * 1.0, r * 1.05);
    ctx.moveTo(-r * .7, -r * .15);
    ctx.lineTo(r * .7, -r * .15);
    ctx.stroke();
  }

  function sign(r, giant = false) {
    rect(giant ? "#ffd451" : "#f4f1dc", r * 2, r * .9, true);
    ctx.strokeStyle = giant ? "#7a4b19" : "#4b5f50";
    ctx.lineWidth = Math.max(1.5, r * .09);
    ctx.beginPath();
    ctx.moveTo(-r * .7, -r * .12);
    ctx.lineTo(r * .7, -r * .12);
    ctx.moveTo(-r * .55, r * .18);
    ctx.lineTo(r * .55, r * .18);
    ctx.stroke();
    ctx.strokeStyle = "#5b4632";
    ctx.beginPath();
    ctx.moveTo(0, r * .45);
    ctx.lineTo(0, r * (giant ? 1.6 : 1.25));
    ctx.stroke();
  }

  function tent(r) {
    ctx.fillStyle = "#8f7ce8";
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 1.2, r);
    ctx.lineTo(-r * 1.2, r);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(0, r);
    ctx.moveTo(-r * .48, r * .2);
    ctx.lineTo(0, -r * .25);
    ctx.lineTo(r * .48, r * .2);
    ctx.stroke();
    ctx.strokeStyle = "rgba(38,51,31,.45)";
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, r);
    ctx.lineTo(-r * 1.45, r * 1.25);
    ctx.moveTo(r * 1.2, r);
    ctx.lineTo(r * 1.45, r * 1.25);
    ctx.stroke();
  }

  function bike(r) {
    ctx.strokeStyle = "#26331f";
    ctx.lineWidth = Math.max(2, r * .16);
    ctx.beginPath();
    ctx.arc(-r * .55, r * .35, r * .34, 0, Math.PI * 2);
    ctx.arc(r * .55, r * .35, r * .34, 0, Math.PI * 2);
    ctx.moveTo(-r * .55, r * .35);
    ctx.lineTo(0, -r * .25);
    ctx.lineTo(r * .55, r * .35);
    ctx.lineTo(-r * .05, r * .35);
    ctx.closePath();
    ctx.moveTo(0, -r * .25);
    ctx.lineTo(r * .18, -r * .62);
    ctx.moveTo(r * .18, -r * .62);
    ctx.lineTo(r * .55, -r * .62);
    ctx.moveTo(-r * .05, -r * .1);
    ctx.lineTo(-r * .34, -r * .32);
    ctx.stroke();
  }

  function vehicle(fill, r, type = "car") {
    const long = ["bus", "foodtruck", "rv", "trailer", "wreck"].includes(type);
    rect(fill, r * (long ? 2.85 : 2.25), r * 1.18, true);
    ctx.fillStyle = "rgba(220,245,255,.72)";
    const windowCount = long ? 4 : 2;
    for (let i = 0; i < windowCount; i += 1) {
      const x = -r * (long ? 1.05 : .55) + i * r * .55;
      ctx.fillRect(x, -r * .48, r * .38, r * .32);
      ctx.strokeRect(x, -r * .48, r * .38, r * .32);
    }
    ctx.fillStyle = "#1a1d1b";
    for (const x of [-(long ? 1.05 : .8), long ? .85 : .45]) {
      ctx.beginPath();
      ctx.arc(x * r, r * .61, r * .22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#c9cfd4";
      ctx.beginPath();
      ctx.arc(x * r, r * .61, r * .09, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a1d1b";
    }
    ctx.fillStyle = "rgba(255,255,255,.45)";
    ctx.fillRect(r * .78, -r * .12, r * .2, r * .24);
    ctx.fillStyle = "rgba(255,212,81,.7)";
    ctx.fillRect(r * (long ? 1.23 : .94), r * .16, r * .16, r * .14);
  }

  function building(r) {
    rect("#c9bda8", r * 2.2, r * 1.65, true);
    ctx.fillStyle = "#e8dfcb";
    for (let y = -1; y <= 1; y += 1) {
      for (let x = -1; x <= 1; x += 1) {
        ctx.fillRect(x * r * .5 - r * .12, y * r * .38 - r * .1, r * .24, r * .2);
        ctx.strokeRect(x * r * .5 - r * .12, y * r * .38 - r * .1, r * .24, r * .2);
      }
    }
    ctx.fillStyle = "#73543a";
    ctx.fillRect(-r * .12, r * .44, r * .24, r * .38);
  }

  function pump(r) {
    rect("#e95b48", r, r * 1.6, true);
    ctx.fillStyle = "#f4f1dc";
    ctx.fillRect(-r * .25, -r * .45, r * .5, r * .38);
    ctx.strokeStyle = "#26331f";
    ctx.beginPath();
    ctx.moveTo(r * .45, -r * .28);
    ctx.quadraticCurveTo(r * 1.05, -r * .05, r * .72, r * .55);
    ctx.stroke();
  }

  function waterTower(r) {
    ctx.fillStyle = "#65b8cc";
    ctx.beginPath();
    ctx.ellipse(0, -r * .45, r, r * .62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-r * .55, r * .2);
    ctx.lineTo(-r * .85, r * 1.3);
    ctx.moveTo(r * .55, r * .2);
    ctx.lineTo(r * .85, r * 1.3);
    ctx.stroke();
  }

  function bridge(r) {
    rect("#8d8070", r * 2.8, r * .8, true);
    ctx.strokeStyle = "#f3f2df";
    ctx.beginPath();
    ctx.moveTo(-r * 1.2, -r * .35);
    ctx.lineTo(r * 1.2, r * .35);
    ctx.moveTo(-r * 1.2, r * .35);
    ctx.lineTo(r * 1.2, -r * .35);
    ctx.stroke();
  }

  function drawParticles() {
    const view = state.viewBounds;
    for (const particle of state.particles) {
      if (view && (particle.x < view.left || particle.x > view.right || particle.y < view.top || particle.y > view.bottom)) continue;
      ctx.globalAlpha = Math.max(0, particle.life / particle.max);
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayers(now) {
    for (const actor of [...state.opponents, state.player].filter(Boolean)) drawPlayer(actor, now);
  }

  function drawPlayer(p, now) {
    const respawning = now < (p.respawnUntil || 0);
    const wobble = Math.sin((now || 0) / 180 + (p.mark || "").charCodeAt(0)) * 1.5;
    const r = Math.max(8, p.radius + wobble) * (respawning ? .72 + Math.sin(now / 80) * .08 : 1);
    const grd = ctx.createRadialGradient(p.x, p.y, r * .15, p.x, p.y, r * 1.15);
    grd.addColorStop(0, "#000000");
    grd.addColorStop(.58, "#020503");
    grd.addColorStop(.72, "#17261c");
    grd.addColorStop(.84, p.color || "#7ee58b");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 1.18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(247,255,240,.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * .92, 0, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 15px Trebuchet MS";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(0,0,0,.72)";
    ctx.fillStyle = p.color || "#f7fff0";
    const label = `${p.name || p.mark} ${p.score || 0}`;
    ctx.strokeText(label, p.x, p.y - r - 12);
    ctx.fillText(label, p.x, p.y - r - 12);
    ctx.restore();
  }

  function drawMinimap(camX, camY) {
    if (!state.player || state.mode === "menu" || state.mode === "countdown") return;
    const mapWidth = Math.min(214, Math.max(154, state.width * .2));
    const mapHeight = mapWidth * (world.height / world.width);
    const x = state.width - mapWidth - 18;
    const y = state.height - mapHeight - 18;
    const sx = mapWidth / world.width;
    const sy = mapHeight / world.height;
    ctx.save();
    ctx.fillStyle = "rgba(7, 17, 28, .86)";
    ctx.strokeStyle = "rgba(132, 205, 255, .6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 8, y - 8, mapWidth + 16, mapHeight + 16, 12);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.rect(x, y, mapWidth, mapHeight);
    ctx.clip();
    ctx.fillStyle = state.environment?.id === "campsite" ? "#577c54" : state.environment?.id === "city" ? "#777b78" : "#26384b";
    ctx.fillRect(x, y, mapWidth, mapHeight);
    if (state.environment?.id === "campsite") {
      ctx.strokeStyle = "rgba(220, 200, 145, .72)";
      ctx.lineWidth = 2.5;
      for (const road of basecampRoads) {
        ctx.beginPath();
        ctx.moveTo(x + road[0].x * sx, y + road[0].y * sy);
        for (let i = 1; i < road.length; i += 1) ctx.lineTo(x + road[i].x * sx, y + road[i].y * sy);
        ctx.stroke();
      }
    } else if (state.environment?.id === "city") {
      ctx.strokeStyle = "rgba(38, 43, 45, .88)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const roadX of metroRoadX) {
        ctx.moveTo(x + roadX * sx, y);
        ctx.lineTo(x + roadX * sx, y + mapHeight);
      }
      for (const roadY of metroRoadY) {
        ctx.moveTo(x, y + roadY * sy);
        ctx.lineTo(x + mapWidth, y + roadY * sy);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(92, 137, 79, .9)";
      for (const park of metroParks) ctx.fillRect(x + park.x * sx, y + park.y * sy, park.w * sx, park.h * sy);
    }
    const colors = { small: "#d7efb4", medium: "#68d8df", large: "#ffc35a", huge: "#ff7b6d" };
    for (const object of state.objects) {
      if (object.swallowed) continue;
      ctx.globalAlpha = object.tier === "small" ? .38 : .82;
      ctx.fillStyle = colors[object.tier] || "#ffffff";
      const dot = object.tier === "huge" ? 2.4 : object.tier === "large" ? 1.8 : 1.15;
      ctx.fillRect(x + object.x * sx - dot / 2, y + object.y * sy - dot / 2, dot, dot);
    }
    ctx.globalAlpha = 1;
    const zoom = state.camera.zoom || 1;
    const viewWidth = Math.min(world.width, state.width / zoom);
    const viewHeight = Math.min(world.height, state.height / zoom);
    ctx.strokeStyle = "rgba(255,255,255,.48)";
    ctx.lineWidth = 1;
    ctx.strokeRect(
      x + Math.max(0, camX - viewWidth / 2) * sx,
      y + Math.max(0, camY - viewHeight / 2) * sy,
      viewWidth * sx,
      viewHeight * sy,
    );
    const px = x + state.player.x * sx;
    const py = y + state.player.y * sy;
    ctx.fillStyle = "#7ee58b";
    ctx.strokeStyle = "#07111c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawPaused() {
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(0, 0, state.width, state.height);
    ctx.fillStyle = "#f7fff0";
    ctx.textAlign = "center";
    ctx.font = "900 64px Trebuchet MS";
    ctx.fillText("Paused", state.width / 2, state.height / 2);
  }

  function pointerDown(event) {
    if (state.mode !== "playing") return;
    state.input.pointerId = event.pointerId;
    state.input.originX = event.clientX;
    state.input.originY = event.clientY;
    $("joystick").hidden = false;
    $("joystick").style.left = `${event.clientX}px`;
    $("joystick").style.top = `${event.clientY}px`;
    pointerMove(event);
    canvas.setPointerCapture?.(event.pointerId);
  }

  function pointerMove(event) {
    if (state.input.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.input.originX;
    const dy = event.clientY - state.input.originY;
    const max = 48;
    const len = Math.hypot(dx, dy) || 1;
    const clamped = Math.min(max, len);
    state.input.x = (dx / len) * (clamped / max);
    state.input.y = (dy / len) * (clamped / max);
    $("joystickKnob").style.transform = `translate(${(dx / len) * clamped}px, ${(dy / len) * clamped}px)`;
  }

  function pointerUp(event) {
    if (state.input.pointerId !== event.pointerId) return;
    state.input.pointerId = null;
    state.input.x = 0;
    state.input.y = 0;
    $("joystickKnob").style.transform = "";
    $("joystick").hidden = true;
  }

  function bind() {
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && state.mode === "playing") togglePause();
    });
    document.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", " "].includes(key)) event.preventDefault();
      if (key === " " || key === "escape") return togglePause();
      state.input.keys.add(key);
    });
    document.addEventListener("keyup", (event) => state.input.keys.delete(event.key.toLowerCase()));
    canvas.addEventListener("pointerdown", pointerDown);
    canvas.addEventListener("pointermove", pointerMove);
    canvas.addEventListener("pointerup", pointerUp);
    canvas.addEventListener("pointercancel", pointerUp);
    $("soloButton").addEventListener("click", startSolo);
    $("againButton").addEventListener("click", () => { playSound("ui"); showStart(); });
    $("howButton").addEventListener("click", showHow);
    $("howBackButton").addEventListener("click", () => { playSound("ui"); showStart(); });
    $("pauseButton").addEventListener("click", () => { unlockAudio(); togglePause(); });
  }

  function init() {
    resize();
    generateWorld();
    state.player = createPlayer();
    state.camera.x = state.player.x;
    state.camera.y = state.player.y;
    state.camera.zoom = 1.5;
    bind();
    updateHud();
    render();
  }

  init();
})();
