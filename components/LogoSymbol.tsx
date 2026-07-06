// Logo symbol (v1.5 §5.8): karta se soft-gold rámem a SRDCEM uprostřed.
// Použití ven: favicon, app ikona, avatary, Stories badge, OG. Vše z
// tokens v3. Podmínka: nezaměnitelný s logem SPIRIO (SPIRIO nemá kartu
// se srdcem). Finální schválení wordmarku [ČEKÁ NA ROMANA].
import { palette, tokens } from "@/lib/palette";

/** Cesta srdce v souřadnicích 0-100 (střed 50, výška ~80). */
export function heartPath(cx: number, cy: number, size: number): string {
  const s = size / 100;
  const x = (v: number) => cx + (v - 50) * s;
  const y = (v: number) => cy + (v - 50) * s;
  return [
    `M ${x(50)} ${y(86)}`,
    `C ${x(20)} ${y(62)} ${x(10)} ${y(44)} ${x(16)} ${y(30)}`,
    `C ${x(22)} ${y(16)} ${x(40)} ${y(14)} ${x(50)} ${y(30)}`,
    `C ${x(60)} ${y(14)} ${x(78)} ${y(16)} ${x(84)} ${y(30)}`,
    `C ${x(90)} ${y(44)} ${x(80)} ${y(62)} ${x(50)} ${y(86)}`,
    "Z",
  ].join(" ");
}

export default function LogoSymbol({
  className = "",
  size = 32,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <svg
      viewBox="0 0 120 160"
      width={size}
      height={Math.round((size * 160) / 120)}
      style={{ maxWidth: "100%", height: "auto" }}
      className={className}
      role="img"
      aria-label="Tarot o Lásce"
    >
      <rect width="120" height="160" rx="12" fill={palette.night.DEFAULT} />
      <rect x="6" y="6" width="108" height="148" rx="9" fill="none" stroke={tokens.softGold} strokeWidth="2.5" />
      <path d={heartPath(60, 80, 66)} fill={tokens.romanticPink} />
      <path d={heartPath(60, 80, 66)} fill="none" stroke={tokens.softGold} strokeWidth="1.6" />
    </svg>
  );
}

/** Monogram „TOL" z v1 = pečeť na ruby karet + submark patiček (§5.8). */
export function TolSeal({ size = 16, color }: { size?: number; color?: string }) {
  const c = color ?? tokens.softGold;
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke={c} strokeWidth="1" />
      <text
        x="12"
        y="15.2"
        textAnchor="middle"
        fontSize="7.5"
        fontFamily="Lora, serif"
        fontWeight="600"
        fill={c}
        letterSpacing="0.5"
      >
        TOL
      </text>
    </svg>
  );
}
