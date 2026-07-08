// Dynamický OG obrázek pro sdílení karty dne (kapitola 10.2)
import { ImageResponse } from "next/og";
import { DECK } from "@/lib/cards";
import { palette, tokens, NIGHT_FLAT } from "@/lib/palette";

export const runtime = "edge";
export const alt = "Karta dne | Tarot o Lásce";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  // Karta se mění podle dne (deterministicky), obrázek je tak vždy čerstvý
  const dayIndex =
    Math.floor(Date.now() / 86400000) % DECK.length;
  const card = DECK[dayIndex];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: NIGHT_FLAT, // v1.3 §1: žádný gradient, plochá noční
          color: palette.cream.DEFAULT,
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 18,
          }}
        >
          {/* Dvoubarevný wordmark (v1.5 §5.8) */}
          <div style={{ display: "flex", fontSize: 40, fontWeight: 600 }}>
            <span style={{ color: palette.cream.DEFAULT }}>Tarot&nbsp;</span>
            <span style={{ color: tokens.romanticPink }}>o Lásce</span>
          </div>
          <div style={{ fontSize: 30, color: tokens.softGold, letterSpacing: 4 }}>
            KARTA DNE
          </div>
          <div style={{ fontSize: 88, fontWeight: 600 }}>{card.name}</div>
          {/* Tagline DOSLOVA */}
          <div style={{ fontSize: 28, color: palette.cream.dim }}>
            Porozumět lásce. Porozumět sobě.
          </div>
          <div style={{ fontSize: 26, color: palette.cream.dim }}>
            tarotolasce.cz
          </div>
        </div>
      </div>
    ),
    size
  );
}
