import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args:['--enable-unsafe-swiftshader']});
try{
 const page=await browser.newPage({viewport:{width:1200,height:760}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4197/games/sinkhole-city/metro/');
 const stats=await page.evaluate(async()=>{
  const T=await import('/games/vendor/three/three.module.min.js'),{oceanHero}=await import('/games/sinkhole-city/metro/ocean-heroes.js?v=marine25');
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:#153342';
  const renderer=new T.WebGLRenderer({antialias:true});renderer.setSize(1200,760);renderer.setPixelRatio(1);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement);
  const scene=new T.Scene();scene.background=new T.Color(0x153342);scene.add(new T.HemisphereLight(0xd9f5ff,0x547080,3));const light=new T.DirectionalLight(0xffffff,3);light.position.set(-8,12,8);scene.add(light);
  const mat=color=>new T.MeshStandardMaterial({color,roughness:.75}),results=[];
  for(const [i,type]of['whale','shark','dolphin'].entries()){
   const root=oceanHero({mat},type);root.position.x=(i-1)*4.6;root.rotation.y=-.38;
   let triangles=0;root.traverse(m=>{if(!m.isMesh)return;const g=m.geometry;if(g.attributes.color)m.material=new T.MeshStandardMaterial({vertexColors:true,roughness:.75});triangles+=(g.index?.count||g.attributes.position.count)/3;});
   const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3());results.push({type,triangles,width:size.x,height:size.y,length:size.z});scene.add(root);
   const label=document.createElement('div');label.textContent=type.toUpperCase();label.style.cssText=`position:fixed;top:40px;left:${i*33.33}%;width:33.33%;text-align:center;color:#e4f6f7;font:600 18px sans-serif;letter-spacing:4px`;document.body.append(label);
  }
  const camera=new T.PerspectiveCamera(38,1200/760,.1,100);camera.position.set(0,14,16);camera.lookAt(0,0,-.4);renderer.render(scene,camera);window.__hero={renderer,scene,camera};return results;
 });
 for(const s of stats){assert.ok(s.triangles<2200&&s.triangles>500);assert.ok(s.length>s.width&&s.length>s.height);}
 assert.ok(stats[0].length>stats[1].length);assert.ok(stats[1].height>stats[2].height,'shark has a tall vertical tail and dorsal fin');assert.deepEqual(errors,[]);
 await page.screenshot({path:'/tmp/sinkhole-marine25-models.png'});
 await page.evaluate(()=>{const {renderer,scene,camera}=__hero;camera.position.set(0,19,1);camera.lookAt(0,0,0);renderer.render(scene,camera);});await page.screenshot({path:'/tmp/sinkhole-marine25-top.png'});
 console.log('MARINE MODELS',stats);console.log('PASS: distinct authored silhouettes, bounded geometry, top and three-quarter renders.');
}finally{await browser.close();}
