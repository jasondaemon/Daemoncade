import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {REPO,dependencies,resolveDependency,packagePreview} from './package-sinkhole.mjs';
import {modelPaths} from '../games/sinkhole-city/metro/assets.js';

test('dependency scanner handles multiline/minified imports without warning-string false positives',()=>{
 const refs=dependencies('games/vendor/a.js',`import {\n A,B\n} from './b.js?v=1';import{C}from"./c.js";\nconsole.warn("converted from 'srgb-linear'");\n// import X from './fake.js';\nexport {D} from './d.js';`);
 assert.deepEqual(refs,['games/vendor/b.js','games/vendor/c.js','games/vendor/d.js']);
 assert.throws(()=>resolveDependency('games/index.html','../../../outside.js'),/escapes/);
 assert.throws(()=>resolveDependency('games/index.html','https://example.org/a.js'),/Non-local/);
});
test('standalone package has all runtime models, local modules, notices and matching hashes',async()=>{
 const parent=await mkdtemp(join(tmpdir(),'sinkhole-package-test-')),out=join(parent,'build'),inventory=await packagePreview(out),paths=new Set(inventory.files.map(f=>f.path));
 assert.equal(inventory.version,'1.0.0');assert.equal(inventory.build,'qualification52');assert.equal(inventory.kind,'stable');assert.equal(inventory.acceptance.stable,true);assert.ok(inventory.acceptance.verificationLimits.length>=2);assert.equal(inventory.acceptance.music,'owner-confirmed-2026-10-31');
 const music=inventory.files.find(f=>f.path.endsWith('background-game-quiet.mp3'));assert.equal(music.license,'GPL-3.0-only');assert.equal(music.rightsConfirmation,'owner-confirmed-2026-10-31');assert.ok(paths.has(music.provenanceFile));
 for(const world of['metro','basecamp','deep','alien','orbit'])for(const spec of Object.values(modelPaths(world)))assert.ok(paths.has(resolveDependency(inventory.entry,spec)));
 assert.ok(paths.has('games/vendor/three/three.core.min.js'));
 assert.ok(paths.has('games/sinkhole-city/assets/sfx/background-game-quiet.mp3'));
 for(const path of['games/sinkhole-city/app.html','games/sinkhole-city/app-manifest.json','games/sinkhole-city/app-expedition.html','games/sinkhole-city/expedition-manifest.json','games/sinkhole-city/app-icon.png','games/shared/game-app.css','games/shared/game-app.js','games/sinkhole-city/metro/checkpoint.js'])assert.ok(paths.has(path),path);
 assert.ok(paths.has('games/blitz/assets/models/industrial/Textures/colormap.png'),'external GLB textures ship too');
 assert.ok(![...paths].some(p=>p.endsWith('.test.mjs')||p==='games/sinkhole-city/game.js'));
 for(const f of inventory.files){const bytes=await readFile(join(out,f.path));assert.equal(bytes.length,f.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.ok(paths.has(f.licenseFile));}
 assert.ok(!(await readFile(join(out,inventory.entry),'utf8')).includes('Five-world beta'));
 await assert.rejects(packagePreview(out),/EEXIST/);
 await assert.rejects(packagePreview(REPO),/outside the repository/);
});
