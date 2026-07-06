"use client";
// Šest polí pro OTP (v1.1 B.1): auto-posun, vložení celého kódu ze
// schránky, inputmode numeric, autocomplete one-time-code, po šestém
// poli odeslat automaticky.
import { useRef } from "react";

export default function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onComplete: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  function commit(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, 6);
    onChange(clean);
    if (clean.length === 6) onComplete(clean);
    else refs.current[clean.length]?.focus();
  }

  return (
    <div className="flex justify-between gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={6}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            if (v.length > 1) {
              // vložení celého kódu ze schránky
              commit(value.slice(0, i) + v);
            } else {
              commit(value.slice(0, i) + v + value.slice(i + 1));
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) {
              onChange(value.slice(0, i - 1));
              refs.current[i - 1]?.focus();
            }
          }}
          className="h-14 w-11 rounded-xl border border-surface bg-surface text-center font-display text-2xl text-body focus:border-accent disabled:opacity-50"
          aria-label={`Číslice ${i + 1} z 6`}
        />
      ))}
    </div>
  );
}
