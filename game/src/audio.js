import { CONFIG } from './config.js';

const settings = CONFIG.audio;
let context;
let master;
let muted = false;

async function unlock(event) {
  if (!event.isTrusted) return;
  // Mouse activation occurs on pointerdown, touch and pen on pointerup.
  if (event.type === 'pointerdown' && event.pointerType !== 'mouse') return;

  try {
    if (!context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      context = new AudioContext();
      master = context.createGain();
      master.gain.value = muted ? 0 : settings.MASTER_GAIN;
      master.connect(context.destination);
    }
    if (context.state !== 'running') await context.resume();
  } catch {
    // A later gesture can retry if the browser blocks audio.
  }
}

if (typeof window !== 'undefined') {
  for (const type of ['keydown', 'pointerdown', 'pointerup']) {
    window.addEventListener(type, unlock, { capture: true });
  }
}

function play(notes) {
  if (muted || !master || context.state !== 'running') return;
  const now = context.currentTime;

  for (const [waveform, startHz, endHz, offset, duration, peak] of notes) {
    const start = now + offset;
    const end = start + duration;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(startHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(endHz, end);
    envelope.gain.setValueAtTime(settings.ENVELOPE_FLOOR, start);
    envelope.gain.linearRampToValueAtTime(peak, start + settings.ATTACK_SECONDS);
    envelope.gain.exponentialRampToValueAtTime(settings.ENVELOPE_FLOOR, end);

    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(end);
  }
}

export function jump() { play(settings.jump); }
export function corn() { play(settings.corn); }
export function hit() { play(settings.hit); }
export function spotted() { play(settings.spotted); }
export function caught() { play(settings.caught); }
export function escaped() { play(settings.escaped); }
export function click() { play(settings.click); }

export function toggleMute() {
  muted = !muted;
  if (master) master.gain.value = muted ? 0 : settings.MASTER_GAIN;
  return muted;
}
