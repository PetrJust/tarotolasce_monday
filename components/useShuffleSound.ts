"use client";
import { useEffect, useRef } from "react";

// Zvuk šustění karet. Preferuje preloadovaný /shuffle.mp3 (spuštěný interakcí,
// takže autoplay politiky nevadí). Když soubor chybí, použije WebAudio fallback.
export function useShuffleSound(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const hasFile = useRef(true);

  useEffect(() => {
    const a = new Audio("/shuffle.mp3");
    a.preload = "auto";
    a.volume = 0.35;
    a.addEventListener("error", () => {
      hasFile.current = false;
    });
    audioRef.current = a;
    return () => {
      a.pause();
    };
  }, []);

  function fallback() {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      for (let i = 0; i < 7; i++) {
        const dur = 0.07;
        const start = ctx.currentTime + i * 0.13;
        const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let j = 0; j < data.length; j++) {
          data[j] = (Math.random() * 2 - 1) * (1 - j / data.length);
        }
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 2400 + Math.random() * 1200;
        const gain = ctx.createGain();
        gain.gain.value = 0.12;
        src.connect(filter).connect(gain).connect(ctx.destination);
        src.start(start);
      }
    } catch {
      /* zvuk je jen bonus */
    }
  }

  return () => {
    if (!enabled) return;
    const a = audioRef.current;
    if (a && hasFile.current) {
      a.currentTime = 0;
      a.play().catch(() => {
        hasFile.current = false;
        fallback();
      });
    } else {
      fallback();
    }
  };
}
