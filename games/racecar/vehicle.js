import * as THREE from "../vendor/three/three.module.min.js";
import { mergeGeometries } from "../vendor/three/addons/utils/BufferGeometryUtils.js";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// Local nose is -Z. Geometry/materials are shared by every car in this factory.
export class VehicleFactory {
  constructor() {
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.tire = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 16);
    this.rim = new THREE.CylinderGeometry(0.25, 0.25, 0.315, 12);
    this.shadow = new THREE.CircleGeometry(1, 32);
    this.materials = new Map();
    this.hulls = new Map();
    this.flameGeometry = new THREE.ConeGeometry(0.12, 0.65, 6);
    this.flameMaterial = new THREE.MeshBasicMaterial({ color: 0x65dfff });
  }
  mat(color, metalness = 0.2, roughness = 0.4) {
    const key = [color, metalness, roughness].join(":");
    if (!this.materials.has(key))
      this.materials.set(
        key,
        new THREE.MeshStandardMaterial({ color, metalness, roughness }),
      );
    return this.materials.get(key);
  }
  boxAt(parent, size, position, mat) {
    const m = new THREE.Mesh(this.box, mat);
    m.scale.set(...size);
    m.position.set(...position);
    parent.add(m);
    return m;
  }
  shell(sections, mat, parent) {
    const key = JSON.stringify(sections);
    if (this.hulls.has(key)) {
      const mesh = new THREE.Mesh(this.hulls.get(key), mat);
      parent.add(mesh);
      return mesh;
    }
    const vertices = [],
      indices = [];
    for (const [z, w, bottom, top] of sections) {
      const bevel = 0.1;
      for (const [x, y] of [
        [-w + bevel, bottom],
        [-w, bottom + bevel],
        [-w, top - bevel],
        [-w + bevel, top],
        [w - bevel, top],
        [w, top - bevel],
        [w, bottom + bevel],
        [w - bevel, bottom],
      ])
        vertices.push(x, y, z);
    }
    for (let r = 0; r < sections.length - 1; r++)
      for (let k = 0; k < 8; k++) {
        const a = r * 8 + k,
          b = r * 8 + ((k + 1) % 8),
          c = a + 8,
          d = b + 8;
        indices.push(a, c, b, b, c, d);
      }
    for (let k = 1; k < 7; k++) {
      indices.push(0, k, k + 1);
      const n = (sections.length - 1) * 8;
      indices.push(n, n + k + 1, n + k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    this.hulls.set(key, g);
    const m = new THREE.Mesh(g, mat);
    parent.add(m);
    return m;
  }
  batch(parent) {
    const groups = new Map();
    for (const mesh of [...parent.children]) {
      if (!mesh.isMesh) continue;
      mesh.updateMatrix();
      const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrix);
      geometry.deleteAttribute("uv");
      if (!groups.has(mesh.material)) groups.set(mesh.material, []);
      groups.get(mesh.material).push(geometry);
      parent.remove(mesh);
    }
    for (const [mat, parts] of groups) {
      const geometry = mergeGeometries(parts, false),
        mesh = new THREE.Mesh(geometry, mat);
      mesh.userData.ownedGeometry = true;
      parent.add(mesh);
      parts.forEach((g) => g.dispose());
    }
  }
  create(color = 0x2478de, type = "coupe") {
    const root = new THREE.Group(),
      body = new THREE.Group();
    root.add(body);
    const paint = this.mat(color, 0.35, 0.26),
      dark = this.mat(0x101b25, 0.15, 0.65),
      glass = this.mat(0x163c54, 0.65, 0.15),
      silver = this.mat(0x9baeba, 0.7, 0.3);
    this.shell(
      [
        [-2.2, 0.82, 0.43, 0.69],
        [-1.55, 0.99, 0.43, 0.82],
        [-0.6, 1.04, 0.43, 0.96],
        [0.7, 1.04, 0.43, 0.94],
        [1.65, 0.97, 0.43, 0.87],
        [2.15, 0.86, 0.43, 0.73],
      ],
      paint,
      body,
    );
    this.shell(
      [
        [-1, 0.74, 0.85, 1.03],
        [-0.35, 0.73, 0.87, 1.53],
        [0.55, 0.71, 0.88, 1.53],
        [1.13, 0.75, 0.86, 1.02],
      ],
      glass,
      body,
    );
    this.boxAt(body, [1.28, 0.075, 0.82], [0, 1.55, 0.12], paint);
    for (const side of [-1, 1]) {
      this.boxAt(body, [0.08, 0.58, 0.08], [side * 0.71, 1.24, 0.38], paint);
      this.boxAt(body, [0.25, 0.13, 0.3], [side * 0.95, 1.12, -0.55], paint);
      this.boxAt(body, [0.07, 0.12, 2.1], [side * 1.04, 0.54, 0], dark);
    }
    this.boxAt(body, [1.85, 0.12, 0.27], [0, 0.4, -2.13], dark);
    this.boxAt(body, [1.15, 0.14, 0.045], [0, 0.55, -2.215], dark);
    this.boxAt(body, [1.62, 0.15, 0.13], [0, 0.48, 2.16], dark);
    // Recessed rear fascia, inset plate, diffuser fins and twin metal outlets.
    this.boxAt(body, [1.6, 0.23, 0.045], [0, 0.69, 2.17], dark);
    this.boxAt(body, [0.38, 0.13, 0.025], [0, 0.65, 2.20], silver);
    for (const x of [-0.65, -0.32, 0.32, 0.65])
      this.boxAt(body, [0.055, 0.14, 0.3], [x, 0.39, 2.06], dark);
    for (const side of [-1, 1]) {
      this.boxAt(body, [0.24, 0.12, 0.17], [side * 0.66, 0.46, 2.19], silver);
      this.boxAt(body, [0.16, 0.065, 0.018], [side * 0.66, 0.46, 2.285], dark);
      this.boxAt(body, [0.025, 0.055, 0.22], [side * 1.045, 0.85, 0.2], silver);
      // Wheel shoulders make the silhouette read as stamped bodywork.
      for (const z of [-1.35, 1.3])
        this.boxAt(body, [0.15, 0.085, 0.85], [side * 1.005, 0.86, z], paint);
      for (let slot = 0; slot < 3; slot++)
        this.boxAt(body, [0.3, 0.02, 0.05], [side * 0.52, 0.88, -0.93 - slot * 0.11], dark);
    }
    const headlights = new THREE.MeshStandardMaterial({
        color: 0xe2f7ff,
        emissive: 0xb3e8ff,
        emissiveIntensity: 1.8,
      }),
      brakes = new THREE.MeshStandardMaterial({
        color: 0xd41829,
        emissive: 0xff172b,
        emissiveIntensity: 0.65,
      });
    for (const side of [-1, 1]) {
      this.boxAt(
        body,
        [0.48, 0.13, 0.065],
        [side * 0.57, 0.72, -2.16],
        headlights,
      );
      this.boxAt(body, [0.6, 0.12, 0.06], [side * 0.49, 0.72, 2.21], brakes);
      this.boxAt(body, [0.13, 0.22, 0.13], [side * 0.62, 1.04, 1.69], dark);
    }
    this.boxAt(body, [1.9, 0.08, 0.36], [0, 1.17, 1.75], dark);
    this.boxAt(body, [0.16, 0.014, 0.75], [0, 1.593, 0.12], silver);
    this.boxAt(body, [0.16, 0.015, 0.75], [0, 0.844, -1.47], silver);
    if (type === "van" || type === "truck") {
      this.shell(
        [
          [-0.15, 0.89, 0.6, 1.8],
          [0.15, 0.95, 0.6, 2.08],
          [1.9, 0.95, 0.6, 2.08],
          [2.17, 0.88, 0.6, 1.83],
        ],
        paint,
        body,
      );
      this.boxAt(body, [1.65, 0.025, 0.04], [0, 1.5, 2.19], silver);
    }
    if (type === "jeep") {
      this.boxAt(body, [1.65, 0.13, 1.6], [0, 1.66, 0.25], dark);
      this.boxAt(body, [1.75, 0.18, 0.22], [0, 0.59, -2.24], silver);
    }
    if (type === "exotic") body.scale.y = 0.88;
    const wheels = [];
    for (const side of [-1, 1])
      for (const z of [-1.35, 1.3]) {
        const pivot = new THREE.Group(),
          spin = new THREE.Group();
        pivot.position.set(side * 1.015, 0.39, z);
        pivot.add(spin);
        root.add(pivot);
        const tire = new THREE.Mesh(this.tire, dark),
          rim = new THREE.Mesh(this.rim, silver);
        tire.rotation.z = rim.rotation.z = Math.PI / 2;
        spin.add(tire, rim);
        for (let i = 0; i < 5; i++) {
          const a = (i * Math.PI * 2) / 5,
            spoke = this.boxAt(
              spin,
              [0.025, 0.07, 0.4],
              [side * 0.166, 0, 0],
              dark,
            );
          spoke.rotation.x = a;
        }
        wheels.push({ pivot, spin, front: z < 0 });
      }
    this.batch(body);
    for (const wheel of wheels) this.batch(wheel.spin);
    const shadowMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(this.shadow, shadowMaterial);
    shadow.rotation.x = -Math.PI / 2;
    shadow.scale.set(1.28, 2.5, 1);
    shadow.position.y = 0.045;
    root.add(shadow);
    const exhaust = new THREE.Group();
    for (const side of [-1, 1]) {
      const flame = new THREE.Mesh(this.flameGeometry, this.flameMaterial);
      flame.rotation.x = Math.PI / 2;
      flame.position.set(side * 0.6, 0.4, 2.4);
      exhaust.add(flame);
    }
    exhaust.visible = false;
    root.add(exhaust);
    root.userData.vehicle = {
      body,
      wheels,
      brakes,
      headlights,
      shadowMaterial,
      exhaust,
      lastTime: null,
      lastX: 0,
      lastSpeed: 0,
      steer: 0,
    };
    return root;
  }
  update(root, actor, point, run, reduced = false) {
    const v = root.userData.vehicle,
      elapsed = v.lastTime === null ? 0 : run.time - v.lastTime;
    if (elapsed > 0) {
      const lateral = ((actor.x - v.lastX) * 7) / elapsed,
        speed = Math.max(actor.speed || 0, 1),
        slip = clamp(Math.atan2(lateral, speed), -0.18, 0.18);
      v.steer += (-slip - v.steer) * (1 - Math.exp(-elapsed * 12));
      const acceleration = clamp(((actor.speed || 0) - v.lastSpeed) / elapsed, -45, 25);
      v.accel = (v.accel || 0) + (acceleration - (v.accel || 0)) * (1 - Math.exp(-elapsed * 10));
      v.lastX = actor.x;
      v.lastSpeed = actor.speed || 0;
    }
    if (v.lastTime === null) {
      v.lastX = actor.x;
      v.lastSpeed = actor.speed || 0;
    }
    v.lastTime = run.time;
    root.position.set(point.x, 0, point.y);
    root.rotation.y = -point.heading - Math.PI / 2 - (actor.headingError ?? -v.steer*.5);
    const turn = clamp(
      ((actor.turnRate || 0) * -2.65) / Math.max(actor.speed || 0, 1) + v.steer,
      -0.42,
      0.42,
    );
    for (const wheel of v.wheels) {
      wheel.pivot.rotation.y = wheel.front ? (actor.steering!==undefined?-actor.steering*.4:turn) : 0;
      wheel.spin.rotation.x = -(actor.z / 0.38) % (Math.PI * 2);
    }
    v.body.rotation.z = reduced
      ? 0
      : clamp(-turn * (actor.speed || 0) * 0.003, -0.065, 0.065);
    v.body.rotation.x = reduced
      ? 0
      : clamp((v.accel || 0) * 0.0012, -0.04, 0.04);
    // Flat asphalt has no suspension bumps. Distance-driven sine bob aliases
    // at high speed and made the imported body visibly chatter over its wheels.
    v.body.position.y = 0;
    v.brakes.emissiveIntensity = (v.accel || 0) < -4 ? 3 : 0.65;
    v.exhaust.visible = actor.id === "player" && !!run.boosting && !reduced;
  }
  release(root) {
    const v = root.userData.vehicle;
    if (v) {
      root.traverse((o) => {
        if (o.userData.ownedGeometry) o.geometry.dispose();
      });
      v.brakes.dispose();
      v.headlights.dispose();
      v.shadowMaterial.dispose();
    }
  }
}
