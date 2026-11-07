import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, script, logo, splash, title, gameplay1, gameplay2, gameplay3] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("game.js", root), "utf8"),
  stat(new URL("assets/daemoncade-logo.webp", root)),
  stat(new URL("assets/meddle-splash.webp", root)),
  stat(new URL("assets/music/title.mp3", root)),
  stat(new URL("assets/music/gameplay-1.mp3", root)),
  stat(new URL("assets/music/gameplay-2.mp3", root)),
  stat(new URL("assets/music/gameplay-3.mp3", root)),
]);

assert.match(html, /media-src 'self'/, "CSP allows only same-origin media");
assert.match(html, /id="studio-intro"/, "studio ident precedes the game launch screen");
assert.match(html, /id="studio-continue"/, "studio ident has an explicit continue gesture");
assert.match(html, /https:\/\/www\.jasondaemon\.net\//, "studio ident links to Jason's website");
assert.match(html, /https:\/\/github\.com\/jasondaemon\/Daemoncade/, "studio ident links to the source repository");
assert.match(html, /open source under GPLv3/, "studio ident accurately summarizes the repository license");
assert.match(html, /class="launch-art"/, "launch screen contains the splash artwork");
assert.match(html, /id="launch-music"/, "launch screen exposes a music mute control");
assert.match(html, /id="launch-music-volume"/, "launch screen exposes music volume");
assert.match(script, /GAMEPLAY_MUSIC=\["assets\/music\/gameplay-1\.mp3","assets\/music\/gameplay-2\.mp3","assets\/music\/gameplay-3\.mp3"\]/);
assert.match(script, /await musicPlayer\.play\(\)/, "music start honors the browser play promise");
assert.match(script, /studio-continue[\s\S]+showModal\(\)[\s\S]+playMusic\(\)/, "Continue reveals Meddle and starts title music from the trusted gesture");
assert.doesNotMatch(script, /addEventListener\("pointerdown",unlockMusic/, "unrelated pointer gestures do not start the title theme");
assert.match(script, /setMusicScene\("gameplay"\)/, "launch actions transition to gameplay music");
assert.match(script, /musicPlayer\.addEventListener\("ended"/, "gameplay music advances after a track ends");
assert.ok(splash.size > 100_000 && splash.size < 1_000_000, "splash is optimized for web delivery");
assert.ok(logo.size > 20_000 && logo.size < 150_000, "transparent studio logo is optimized for web delivery");
for (const file of [title, gameplay1, gameplay2, gameplay3]) {
  assert.ok(file.size > 3_000_000 && file.size < 6_000_000, "music track is a complete compressed web asset");
}

console.log("Meddle splash and music integration passed");
