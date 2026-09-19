import * as THREE from "../vendor/three/three.module.min.js";
import { CELESTIAL_DIRECTION } from './lighting.js?v=39';
import { BACKDROP_RATES, backdropOffset, horizonHeight } from "./parallax.js?v=39";

// A single background draw, behind opaque world geometry. Image strips scroll
// horizontally without cylindrical distortion, scaling, or camera translation.
export function createBackdrop(textures, river) {
  const prefix = river ? "river" : "city";
  const uniforms = {
    farMap: { value: textures.get(`${prefix}-far`) },
    midMap: { value: textures.get(prefix) },
    nearMap: { value: textures.get(`${prefix}-near`) },
    offsets: { value: new THREE.Vector3() },
    celestial: { value: new THREE.Vector3() },
    horizon: { value: 0.68 },
    aspect: { value: 1 },
    // Artwork ground lines differ; align the painted bases, not image bounds.
    bases: { value: river ? new THREE.Vector3(0.96, 0.99, 0.87) : new THREE.Vector3(0.92, 0.99, 0.72) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: `varying vec2 screenUV;
      void main() { screenUV = uv; gl_Position = vec4(position.xy, 1.0, 1.0); }`,
    fragmentShader: `
      uniform sampler2D farMap, midMap, nearMap;
      uniform vec3 offsets, bases, celestial;
      uniform float horizon, aspect;
      varying vec2 screenUV;
      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      vec4 strip(sampler2D tex, float offset, float base, float lift, float height) {
        vec2 uv = vec2((screenUV.x - 0.5) * aspect / 0.96 + offset,
          (screenUV.y - horizon - lift) / height + 1.0 - base);
        // Original paintings are not seamless. Overlap their ends instead of
        // exposing a hard vertical join whenever a strip wraps.
        float x = fract(uv.x) * 0.84;
        float y = clamp(uv.y, 0.0, 1.0);
        vec4 c = texture2D(tex, vec2(x, y));
        if (x < 0.16) {
          vec4 tail = texture2D(tex, vec2(x + 0.84, y));
          float blend = smoothstep(0.0, 0.16, x);
          float alpha = mix(tail.a, c.a, blend);
          c = vec4(mix(tail.rgb * tail.a, c.rgb * c.a, blend) / max(alpha, 0.0001), alpha);
        }
        c.a *= step(0.0, uv.y) * step(uv.y, 1.0);
        // Sink the painted bottom edges gently into atmospheric haze.
        c.a *= smoothstep(horizon - 0.008, horizon + 0.014, screenUV.y);
        return c;
      }
      void main() {
        vec3 haze = vec3(0.00518, 0.01681, 0.03071);
        vec3 color = mix(haze, vec3(0.0024, 0.0065, 0.016),
          smoothstep(horizon, 1.0, screenUV.y));
        // Celestial layer shares the distant heading, never animates at rest.
        vec2 sky = vec2((screenUV.x - 0.5) * aspect + offsets.x * 0.96, screenUV.y);
        vec2 grid = vec2(fract(sky.x / 0.96) * 0.96, sky.y) * 100.0;
        vec2 cell = floor(grid);
        vec2 point = vec2(hash(cell), hash(cell + 19.7)) * 0.7 + 0.15;
        float star = 1.0 - smoothstep(0.035, 0.12, length(fract(grid) - point));
        star *= step(0.91, hash(cell + 8.3)) * smoothstep(horizon + 0.08, horizon + 0.2, screenUV.y);
        color += vec3(0.2, 0.29, 0.4) * star;
        vec2 moon = vec2((screenUV.x - celestial.x) * aspect, screenUV.y - celestial.y);
        float radius = length(moon);
        float disc = (1.0 - smoothstep(0.018, 0.0195, radius)) * celestial.z;
        vec2 lunar = moon / 0.019;
        float craters = 0.94
          - 0.16 * (1.0 - smoothstep(0.1, 0.52, length(lunar - vec2(-0.28, 0.25))))
          - 0.12 * (1.0 - smoothstep(0.05, 0.3, length(lunar - vec2(0.3, -0.2))))
          - 0.09 * (1.0 - smoothstep(0.03, 0.22, length(lunar - vec2(-0.3, -0.42))));
        craters *= 0.83 + 0.17 * sqrt(max(0.0, 1.0 - dot(lunar, lunar)));
        color += vec3(0.035, 0.047, 0.065) * exp(-radius * 42.0) * celestial.z;
        color = mix(color, vec3(0.68, 0.76, 0.87) * craters, disc);
        vec4 far = strip(farMap, offsets.x, bases.x, 0.045, 0.5);
        color = mix(color, mix(haze, far.rgb, 0.65), far.a);
        vec4 mid = strip(midMap, offsets.y, bases.y, 0.0, 0.22);
        color = mix(color, mix(haze, mid.rgb, 0.85), mid.a);
        vec4 near = strip(nearMap, offsets.z, bases.z, -0.008, 0.24);
        color = mix(color, near.rgb, near.a);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.userData.owned = true;
  return mesh;
}

export function updateBackdrop(mesh, camera, look, heading) {
  const u = mesh.material.uniforms;
  u.offsets.value.set(...BACKDROP_RATES.map(rate => backdropOffset(heading, rate)));
  u.aspect.value = camera.aspect;
  camera.updateMatrixWorld();
  // A distant world-space bearing: rotation moves it, translation does not.
  const direction=CELESTIAL_DIRECTION;
  const point=direction.clone().multiplyScalar(100).add(camera.position);
  const forward=camera.getWorldDirection(new THREE.Vector3());
  const visible=forward.dot(direction)>0?1:0;
  point.project(camera);
  u.celestial.value.set(visible?(point.x+1)/2:-10,visible?(point.y+1)/2:-10,visible);
  u.horizon.value = horizonHeight(look.y - camera.position.y,
    Math.hypot(look.x - camera.position.x, look.z - camera.position.z), camera.fov);
}
