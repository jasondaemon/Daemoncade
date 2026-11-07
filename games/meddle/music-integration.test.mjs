import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, script, splash, title, gameplay1, gameplay2, gameplay3] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("game.js", root), "utf8"),
  stat(new URL("assets/meddle-splash.webp", root)),
  stat(new URL("assets/music/title.mp3", root)),
  stat(new URL("assets/music/gameplay-1.mp3", root)),
  stat(new URL("assets/music/gameplay-2.mp3", root)),
  stat(new URL("assets/music/gameplay-3.mp3", root)),
]);

assert.match(html, /media-src 'self'/, "CSP allows only same-origin media");
assert.match(html, /class="launch-art"/, "launch screen contains the splash artwork");
assert.match(html, /id="launch-music"/, "launch screen exposes a music mute control");
assert.match(html, /id="launch-music-volume"/, "launch screen exposes music volume");
assert.match(script, /GAMEPLAY_MUSIC=\["assets\/music\/gameplay-1\.mp3","assets\/music\/gameplay-2\.mp3","assets\/music\/gameplay-3\.mp3"\]/);
assert.match(script, /await musicPlayer\.play\(\)/, "music start honors the browser play promise");
assert.match(script, /setMusicScene\("gameplay"\)/, "launch actions transition to gameplay music");
assert.match(script, /musicPlayer\.addEventListener\("ended"/, "gameplay music advances after a track ends");
assert.ok(splash.size > 100_000 && splash.size < 1_000_000, "splash is optimized for web delivery");
for (const file of [title, gameplay1, gameplay2, gameplay3]) {
  assert.ok(file.size > 3_000_000 && file.size < 6_000_000, "music track is a complete compressed web asset");
}

console.log("Meddle splash and music integration passed");
