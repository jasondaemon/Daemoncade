import assert from "node:assert/strict";
import { applyRenewLand, chooseRenewLandTarget, normalizeRenewSave, planRenewLand, RENEW_LAND_COST, renewLandCells } from "./renew-land-prototype.mjs";

const target = { x: 4, y: 4 }, cells = renewLandCells(target, 9);
assert.equal(cells.length, 13);
assert.equal(renewLandCells({ x: 0, y: 0 }, 9).length, 6);
for (const invalid of [{ x: 4.5, y: 4 }, { x: -1, y: 4 }, { x: 9, y: 4 }, { x: 4, y: Infinity }]) assert.deepEqual(renewLandCells(invalid, 9), [], "fractional/off-world targets are rejected");

const base = {
  size: 9, manaByFaction: { player: 200, rival: 170 }, paused: false,
  terrainScars: [{ cell: "4,4", origin: "quake", version: 1 }, { cell: "5,4", origin: "volcano", version: 1 }, "3,4", { cell: "8,8", origin: "rift", version: 1 }],
  landmarks: [
    { type: "rock", x: 4.5, y: 4.5, scar: true }, { type: "rock", x: 4.5, y: 4.5, scar: true },
    { type: "rock", x: 5.5, y: 4.5, scar: true }, { type: "rock", x: 3.5, y: 4.5, scar: false },
    { type: "tree", x: 4.5, y: 3.5, scar: false }, { type: "rock", x: 8.5, y: 8.5, scar: true },
  ],
};
const before = JSON.stringify(base), preview = planRenewLand(base, target, { faction: "player", withinInfluence: true });
assert.equal(preview.available, true);
assert.equal(preview.confirmedScarEntries.length, 2);
assert.equal(preview.legacyScarEntries.length, 1, "legacy scar provenance remains separate and untrusted");
assert.equal(preview.removableRockEntries.length, 3);

const player = applyRenewLand(base, target, { faction: "player", withinInfluence: true });
const rival = applyRenewLand(base, target, { faction: "rival", withinInfluence: true });
assert.equal(player.state.manaByFaction.player, 80);
assert.equal(player.state.manaByFaction.rival, 170, "player cast cannot charge rival influence");
assert.equal(rival.state.manaByFaction.rival, 50);
assert.equal(rival.state.manaByFaction.player, 200, "rival cast pays its own pool");
assert.equal(player.state.landmarks.length, 3, "exact selected rock indices are removed");
assert.equal(player.state.landmarks.filter(item => item.scar && item.x === 4.5 && item.y === 4.5).length, 0, "duplicate legacy rocks are independently selected, not identity-collapsed");
assert.equal(player.state.terrainScars.some(value => value === "3,4"), true, "unknown legacy scars are preserved by default");
assert.equal(JSON.stringify(base), before, "input remains immutable");

const duplicates = { ...base, terrainScars: [], landmarks: Array.from({ length: 6 }, () => ({ type: "rock", x: 4.5, y: 4.5, scar: true })) };
const duplicateResult = applyRenewLand(duplicates, target, { faction: "player", withinInfluence: true });
assert.equal(duplicateResult.plan.removableRockEntries.length, 4);
assert.equal(duplicateResult.state.landmarks.length, 2, "duplicate synthesized identities cannot remove more than four rocks");

assert.equal(planRenewLand(base, target, { withinInfluence: true }).available, false, "faction is required");
assert.equal(planRenewLand(base, target, { faction: "rival", withinInfluence: false }).available, false, "rival range is checked explicitly");
assert.equal(planRenewLand({ ...base, manaByFaction: { player: 200, rival: 119 } }, target, { faction: "rival", withinInfluence: true }).available, false, "rival affordability uses rival influence");
assert.equal(planRenewLand({ ...base, paused: true }, target, { faction: "player", withinInfluence: true }).reason, "Resume the world first");
const legacyOnly = { ...base, terrainScars: ["4,4"], landmarks: [] };
assert.equal(planRenewLand(legacyOnly, target, { faction: "player", withinInfluence: true }).available, false, "uncertain legacy scar provenance cannot be erased by default");
assert.equal(planRenewLand(legacyOnly, target, { faction: "player", withinInfluence: true, allowLegacyScars: true }).available, true, "legacy cleanup requires an explicit migration decision");

const oneScar = { ...base, terrainScars: [{ cell: "4,4", origin: "quake" }], landmarks: [] };
const aiContext = { withinInfluence: () => true, degradedSettlements: [], blockedRoutes: [] };
assert.equal(chooseRenewLandTarget(oneScar, [target], aiContext, { faction: "rival" }), null, "AI does not spend on one scar");
const choice = chooseRenewLandTarget(base, [target, { x: 8, y: 8 }], { withinInfluence: (faction, point) => faction === "rival" && point.x === 4, degradedSettlements: [{ faction: "rival", x: 4, y: 5 }], blockedRoutes: [{ faction: "rival", x: 5, y: 4 }] }, { faction: "rival" });
assert.deepEqual(choice.target, target);
assert.equal(choice.plan.availableMana, 170);

const legacy = { version: 1, mana: 50, houses: [{ id: 1 }], unknownFutureField: { keep: true } };
assert.deepEqual(normalizeRenewSave(legacy), { ...legacy, terrainScars: [] });
assert.deepEqual(normalizeRenewSave({ ...legacy, terrainScars: ["2,3", { cell: "3,4", origin: "quake" }, { cell: "bad", origin: "quake" }] }).terrainScars, [{ cell: "2,3", origin: "legacy-unknown" }, { cell: "3,4", origin: "quake", version: 1 }]);

console.log("Meddle Renew Land prototype: OK");
