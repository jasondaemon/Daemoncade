import {test} from 'node:test';
import assert from 'node:assert/strict';
import {groundFinish} from './finishes.js';
test('matte finish composes with hole shader and uses stable world-space derivative-limited detail',()=>{
 const enabled={value:1},mat={onBeforeCompile:s=>{s.uniforms.holes={value:[]};s.fragmentShader+='\n// original hole clip';},customProgramCacheKey:()=> 'base'};
 groundFinish(mat,enabled);const shader={uniforms:{},fragmentShader:'#include <color_fragment>'};mat.onBeforeCompile(shader);assert.ok(shader.fragmentShader.includes('original hole clip'));assert.ok(shader.fragmentShader.includes('fwidth'));assert.ok(shader.fragmentShader.includes('vHoleWorld.xz'));assert.equal(shader.uniforms.terrainFinish,enabled);assert.equal(mat.customProgramCacheKey(),'base-matte-finish-48');enabled.value=0;assert.equal(shader.uniforms.terrainFinish.value,0);
});
