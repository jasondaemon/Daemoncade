export class SoundEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();
    this.compressor = this.ctx.createDynamicsCompressor();
    Object.assign(this.compressor.threshold, { value: -16 });
    this.compressor.knee.value = 14; this.compressor.ratio.value = 5;
    this.compressor.attack.value = .004; this.compressor.release.value = .16;
    this.musicGain.connect(this.master); this.sfxGain.connect(this.compressor);
    this.compressor.connect(this.master); this.master.connect(this.ctx.destination);
    this.musicGain.gain.value = .4; this.sfxGain.gain.value = .7;
    this.musicMuted = false; this.sfxMuted = false; this.musicTimer = null; this.pelletStep = 0;
    this.noiseBuffer = this.createNoiseBuffer();
  }

  createNoiseBuffer() {
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  resume() { if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {}); }
  setVolumeMusic(value) { this.musicGain.gain.value = value; }
  setVolumeSfx(value) { this.sfxGain.gain.value = value; }
  setMutedMusic(muted) { this.musicMuted = muted; }
  setMutedSfx(muted) { this.sfxMuted = muted; }

  tone({ freq, endFreq = freq, duration = .2, gain = .15, type = "triangle", at = 0, attack = .008 }) {
    const start = this.ctx.currentTime + at, osc = this.ctx.createOscillator(), envelope = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), start + duration);
    envelope.gain.setValueAtTime(.0001, start);
    envelope.gain.linearRampToValueAtTime(gain, start + Math.min(attack, duration * .3));
    envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    osc.connect(envelope); envelope.connect(this.sfxGain); osc.start(start); osc.stop(start + duration + .02);
  }

  noise({ duration = .2, gain = .12, frequency = 900, type = "bandpass", at = 0 }) {
    const start = this.ctx.currentTime + at, source = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter(), envelope = this.ctx.createGain();
    source.buffer = this.noiseBuffer; filter.type = type; filter.frequency.value = frequency; filter.Q.value = type === "bandpass" ? 1.2 : .4;
    envelope.gain.setValueAtTime(gain, start); envelope.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter); filter.connect(envelope); envelope.connect(this.sfxGain);
    source.start(start, Math.random()); source.stop(start + duration + .02);
  }

  notes(notes, { at = 0, spacing = .1, duration = .22, gain = .12, type = "triangle" } = {}) {
    notes.forEach((freq, index) => this.tone({ freq, duration, gain, type, at: at + index * spacing }));
  }

  playSfx(name) {
    if (this.sfxMuted) return;
    if (name === "pellet") {
      const notes = [390, 440, 493, 440];
      this.tone({ freq: notes[this.pelletStep++ % notes.length], endFreq: 520, duration: .055, gain: .075, type: "square", attack: .003 });
      this.noise({ duration: .025, gain: .025, frequency: 1800, type: "highpass" });
    } else if (name === "power") {
      this.noise({ duration: .34, gain: .14, frequency: 620 });
      this.notes([196, 247, 330, 440], { spacing: .085, duration: .3, gain: .13, type: "sawtooth" });
      this.tone({ freq: 75, endFreq: 130, duration: .48, gain: .18 });
    } else if (name === "bonus") {
      this.notes([523, 659, 784, 1047], { spacing: .07, duration: .24, gain: .12, type: "sine" });
      this.noise({ duration: .16, gain: .045, frequency: 2600, type: "highpass", at: .12 });
    } else if (name === "eat") {
      this.tone({ freq: 105, endFreq: 58, duration: .28, gain: .24, type: "square" });
      this.noise({ duration: .18, gain: .13, frequency: 380, type: "lowpass" });
      this.notes([392, 523, 659], { at: .08, spacing: .055, duration: .2, gain: .11 });
    } else if (name === "jump") {
      this.noise({ duration: .12, gain: .16, frequency: 230, type: "lowpass" });
      this.tone({ freq: 115, endFreq: 620, duration: .52, gain: .2, type: "sawtooth" });
      this.tone({ freq: 760, endFreq: 430, duration: .24, gain: .1, type: "sine", at: .42 });
      this.noise({ duration: .16, gain: .12, frequency: 280, type: "lowpass", at: .62 });
    } else if (name === "boost") {
      this.tone({ freq: 55, endFreq: 170, duration: .75, gain: .24, type: "sawtooth" });
      this.tone({ freq: 110, endFreq: 340, duration: .68, gain: .13, type: "square", at: .04 });
      this.noise({ duration: .72, gain: .09, frequency: 700 });
      this.notes([440, 554, 659], { at: .18, spacing: .06, duration: .34, gain: .09, type: "sine" });
    } else if (name === "smash") {
      this.noise({ duration: .42, gain: .28, frequency: 520, type: "lowpass" });
      this.noise({ duration: .22, gain: .16, frequency: 2300, type: "highpass", at: .015 });
      this.tone({ freq: 82, endFreq: 38, duration: .48, gain: .28, type: "square" });
      this.notes([740, 510, 820], { at: .03, spacing: .045, duration: .16, gain: .08 });
    } else if (name === "death") {
      this.noise({ duration: .72, gain: .3, frequency: 480, type: "lowpass" });
      this.noise({ duration: .38, gain: .16, frequency: 2600, type: "highpass", at: .02 });
      this.tone({ freq: 150, endFreq: 42, duration: .82, gain: .26, type: "sawtooth" });
      this.notes([520, 410, 330, 245], { at: .08, spacing: .1, duration: .22, gain: .075, type: "square" });
    } else if (name === "level") {
      this.notes([262, 330, 392, 523, 659, 784], { spacing: .12, duration: .38, gain: .13 });
      [0, .36, .72].forEach((at, index) => {
        const root = [131, 165, 196][index];
        this.tone({ freq: root, duration: .42, gain: .13, type: "sawtooth", at });
        this.tone({ freq: root * 1.5, duration: .42, gain: .08, type: "sine", at });
      });
      this.noise({ duration: .18, gain: .08, frequency: 2400, type: "highpass", at: .75 });
    } else if (name === "gameover") {
      this.noise({ duration: .9, gain: .24, frequency: 360, type: "lowpass" });
      this.tone({ freq: 120, endFreq: 32, duration: 1.45, gain: .25, type: "sawtooth" });
      this.notes([392, 330, 262, 196, 131], { at: .12, spacing: .23, duration: .42, gain: .11 });
      this.tone({ freq: 65, endFreq: 48, duration: 1.1, gain: .18, type: "square", at: .82 });
    }
  }

  startMusic(speedFactor = 1) {
    if (this.musicTimer) return;
    const sequence = [110, 110, 147, 110, 98, 110, 147, 110]; let step = 0;
    this.musicTimer = setInterval(() => {
      if (!this.musicMuted) this.tone({ freq: sequence[step++ % sequence.length], duration: .18, gain: .06, type: "square" });
    }, 300 / speedFactor);
  }

  stopMusic() { if (this.musicTimer) clearInterval(this.musicTimer); this.musicTimer = null; }
}
