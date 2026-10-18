import { sound } from "@orkide/ui/effects/sound";

export const SOUND_STORAGE_KEY = "orkide-sound";

/** True when the visitor switched sound on for this browser. Off by default. */
export const soundOn = (): boolean => {
  try {
    return localStorage.getItem(SOUND_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
};

/** Stores the choice; listeners hear `soundchange` on document. */
export const storeSound = (on: boolean): void => {
  try {
    if (on) {
      localStorage.setItem(SOUND_STORAGE_KEY, "on");
    } else {
      localStorage.removeItem(SOUND_STORAGE_KEY);
    }
  } catch {
    // Storage can be unavailable (private mode): the choice lasts for the page.
  }
  document.dispatchEvent(new Event("soundchange"));
};

let context: AudioContext | undefined;

/** The shared audio context, created on the first sound (after a user gesture). */
const audio = (): AudioContext | undefined => {
  if (!soundOn()) {
    return undefined;
  }
  try {
    context ??= new AudioContext();
    void context.resume();
    return context;
  } catch {
    return undefined;
  }
};

/** A mechanical click: decaying noise through a band-pass filter, pitched by `pitch`. */
export const click = (pitch = 1): void => {
  const ac = audio();
  if (!ac) {
    return;
  }
  const { decay, frequency, gain, length, q } = sound.click;
  const buffer = ac.createBuffer(
    1,
    Math.ceil(ac.sampleRate * length),
    ac.sampleRate
  );
  const data = buffer.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / data.length) ** decay;
  }
  const source = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const volume = ac.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = frequency * pitch;
  filter.Q.value = q;
  volume.gain.value = gain;
  source.connect(filter).connect(volume).connect(ac.destination);
  source.start();
};

/** The `step`-th note of the pentatonic scale. */
export const note = (step: number): void => {
  const ac = audio();
  if (!ac) {
    return;
  }
  const { attack, gain, release, root, scale, wave } = sound.note;
  const now = ac.currentTime;
  const oscillator = ac.createOscillator();
  const volume = ac.createGain();
  oscillator.type = wave;
  oscillator.frequency.value =
    root * 2 ** ((scale[step % scale.length] ?? 0) / 12);
  volume.gain.setValueAtTime(0.0001, now);
  volume.gain.exponentialRampToValueAtTime(gain, now + attack);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + release);
  oscillator.connect(volume).connect(ac.destination);
  oscillator.start(now);
  oscillator.stop(now + release + 0.05);
  document.dispatchEvent(new Event("soundnote"));
};

/** A few notes in a row (switching sound on, a message sent). */
export const chord = (steps: readonly number[], spacing: number): void => {
  for (const [index, step] of steps.entries()) {
    setTimeout(() => note(step), index * spacing);
  }
};
