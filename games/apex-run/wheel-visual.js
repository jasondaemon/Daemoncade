// CylinderGeometry is authored along local Y. Apex Run bakes a +90 degree X
// rotation into the geometry so its axle becomes local Z. Runtime steering is
// then a parent yaw and wheel roll is a child local-Z rotation.
export function setWheelVisualPose(THREE,visual,position,chassisRotation,steering,rotation){
  visual.root.position.copy(position);
  visual.root.quaternion.copy(chassisRotation);
  visual.steer.rotation.y=steering;
  visual.roll.rotation.z=rotation;
}

export function makeWheelVisual(THREE,tireMaterial,rimMaterial){
  const root=new THREE.Group(),steer=new THREE.Group(),roll=new THREE.Group();
  const tireGeometry=new THREE.CylinderGeometry(.43,.43,.38,24);
  tireGeometry.rotateX(Math.PI/2);
  const tire=new THREE.Mesh(tireGeometry,tireMaterial);tire.castShadow=true;
  const rimGeometry=new THREE.CylinderGeometry(.24,.24,.4,12);
  rimGeometry.rotateX(Math.PI/2);
  tire.add(new THREE.Mesh(rimGeometry,rimMaterial));
  roll.add(tire);steer.add(roll);root.add(steer);
  return{root,steer,roll,tire};
}
