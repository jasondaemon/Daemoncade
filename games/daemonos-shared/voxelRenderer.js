import * as THREE from "../vendor/three/three.module.min.js";

export function createVoxelRenderer({ surface, width, height, maxVoxels = 6000 } = {}) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = "voxel-layer";
  Object.assign(renderer.domElement.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "1",
  });
  surface.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(0, width, height, 0, 1, 1600);
  camera.position.set(0, 0, 900);
  camera.lookAt(0, 0, 0);

  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const normals = geometry.getAttribute("normal");
  const faceColors = new Float32Array(normals.count * 3);
  for (let index = 0; index < normals.count; index += 1) {
    const nx = normals.getX(index);
    const ny = normals.getY(index);
    const nz = normals.getZ(index);
    const shade = nz > 0.5 ? 1 : ny < -0.5 ? 1.25 : nx > 0.5 ? 0.68 : 0.82;
    faceColors[index * 3] = shade;
    faceColors[index * 3 + 1] = shade;
    faceColors[index * 3 + 2] = shade;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(faceColors, 3));
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    vertexColors: true,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, maxVoxels);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  quaternion.setFromEuler(new THREE.Euler(-0.24, 0.34, 0));
  const scale = new THREE.Vector3();
  const color = new THREE.Color();

  const resize = () => {
    const rect = surface.getBoundingClientRect();
    renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(surface);
  resize();

  const render = (voxels) => {
    const count = Math.min(voxels.length, maxVoxels);
    for (let index = 0; index < count; index += 1) {
      const voxel = voxels[index];
      const size = voxel.size || 4;
      position.set(voxel.x, height - voxel.y, voxel.z || 0);
      scale.set(size, size, voxel.depth || size * 0.85);
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
      mesh.setColorAt(index, color.set(voxel.color || 0xffffff));
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    renderer.render(scene, camera);
  };

  const destroy = () => {
    observer.disconnect();
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  };

  return { render, resize, destroy, canvas: renderer.domElement };
}
