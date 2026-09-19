import { makeCircuit, circuitCurve } from "./circuit.js?v=39";
import { integrateHandling, cornerLimit } from './handling.js?v=39';
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
export const LANES = [-0.72, -0.24, 0.24, 0.72];
export const DIFFICULTIES = {
  easy: { traffic: 1, damage: 25, pace: 0.91, grip: 1.1, fuel: 0.65 },
  normal: { traffic: 1.18, damage: 35, pace: 1, grip: 1, fuel: 0.8 },
  hard: { traffic: 1.42, damage: 100, pace: 1.09, grip: 0.92, fuel: 0.95 },
};
// Each section is [metres, curvature]. Transitions ease over the first 35 metres.
// Long straights separate corners; the opening stage is intentionally forgiving.
export const ROUTES = [
  {
    name: "Neon District",
    theme: "city",
    accent: 0x66e8ff,
    laps: 2,
    sections: [
      [220, 0],
      [130, 0.28],
      [160, 0],
      [150, -0.32],
      [180, 0],
      [130, 0.22],
      [150, 0],
      [130, -0.18],
    ],
  },
  {
    name: "River Causeway",
    theme: "river",
    accent: 0x5af0ce,
    laps: 2,
    sections: [
      [190, 0],
      [170, 0.35],
      [220, 0],
      [160, -0.4],
      [160, 0],
      [140, 0.3],
      [180, 0],
      [130, -0.25],
    ],
  },
  {
    name: "Work Zone",
    theme: "work",
    accent: 0xffc44f,
    laps: 2,
    sections: [
      [180, 0],
      [130, -0.42],
      [160, 0],
      [130, 0.5],
      [210, 0],
      [160, -0.35],
      [170, 0],
      [150, 0.3],
    ],
  },
  {
    name: "Midnight Tunnel",
    theme: "tunnel",
    accent: 0xa77bff,
    laps: 2,
    sections: [
      [230, 0],
      [180, 0.4],
      [150, 0],
      [180, -0.48],
      [190, 0],
      [150, 0.5],
      [170, 0],
      [180, -0.32],
    ],
  },
  {
    name: "Storm Belt",
    theme: "storm",
    accent: 0x72baff,
    laps: 2,
    sections: [
      [180, 0],
      [180, -0.48],
      [190, 0],
      [150, 0.58],
      [170, 0],
      [180, -0.5],
      [200, 0],
      [160, 0.4],
    ],
  },
  {
    name: "Metro Express",
    theme: "express",
    accent: 0xff5bc8,
    laps: 3,
    sections: [
      [260, 0],
      [170, 0.55],
      [210, 0],
      [160, -0.62],
      [200, 0],
      [180, 0.48],
      [240, 0],
      [160, -0.4],
    ],
  },
].map((r) => ({ ...r, length: r.sections.reduce((s, c) => s + c[0], 0) }));

export function curveAt(route, distance) {
  if (route.circuit) return circuitCurve(route, distance);
  let z = ((distance % route.length) + route.length) % route.length;
  for (let i = 0; i < route.sections.length; i++) {
    const [length, curve] = route.sections[i];
    if (z < length) {
      const previous =
        route.sections[
          (i + route.sections.length - 1) % route.sections.length
        ][1];
      const t = clamp(z / 35, 0, 1);
      return previous + (curve - previous) * t * t * (3 - 2 * t);
    }
    z -= length;
  }
  return 0;
}
export function safeSpeed(route, distance) {
  if(route.circuit)return Math.min(100,...[0,15,35,65].map(d=>cornerLimit(curveAt(route,distance+d)*.012)));
  return Math.max(
    30,
    69 -
      Math.max(
        ...[0, 20, 40].map((d) => Math.abs(curveAt(route, distance + d))),
      ) *
        43,
  );
}
export function sweptContact(a, b, width = 0.25, length = 3.6) {
  const before = a.prevZ - b.prevZ,
    after = a.z - b.z,
    change = after - before;
  let enter = 0,
    exit = 1;
  if (Math.abs(change) < 1e-9) {
    if (Math.abs(before) > length) return false;
  } else {
    let lo = (-length - before) / change,
      hi = (length - before) / change;
    if (lo > hi) [lo, hi] = [hi, lo];
    enter = Math.max(0, lo);
    exit = Math.min(1, hi);
    if (enter > exit) return false;
  }
  const dx0 = a.prevX - b.prevX,
    dx1 = a.x - b.x,
    at = (t) => dx0 + (dx1 - dx0) * t;
  return (
    Math.min(Math.abs(at(enter)), Math.abs(at(exit))) < width ||
    at(enter) * at(exit) <= 0
  );
}
export class Run {
  constructor({
    mode = "highway",
    stage = 0,
    difficulty = "normal",
    seed = 9137,
  } = {}) {
    this.mode = mode === "race" ? "race" : "highway";
    this.stage = clamp(Math.floor(stage) || 0, 0, 5);
    this.route =
      this.mode === "race"
        ? makeCircuit(ROUTES[this.stage], this.stage)
        : ROUTES[this.stage];
    this.difficulty = DIFFICULTIES[difficulty] ? difficulty : "normal";
    this.rules = DIFFICULTIES[this.difficulty];
    this.seed = seed >>> 0;
    this.phase = "countdown";
    this.paused = false;
    this.countdown = 3;
    this.time = 0;
    this.goal =
      this.route.length * (this.mode === "race" ? this.route.laps : 1);
    this.score = 0;
    this.fuel = 100;
    this.health = 100;
    this.boost = 35;
    this.draft = 0;
    this.combo = 1;
    this.recovery = 0;
    this.collisions = 0;
    this.nearMisses = 0;
    this.events = [];
    this.traffic = [];
    this.pickups = [];
    this.nextWave = 130;
    this.nextPickup = 110;
    this.wave = 0;
    this.id = 0;
    this.lastPass = 0;
    this.finishWait = 0;
    this.lapTimes = [];
    this.lapStart = 0;
    this.lap = 1;
    this.overtakes = new Set();
    this.shield = false;
    this.cards = 0;
    this.player = {
      id: "you",
      name: "YOU",
      x: -0.24,
      prevX: -0.24,
      z: 0,
      prevZ: 0,
      speed: 0,
      finish: null,
    };
    this.rivals =
      this.mode === "race"
        ? ["MUSCLE", "RALLY", "EXOTIC"].map((name, i) => ({
            id: name,
            name,
            x: LANES[i === 0 ? 0 : i + 1],
            prevX: LANES[i === 0 ? 0 : i + 1],
            z: 5 + i * 6,
            prevZ: 5 + i * 6,
            speed: 0,
            finish: null,
            pace: 1 + (i - 1) * 0.025,
            texture: ["rival-muscle", "rival-rally", "rival-exotic"][i],
          }))
        : [];
  }
  random() {
    this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0;
    return this.seed / 4294967296;
  }
  emit(type, data = {}) {
    this.events.push({ type, ...data });
  }
  drain() {
    return this.events.splice(0);
  }
  get position() {
    return this.standings().findIndex((a) => a.id === "you") + 1;
  }
  standings() {
    return [this.player, ...this.rivals]
      .slice()
      .sort((a, b) =>
        a.finish !== null && b.finish !== null
          ? a.finish - b.finish
          : a.finish !== null
            ? -1
            : b.finish !== null
              ? 1
              : b.z - a.z,
      );
  }
  finishActor(actor, before, dt) {
    if (actor.finish !== null || actor.z < this.goal) return;
    actor.finish =
      this.time -
      dt +
      dt *
        clamp((this.goal - before) / Math.max(0.0001, actor.z - before), 0, 1);
    actor.z = this.goal;
    actor.speed = 0;
  }
  end(reason) {
    if (this.phase === "finished" || this.phase === "lost") return;
    this.reason = reason;
    this.phase = reason === "complete" ? "finished" : "lost";
    this.emit("end", { win: this.phase === "finished" });
  }
  spawnWave() {
    // Reserve a two-lane corridor. Static lane assignments cannot close it later.
    const safe = this.wave++ % 2;
    const open = safe === 0 ? [0, 1] : [2, 3],
      occupied = LANES.map((_, i) => i).filter((i) => !open.includes(i));
    const count = this.stage < 2 ? 1 : 2;
    const offset = Math.floor(this.random() * 2);
    for (let i = 0; i < count; i++) {
      const lane = occupied[(i + offset) % 2],
        z = this.nextWave + 18 * this.time + i * 10;
      this.traffic.push({
        id: ++this.id,
        wave: this.wave,
        lane,
        x: LANES[lane],
        prevX: LANES[lane],
        z,
        prevZ: z,
        speed: 18,
        texture: [
          "traffic-sedan",
          "traffic-beetle",
          "traffic-jeep",
          "traffic-pickup",
          "traffic-van",
          "traffic-truck",
        ][Math.floor(this.random() * Math.min(6, 2 + this.stage))],
        passed: false,
        open,
      });
    }
    this.nextWave += Math.max(60, 96 - this.stage * 4) / this.rules.traffic;
  }
  hit() {
    if (
      this.recovery > 0 ||
      this.phase !== "playing" ||
      this.player.finish !== null
    )
      return;
    this.recovery = 1.1;
    if (this.shield) {
      this.shield = false;
      this.emit("shield-hit");
      return;
    }
    this.collisions++;
    this.player.speed *= 0.55;
    this.combo = 1;
    this.boost = Math.max(0, this.boost - 15);
    if (this.mode === "highway")
      this.health = Math.max(0, this.health - this.rules.damage);
    this.emit("hit");
    if (this.health === 0) this.end("wrecked");
  }
  update(dt, input = {}) {
    if (this.paused || ["finished", "lost"].includes(this.phase)) return;
    if (this.phase === "countdown") {
      this.countdown = Math.max(0, this.countdown - dt);
      if (this.countdown <= 1e-8) {
        this.phase = "playing";
        this.emit("go");
      }
      return;
    }
    this.time += dt;
    this.recovery = Math.max(0, this.recovery - dt);
    const p = this.player;
    p.prevX = p.x;
    p.prevZ = p.z;
    if (p.finish === null) {
      const curve = curveAt(this.route, p.z),
        safe = safeSpeed(this.route, p.z),
        brake = !!input.brake;
      const boosting = !!input.boost && (this.car?.unlimitedNitro||this.boost > 0) && !brake && this.car?.boost !== 0;
      this.boosting = boosting;
      const throttle = this.mode === "highway" || input.throttle;
      const car = this.car || {};
      let target = brake ? (this.careerId?0:20) : throttle ? 66 * (car.speed || 1) : this.careerId?0:43;
      if (boosting) target += 18 * (car.boost || 1);
      const edge = Math.abs(p.x) > 0.89,
        over = Math.max(0, p.speed - safe);
      if (edge) target = Math.min(target, 30);
      p.speed += clamp(target - p.speed, -(brake ? 42 * (car.brake || 1) : 18) * dt, 24 * (car.accel || 1) * dt);
      let steer = clamp(Number(input.steer) || 0, -1, 1);
      if (this.mode!=='race'&&Number.isFinite(input.targetX))
        steer = clamp((input.targetX - p.x) * 4, -1, 1);
      const grip =
        (this.rules.grip * (car.grip || 1) * (this.route.theme === "storm" ? 0.86 : 1)) /
        (1 + over * 0.025);
      if(this.mode==='race') {
        const surface=Math.abs(p.x)>.95?.65:1;
        if(integrateHandling(p,dt,steer,curve*.012,this.rules.grip*(car.grip||1)*surface,!!input.drift,!!car.perfectGrip))this.hit();
      } else {
      p.x = clamp(
        p.x + steer * 1.3 * grip * dt - curve * (p.speed / 66) ** 2 * 0.4 * dt,
        -1.05,
        1.05,
      );
      p.z += p.speed * dt;
      }
      if(car.unlimitedNitro)this.boost=100;
      else if (boosting) this.boost = Math.max(0, this.boost - 23 * dt);
      else this.boost = Math.min(100, this.boost + 2.5 * dt);
      this.score += p.speed * dt * 0.35;
      if (this.mode === "highway")
        this.fuel = Math.max(
          0,
          this.fuel - this.rules.fuel * dt * (boosting ? 1.35 : 1),
        );
      const lap = Math.min(
        this.route.laps + 1,
        Math.floor(p.z / this.route.length) + 1,
      );
      if (this.mode === "race" && lap > this.lap) {
        const crossed =
          this.time -
          dt +
          dt *
            clamp(
              (this.lap * this.route.length - p.prevZ) /
                Math.max(0.0001, p.z - p.prevZ),
              0,
              1,
            );
        this.lapTimes.push(crossed - this.lapStart);
        this.lapStart = crossed;
        this.lap = lap;
        this.emit("lap");
      }
      this.finishActor(p, p.prevZ, dt);
    }
    for (const rival of this.rivals) {
      rival.prevX = rival.x;
      rival.prevZ = rival.z;
      if (rival.finish !== null) continue;
      const safe = safeSpeed(this.route, rival.z),spec=rival.performance,
        pace=(rival.racePace||1)*rival.pace,
        target = spec ? Math.min(66*spec.speed*pace,safe*(rival.cornerPace||.74)*Math.sqrt(spec.grip)*pace)
          : Math.min(65*this.rules.pace*rival.pace,safe*.78*this.rules.pace*rival.pace,safe*.9);
      rival.speed += clamp(target - rival.speed, -(spec?42*spec.brake:30) * dt, (spec?24*spec.accel:(this.rules.acceleration||22)) * dt);
      const ahead = [p, ...this.rivals].find(
        (a) =>
          a !== rival &&
          a.finish === null &&
          a.z > rival.z &&
          a.z - rival.z < 20 &&
          Math.abs(a.x - rival.x) < 0.27,
      );
      if (ahead) {
        const choices = LANES.filter((x) => Math.abs(x - ahead.x) > 0.35);
        const free = choices.find(
          (x) =>
            ![p, ...this.rivals].some(
              (a) =>
                a !== rival &&
                Math.abs(a.z - rival.z) < 12 &&
                Math.abs(a.x - x) < 0.3,
            ),
        );
        if (free !== undefined) rival.target = free;
        else rival.speed = Math.min(rival.speed, ahead.speed);
      }
      if (rival.target !== undefined)
        rival.x += clamp(rival.target - rival.x, -0.6 * dt, 0.6 * dt);
      rival.z += rival.speed * dt;
      this.finishActor(rival, rival.prevZ, dt);
      if (
        p.finish === null &&
        rival.finish === null &&
        sweptContact(p, rival)
      ) {
        this.hit();
        rival.speed *= 0.75;
      }
      if (
        p.prevZ <= rival.prevZ &&
        p.z > rival.z &&
        !this.overtakes.has(rival.id)
      ) {
        this.overtakes.add(rival.id);
        this.score += 200;
        this.emit("overtake");
      }
    }
    if (this.phase === "lost") return;
    if(this.careerId && this.mode==='race') {
      while(this.nextPickup<p.z+180 && this.nextPickup<this.goal-100) {
        const lane=LANES[Math.floor(this.nextPickup/240)%4];
        this.pickups.push({id:++this.id,x:lane,prevX:lane,z:this.nextPickup,prevZ:this.nextPickup,type:'card'});
        this.nextPickup+=600;
      }
      for(const pickup of this.pickups) if(!pickup.dead&&sweptContact(p,pickup,0.28,2.5)) {
        pickup.dead=true;this.cashCollected=Math.min(600,(this.cashCollected||0)+50);this.emit('cash');
      }
      this.pickups=this.pickups.filter(c=>!c.dead&&c.z>p.z-20);
    }
    if (this.mode === "highway") {
      while (
        this.nextWave + 18 * this.time < p.z + 220 &&
        this.nextWave < this.goal - 80
      )
        this.spawnWave();
      while (this.nextPickup < p.z + 180 && this.nextPickup < this.goal - 140) {
        const n = Math.round((this.nextPickup - 110) / 240),
          lane = LANES[(n + 1) % 4];
        this.pickups.push(
          {
            id: ++this.id,
            x: lane,
            prevX: lane,
            z: this.nextPickup,
            prevZ: this.nextPickup,
            type: "fuel",
          },
          {
            id: ++this.id,
            x: -lane,
            prevX: -lane,
            z: this.nextPickup + 90,
            prevZ: this.nextPickup + 90,
            type: n % 3 === 0 ? "shield" : "card",
          },
        );
        this.nextPickup += 240;
      }
      for (const car of this.traffic) {
        car.prevZ = car.z;
        car.prevX = car.x;
        car.z += car.speed * dt;
        if (sweptContact(p, car, 0.25, 3.8)) this.hit();
        if (!car.passed && p.z > car.z + 4) {
          car.passed = true;
          const near = Math.abs(p.x - car.x) < 0.48 && this.recovery === 0;
          if (near) {
            this.nearMisses++;
            this.combo = Math.min(5, this.combo + 1);
            this.score += 150 * this.combo;
            this.boost = Math.min(100, this.boost + 12);
            this.emit("near");
          } else this.score += 40;
        }
      }
      for (const pickup of this.pickups) {
        if (!pickup.dead && sweptContact(p, pickup, 0.28, 2.5)) {
          pickup.dead = true;
          if (pickup.type === "fuel") this.fuel = Math.min(100, this.fuel + 25);
          else if (pickup.type === "shield") this.shield = true;
          else {
            this.cards++;
            this.boost = Math.min(100, this.boost + 12);
          }
          this.score += pickup.type === "card" ? 250 : 100;
          this.emit(pickup.type);
        }
      }
      this.traffic = this.traffic.filter((c) => c.z > p.z - 30);
      this.pickups = this.pickups.filter((c) => !c.dead && c.z > p.z - 20);
    }
    const drafting = [...this.rivals, ...this.traffic].some(
      (a) =>
        a.finish == null &&
        a.z - p.z > 7 &&
        a.z - p.z < 28 &&
        Math.abs(a.x - p.x) < 0.22,
    );
    this.draft = clamp(this.draft + (drafting ? 35 : -30) * dt, 0, 100);
    if (drafting && p.finish === null) {
      this.boost = Math.min(100, this.boost + 9 * dt);
      p.speed = Math.min(86, p.speed + 3 * dt);
    }
    if (this.phase === "lost") return;
    if (p.finish !== null) {
      this.boosting = false;
      if (this.mode === "highway") {
        this.score += 1000 + this.health * 10;
        this.end("complete");
      } else {
        // The player's placing is final at the line. Remaining opponents are
        // behind; waiting for them only strands the player on a frozen track.
        this.score += (5 - this.position) * 1000;
        this.end("complete");
      }
    } else if (this.mode === "highway" && this.fuel <= 0) this.end("fuel");
    else if (this.time > (this.careerId?Math.max(240,this.goal/20+60):240)) this.end("timeout");
  }
}
