// All sounds are synthesized with the Web Audio API, so there are no audio
// files to load or license. Browsers only allow audio after a user gesture,
// so the context is created by `unlock()` when the player starts a run.

const MUTE_KEY = 'carpet-rider-muted';

export function createAudio() {
  let ctx = null;
  let master = null;
  let wind = null;
  let muted = false;
  try {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  } catch {}

  function noiseBuffer(seconds) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  // A looping band of filtered noise; its pitch and volume follow the speed.
  function createWind() {
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(2);
    source.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 0.8;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    source.connect(filter).connect(gain).connect(master);
    source.start();
    return { filter, gain };
  }

  function unlock() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.6;
      master.connect(ctx.destination);
      wind = createWind();
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function tone(frequency, start, duration, { type = 'sine', volume = 0.3, endFrequency } = {}) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  // `amount` is 0 when stopped and 1 at full speed.
  function setWind(amount) {
    if (!ctx) return;
    const now = ctx.currentTime;
    wind.gain.gain.setTargetAtTime(amount > 0 ? 0.05 + amount * 0.12 : 0, now, 0.3);
    wind.filter.frequency.setTargetAtTime(400 + amount * 900, now, 0.3);
  }

  function gem(streak) {
    if (!ctx) return;
    // Each gem in a trail rings a little higher.
    const base = 880 * Math.pow(2, Math.min(streak, 6) / 12);
    const now = ctx.currentTime;
    tone(base, now, 0.12, { type: 'triangle', volume: 0.25 });
    tone(base * 1.5, now + 0.06, 0.18, { type: 'triangle', volume: 0.2 });
  }

  function crash() {
    if (!ctx) return;
    const now = ctx.currentTime;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(0.6);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2500, now);
    filter.frequency.exponentialRampToValueAtTime(120, now + 0.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    source.connect(filter).connect(gain).connect(master);
    source.start(now);
    tone(110, now, 0.5, { type: 'sine', volume: 0.5, endFrequency: 40 });
  }

  function start() {
    if (!ctx) return;
    const now = ctx.currentTime;
    tone(440, now, 0.25, { type: 'sine', volume: 0.15, endFrequency: 880 });
  }

  function toggleMute() {
    muted = !muted;
    try {
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {}
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.6, ctx.currentTime, 0.05);
    return muted;
  }

  return { unlock, setWind, gem, crash, start, toggleMute, isMuted: () => muted };
}
