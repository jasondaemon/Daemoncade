export const SEASON_NAMES = Object.freeze(["spring", "fall", "winter"]);

export const SEASON_THEMES = Object.freeze({
  spring: Object.freeze({ label: "Spring", sky: ["#477a83", "#285a68"], land: ["#405d4a", "#527157", "#648361", "#769367", "#87956b", "#918a68", "#947f67"], overviewTree: "#3e7548", atlas: "./assets/seasons/spring-scenery.webp?v=1" }),
  fall: Object.freeze({ label: "Fall", sky: ["#6d6f6c", "#48565d"], land: ["#534f3d", "#686047", "#796b4c", "#897551", "#927b56", "#8e7051", "#835f4a"], overviewTree: "#a45c2f", atlas: "./assets/seasons/fall-scenery.webp?v=1" }),
  winter: Object.freeze({ label: "Snowy winter", sky: ["#8499aa", "#556c7e"], land: ["#697a78", "#81918c", "#9ba6a0", "#b5bdb5", "#c9cec5", "#d8dbd2", "#e2e3dc"], overviewTree: "#45625d", atlas: "./assets/seasons/winter-scenery.webp?v=1" })
});

const WINTER_EARTH = Object.freeze(["#554638", "#614f3e", "#6d5944", "#78634b", "#826d53"]);
const WINTER_GROUND = Object.freeze(["#5c503e", "#685944", "#716149"]);

// Snow is surface cover, not a replacement material for the whole terrain.
// Low-frequency waves form stable patches without screen-space texture drift;
// broken slopes always expose their ordinary brown earth.
export function winterTerrainMaterial(x, y, height, relief, water, seed = 1) {
  const level = Math.max(0, Math.min(4, Math.round(Number(height) || 0)));
  if (relief >= .55) return { kind: "earth", color: WINTER_EARTH[level] };
  return { kind: "ground", color: WINTER_GROUND[Math.abs(Math.floor(x * 3 + y * 5 + level)) % WINTER_GROUND.length] };
}

export function winterSnowMaskAlpha(u, v) {
  const x = ((Number(u) || 0) % 1 + 1) % 1, y = ((Number(v) || 0) % 1 + 1) % 1;
  const hash = (ix, iy, cells) => {
    const wx=((ix%cells)+cells)%cells, wy=((iy%cells)+cells)%cells;
    let n=Math.imul(wx+19,374761393)^Math.imul(wy+47,668265263)^Math.imul(cells,2246822519);
    n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
  };
  const noise = cells => {
    const px=x*cells,py=y*cells,ix=Math.floor(px),iy=Math.floor(py),fx=px-ix,fy=py-iy,
      sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy),
      a=hash(ix,iy,cells)*(1-sx)+hash(ix+1,iy,cells)*sx,
      b=hash(ix,iy+1,cells)*(1-sx)+hash(ix+1,iy+1,cells)*sx;
    return a*(1-sy)+b*sy;
  };
  const coverage=noise(7)*.18+noise(17)*.47+noise(31)*.35;
  const eased=Math.max(0,Math.min(1,(coverage-.18)/.11));
  return eased*eased*(3-2*eased);
}

export function isSeason(value) { return SEASON_NAMES.includes(value); }

// A world seed owns its season: reproducible in tests and stable on refresh.
export function seasonForSeed(seed) {
  let value = (Number(seed) || 1) >>> 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  return SEASON_NAMES[(value >>> 0) % SEASON_NAMES.length];
}

export function resolveSeason(savedSeason, seed, requestedSeason = "") {
  if (isSeason(requestedSeason)) return requestedSeason;
  return isSeason(savedSeason) ? savedSeason : seasonForSeed(seed);
}

export function sceneryCell(atlasWidth, atlasHeight, type, variant = 0) {
  const column = ((Number(variant) || 0) % 4 + 4) % 4;
  const cellWidth = atlasWidth / 4, cellHeight = atlasHeight / 2;
  return { sx: column * cellWidth, sy: type === "tree" ? 0 : cellHeight, sw: cellWidth, sh: cellHeight };
}
