"use client";
import { useEffect, useRef } from "react";

// Zvuk míchání karet. Primárně se generuje přes WebAudio (viz shuffle()
// níže) - zní jako skutečné šustění balíčku a nevyžaduje žádný asset.
// Když ale v /public existuje shuffle.mp3 (nahraná reálná nahrávka),
// použije se přednostně ta. Spouští se z uživatelské interakce, takže
// autoplay politiky prohlížeče nevadí.
export function useShuffleSound(enabled: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const hasFile = useRef(false); // default: soubor nemáme -> hraje WebAudio

  useEffect(() => {
    const a = new Audio("/shuffle.mp3");
    a.preload = "auto";
    a.volume = 0.35;
    // Jen když se soubor SKUTEČNĚ načte, povolíme ho jako přednostní zdroj.
    a.addEventListener("canplaythrough", () => {
      hasFile.current = true;
    });
    a.addEventListener("error", () => {
      hasFile.current = false;
    });
    audioRef.current = a;
    return () => {
      a.pause();
    };
  }, []);

  // WebAudio simulace míchání karet. Skutečné šustění = hustý sled mnoha
  // jemných „ťuknutí" papíru (ne pár cvaknutí) + jemný širokopásmový šum,
  // s mírnou randomizací tempa a postupným dozníváním na konci (karty se
  // sesypou). Vše přes filtry laděné do papírového pásma.
  function fallback() {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      const t0 = ctx.currentTime;

      // Sdílený „papírový" šumový buffer (2 s bílého šumu), z něhož si
      // jednotlivé šustky berou krátké úseky s náhodným offsetem.
      const noiseLen = Math.floor(ctx.sampleRate * 2);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;

      // Master s jemným dozníváním celého míchání
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.9, t0);
      master.connect(ctx.destination);

      // horní propust ubere dunivé nízké frekvence (papír je „vzdušný")
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 900;
      hp.connect(master);

      // Sekvence šustků: rychle po sobě, ke konci se rozestupy prodlužují
      // (zpomalení) a hlasitost klesá.
      const N = 34;
      let t = t0;
      for (let i = 0; i < N; i++) {
        const progress = i / N;
        // rozestup 12-40 ms, ke konci delší (ease-out)
        const gap = 0.012 + progress * progress * 0.03 + Math.random() * 0.01;
        const dur = 0.03 + Math.random() * 0.05;

        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        src.playbackRate.value = 0.85 + Math.random() * 0.5;
        // náhodný začátek v bufferu -> každý šustek zní jinak
        const offset = Math.random() * (2 - dur);

        // bandpass laděný kolem papírového „šš" pásma, lehce náhodně
        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = 1600 + Math.random() * 2600;
        bp.Q.value = 0.6 + Math.random() * 0.8;

        // obálka: rychlý náběh, přirozený doznělý ocásek; ke konci tišší
        const g = ctx.createGain();
        const peak = (0.05 + Math.random() * 0.05) * (1 - progress * 0.55);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.004);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        src.connect(bp).connect(g).connect(hp);
        src.start(t, offset, dur);
        src.stop(t + dur + 0.02);
        t += gap;
      }

      // jemné závěrečné „ťuk" srovnání balíčku
      const endT = t + 0.03;
      const tap = ctx.createBufferSource();
      tap.buffer = noiseBuf;
      const tg = ctx.createGain();
      tg.gain.setValueAtTime(0.0001, endT);
      tg.gain.exponentialRampToValueAtTime(0.06, endT + 0.005);
      tg.gain.exponentialRampToValueAtTime(0.0001, endT + 0.12);
      const tf = ctx.createBiquadFilter();
      tf.type = "lowpass";
      tf.frequency.value = 2200;
      tap.connect(tf).connect(tg).connect(master);
      tap.start(endT, Math.random(), 0.14);
      tap.stop(endT + 0.16);
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
