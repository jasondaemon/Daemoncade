// Production-page player trial: real keyboard events and wall-clock holds only.
import assert from "node:assert/strict";
import {mkdir} from "node:fs/promises";
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||"/Users/jasondaemon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs");
const browser=await chromium.launch({headless:process.env.HEADED!=="1",executablePath:"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",args:process.env.HEADED==="1"?[]:["--enable-unsafe-swiftshader"]});
const output=process.env.QA_OUTPUT||"/tmp/apex-player-alpha";await mkdir(output,{recursive:true});
const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[],log=[];
page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")errors.push(m.text())});
async function hold(keys,ms,label){for(const key of keys)await page.keyboard.down(key);log.push({label,keys,ms,start:Date.now()});await page.waitForTimeout(ms);for(const key of [...keys].reverse())await page.keyboard.up(key);log.at(-1).end=Date.now()}
try{
  await page.goto(process.env.APEX_URL||"http://127.0.0.1:4173/games/apex-run/?build=player-alpha",{waitUntil:"networkidle"});
  await page.locator("#view").click();await page.keyboard.press("KeyR");await page.waitForTimeout(3400);if(await page.locator("#pause-card").isVisible())await page.locator("#resume").click();
  await hold(["KeyW"],7700,"launch");await hold(["KeyW","KeyA"],1200,"opening corner");await hold(["KeyW"],1200,"steering release");
  await page.screenshot({path:`${output}/opening-corner.png`});
  const hud={gate:await page.locator("#checkpoint").innerText(),speed:await page.locator("#speed").innerText(),time:await page.locator("#time").innerText()};
  assert.match(hud.gate,/1 \/ 5/);assert.ok(Number(hud.speed)>20);assert.deepEqual(errors,[]);
  console.log("Apex Run production keyboard trial passed",JSON.stringify({hud,log,output},null,2));
}finally{await browser.close()}
