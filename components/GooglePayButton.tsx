"use client";
// Oficiální brandovaný Google Pay button (v1.3 §6 bug 2). Vzhled podle
// brand guidelines pro tmavý „buy button": černý podklad, zaoblení,
// bílé „Pay" a vícebarevné „G". V PRODUKCI tenhle mock nahradí button
// vykreslený Stripe Payment Request / Express Checkout Elementem, který
// oficiální badge dodává sám - tahle komponenta drží vizuál do té doby.
//
// Pozn. k opravě: dřívější verze používala ručně kreslené SVG cesty se
// scale()/translate() transformacemi, které nebyly vizuálně ověřené a na
// produkci vypadaly rozbitě. Teď používá ověřenou oficiální Google „G"
// značku (18x18 viewBox, čtyřbarevná) a prosté <text> pro „Pay" - žádné
// riskantní ruční path transformace.

function GoogleGMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden focusable="false">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

export default function GooglePayButton({
  onClick,
  disabled,
  busy,
}: {
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label="Zaplatit přes Google Pay"
      className="flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-black px-6 py-3 hover:bg-neutral-900 disabled:opacity-60"
    >
      {busy ? (
        <span className="font-semibold text-white">Zpracovává se…</span>
      ) : (
        <>
          <GoogleGMark />
          <span className="font-sans text-lg font-medium text-white">Pay</span>
        </>
      )}
    </button>
  );
}
