import type { SpecimenInput } from "@orkide/validators/atlas";

import { canvas2d, fontStack } from "../preview-kit.ts";
import type { Preview } from "../preview-kit.ts";

export const specimen = {
  added: "2026-10",
  cost: "heavy",
  desc: {
    en: "Tap a column to play a note. The visuals respond to what you hear.",
    tr: "Bir sütuna dokunduğunda bir nota çalar. Görüntü, duyduğun sese karşılık verir.",
  },
  family: "senses",
  fit: "good",
  hint: "tap",
  id: "SN-01",
  name: { en: "Sound-reactive", tr: "Sese tepki veren" },
  pairs: ["PH-01", "GN-04", "MO-05", "SP-02"],
  prompt:
    "Add a sound layer to [subject]: tapping regions plays notes from a pentatonic scale via Tone.js or Web Audio, and visuals pulse with each note. Sound stays off until the visitor turns it on, with a visible mute toggle.",
  refs: [
    { label: "Patatap", url: "https://patatap.com/" },
    { label: "Tone.js", url: "https://tonejs.github.io/" },
  ],
  slug: "sound-reactive",
  tags: ["Web Audio", "Tone.js", "audio-reactive"],
} satisfies SpecimenInput;

/** One column per note: a major pentatonic scale over two octaves, in semitones above A3. */
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16];

/**
 * Eight bars that idle in a wave and jump when tapped. The audio context starts on the first tap,
 * never on load; the top half of a column plays an octave higher.
 */
export const preview: Preview = (stage) => {
  const view = canvas2d(stage);
  const font = `600 11px ${fontStack("mono")}`;
  const levels = SCALE.map(() => 0);
  let audio: AudioContext | undefined;
  stage.addEventListener("pointerdown", (event) => {
    try {
      audio ??= new AudioContext();
      if (audio.state === "suspended") {
        void audio.resume();
      }
    } catch {
      audio = undefined;
    }
    const box = stage.getBoundingClientRect();
    const column = Math.max(
      0,
      Math.min(7, Math.floor(((event.clientX - box.left) / box.width) * 8))
    );
    levels[column] = 1;
    if (!audio) {
      return;
    }
    const octave = (event.clientY - box.top) / box.height < 0.5 ? 12 : 0;
    const note = audio.createOscillator();
    const envelope = audio.createGain();
    const now = audio.currentTime;
    note.type = "triangle";
    note.frequency.value = 220 * 2 ** (((SCALE[column] ?? 0) + octave) / 12);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
    note.connect(envelope);
    envelope.connect(audio.destination);
    note.start();
    note.stop(now + 1);
  });
  return (t) => {
    const { ctx, width, height } = view;
    ctx.fillStyle = "#0F1830";
    ctx.fillRect(0, 0, width, height);
    const band = width / 8;
    for (const [column, level] of levels.entries()) {
      const lit = level * 0.93;
      levels[column] = lit;
      const bar =
        (0.14 + 0.06 * Math.sin(t * 2 + column * 0.9) + lit * 0.6) *
        (height - 40);
      ctx.fillStyle = `hsl(${180 + column * 22},85%,${52 + lit * 22}%)`;
      ctx.beginPath();
      ctx.roundRect(
        column * band + band * 0.15,
        height - bar - 14,
        band * 0.7,
        bar,
        6
      );
      ctx.fill();
    }
    ctx.fillStyle = "rgba(255,255,255,.65)";
    ctx.font = font;
    ctx.fillText(
      audio ? "♪ top row = high octave" : "tap a column · sound on",
      12,
      22
    );
  };
};
