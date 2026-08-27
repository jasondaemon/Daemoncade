(() => {
  "use strict";

  const STORAGE_KEY = "jasondaemon.games.v1";
  const MAX_RECENT = 12;

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return value && value.version === 1 && value.games ? value : { version: 1, games: {} };
    } catch {
      return { version: 1, games: {} };
    }
  }

  function write(value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }

  function cleanPart(value, fallback = "default") {
    const cleaned = String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    return cleaned || fallback;
  }

  function record({ game, mode = "solo", difficulty = "default", metric = "score", value, meta = {} }) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return null;
    const gameKey = cleanPart(game, "game");
    const resultKey = `${cleanPart(mode)}:${cleanPart(difficulty)}:${metric === "time" ? "time" : "score"}`;
    const data = read();
    const gameData = data.games[gameKey] || { best: {}, recent: [] };
    const previous = gameData.best[resultKey];
    const better = !previous || (metric === "time" ? numericValue < previous.value : numericValue > previous.value);
    const result = {
      value: numericValue,
      metric: metric === "time" ? "time" : "score",
      mode: cleanPart(mode),
      difficulty: cleanPart(difficulty),
      achievedAt: new Date().toISOString(),
      meta: typeof meta === "object" && meta ? meta : {},
    };
    if (better) gameData.best[resultKey] = result;
    gameData.recent.unshift(result);
    gameData.recent = gameData.recent.slice(0, MAX_RECENT);
    data.games[gameKey] = gameData;
    write(data);
    window.dispatchEvent(new CustomEvent("jasondaemon:game-score", { detail: { game: gameKey, result, best: better } }));
    return { result, best: better };
  }

  function game(game) {
    return read().games[cleanPart(game, "game")] || { best: {}, recent: [] };
  }

  function bestSummary(gameKey) {
    const values = Object.values(game(gameKey).best || {});
    if (!values.length) return "No local record yet";
    const newest = values.sort((a, b) => new Date(b.achievedAt) - new Date(a.achievedAt))[0];
    if (newest.metric === "time") {
      const minutes = Math.floor(newest.value / 60);
      return `Best ${newest.difficulty}: ${minutes}:${String(newest.value % 60).padStart(2, "0")}`;
    }
    return `Best ${newest.difficulty === "default" ? "score" : newest.difficulty}: ${newest.value}`;
  }

  window.GameScores = { storageKey: STORAGE_KEY, read, record, game, bestSummary };
})();
