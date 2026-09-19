import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try {
 const page=await browser.newPage();
 await page.goto((process.env.RACECAR_TEST_URL||'http://127.0.0.1:4197/games/racecar/'));
 const result=await page.evaluate(async()=>{
  const [{RoadScene},{CARS},THREE]=await Promise.all([import('./view.js?v=40'),import('./garage.js?v=39'),import('../vendor/three/three.module.min.js')]);
  const host=document.createElement('div');host.style.cssText='width:800px;height:600px';document.body.append(host);
  const view=await new Promise((resolve,reject)=>new RoadScene(host,{ready:resolve,error:reject,frame:()=>{},progress:()=>{}}));
  const canvas=document.createElement('canvas');canvas.width=160;canvas.height=80;const failures=[];
  for(const spec of CARS) {
   view.previewCar(canvas,spec.id,undefined,false,0);
   const {car,camera}=view.previews.get(canvas),v=car.userData.vehicle;
   for(let step=0;step<24;step++) {
    car.rotation.y=step*Math.PI/12;car.updateMatrixWorld(true);camera.updateMatrixWorld(true);
    for(const group of [v.body,...v.wheels.map(w=>w.pivot)])group.traverseVisible(mesh=>{
     if(!mesh.isMesh)return;
     const positions=mesh.geometry.attributes.position;
     for(let i=0;i<positions.count;i++){
      const point=new THREE.Vector3().fromBufferAttribute(positions,i).applyMatrix4(mesh.matrixWorld).project(camera);
      if(Math.abs(point.x)>1||Math.abs(point.y)>1){failures.push(`${spec.id} clips at ${step}`);break;}
     }
    });
   }
  }
  view.clearPreviews();return {count:CARS.length,failures};
 });
 assert.deepEqual(result.failures,[]);
 console.log(`PASS: ${result.count} vehicle previews fit through all 24 turntable angles.`);
}finally{await browser.close();}
