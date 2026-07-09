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

  // WebAudio simulace míchání karet - ŠUSTIVÁ verze. Cíl: papírový,
  // vzdušný „šššš" zvuk karet klouzajících o sebe. Ne cvakání, ne tlumené
  // basy - plynulý šustivý pohyb ve vyšším pásmu, jen jemně a příjemně.
  //  - podklad: plynulý filtrovaný šum s pohyblivým bandpassem (to hlavní
  //    „šustění" - karty klouzající o sebe)
  //  - přes něj řídké jemné šustky jednotlivých karet
  function fallback() {
    try {
      ctxRef.current ??= new AudioContext();
      const ctx = ctxRef.current;
      const t0 = ctx.currentTime;
      const total = 1.5;

      // Šumový buffer (2 s)
      const noiseLen = Math.floor(ctx.sampleRate * 2);
      const noiseBuf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.9, t0);
      master.connect(ctx.destination);

      // --- HLAVNÍ ŠUSTĚNÍ: plynulý proud šumu v papírovém pásmu ---
      // Bandpass se pohybuje nahoru a dolů -> dojem karet klouzajících
      // o sebe (živé „šššš", ne statický šum).
      const shhh = ctx.createBufferSource();
      shhh.buffer = noiseBuf;
      shhh.loop = true;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.7;
      // pohyb filtru: rozjezd nahoru, ke konci zpět dolů (jako sesyp karet)
      bp.frequency.setValueAtTime(3000, t0);
      bp.frequency.linearRampToValueAtTime(5200, t0 + total * 0.45);
      bp.frequency.linearRampToValueAtTime(2600, t0 + total);
      // horní propust ať to zůstane vzdušné (papírové), ne dunivé
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 1500;
      const shGain = ctx.createGain();
      // obálka celého šustění: rychlejší náběh, plynulé doznění
      shGain.gain.setValueAtTime(0.0001, t0);
      shGain.gain.exponentialRampToValueAtTime(0.16, t0 + 0.12);
      shGain.gain.setValueAtTime(0.16, t0 + total - 0.5);
      shGain.gain.exponentialRampToValueAtTime(0.0001, t0 + total);
      shhh.connect(bp).connect(hp).connect(shGain).connect(master);
      shhh.start(t0);
      shhh.stop(t0 + total + 0.05);

      // jemná amplitudová modulace šustění -> „třepetání" karet
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 18; // rychlé třepetání
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain).connect(shGain.gain);
      lfo.start(t0);
      lfo.stop(t0 + total + 0.05);

      // --- ŘÍDKÉ JEDNOTLIVÉ ŠUSTKY přes proud (papírové, vzdušné) ---
      const N = 20;
      let t = t0 + 0.1;
      for (let i = 0; i < N; i++) {
        const progress = i / N;
        const gap = 0.04 + progress * 0.03 + Math.random() * 0.02;
        const dur = 0.05 + Math.random() * 0.06;

        const src = ctx.createBufferSource();
        src.buffer = noiseBuf;
        src.playbackRate.value = 0.9 + Math.random() * 0.5;
        const offset = Math.random() * (2 - dur);

        // vyšší papírové pásmo, ať to šustí (ne dutá rána)
        const sbp = ctx.createBiquadFilter();
        sbp.type = "bandpass";
        sbp.frequency.value = 2600 + Math.random() * 2400;
        sbp.Q.value = 0.5 + Math.random() * 0.5;

        // měkký, ale svižný náběh (~8 ms) - šustivé, ne cvakavé
        const g = ctx.createGain();
        const peak = (0.05 + Math.random() * 0.04) * (1 - progress * 0.3);
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

        src.connect(sbp).connect(g).connect(hp);
        src.start(t, offset, dur);
        src.stop(t + dur + 0.02);
        t += gap;
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
