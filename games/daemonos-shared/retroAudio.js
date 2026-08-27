export function createRetroAudio({ musicOn = true, sfxOn = true, musicVolume = 0.5, sfxVolume = 0.6 } = {}) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain();
  const musicGain = ctx.createGain();
  const sfxGain = ctx.createGain();
  master.connect(ctx.destination);
  musicGain.connect(master);
  sfxGain.connect(master);
  master.gain.value = 1;
  musicGain.gain.value = musicVolume;
  sfxGain.gain.value = sfxVolume;

  let musicTimer = null;
  let musicStep = 0;

  const setMusicEnabled = (value) => {
    musicOn = value;
    if (!musicOn) stopMusic();
  };
  const setSfxEnabled = (value) => {
    sfxOn = value;
  };
  const setMusicVolume = (value) => {
    musicVolume = value;
    musicGain.gain.value = musicVolume;
  };
  const setSfxVolume = (value) => {
    sfxVolume = value;
    sfxGain.gain.value = sfxVolume;
  };

  const resume = () => {
    if (ctx.state !== "running") ctx.resume().catch(() => {});
  };

  const playTone = ({ freq = 440, duration = 0.1, type = "square", gain = 0.6 }) => {
    if (!sfxOn) return;
    resume();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.value = gain;
    osc.connect(g);
    g.connect(sfxGain);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playNoise = ({ duration = 0.2, gain = 0.4 }) => {
    if (!sfxOn) return;
    resume();
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }
    const src = ctx.createBufferSource();
    const g = ctx.createGain();
    src.buffer = buffer;
    g.gain.value = gain;
    src.connect(g);
    g.connect(sfxGain);
    src.start();
  };

  const startMusic = (sequence = [220, 247, 196, 262], tempo = 0.18) => {
    if (!musicOn) return;
    resume();
    stopMusic();
    musicStep = 0;
    musicTimer = setInterval(() => {
      if (!musicOn) return;
      const freq = sequence[musicStep % sequence.length];
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "square";
      osc.frequency.value = freq;
      g.gain.value = 0.12;
      osc.connect(g);
      g.connect(musicGain);
      osc.start();
      osc.stop(ctx.currentTime + tempo * 0.9);
      musicStep += 1;
    }, tempo * 1000);
  };

  const stopMusic = () => {
    if (musicTimer) clearInterval(musicTimer);
    musicTimer = null;
  };

  const destroy = () => {
    stopMusic();
    ctx.close().catch(() => {});
  };

  return {
    ctx,
    setMusicEnabled,
    setSfxEnabled,
    setMusicVolume,
    setSfxVolume,
    playTone,
    playNoise,
    startMusic,
    stopMusic,
    destroy,
    resume,
  };
}
