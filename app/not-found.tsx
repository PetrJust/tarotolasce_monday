import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-5 py-16 text-center">
      <h1 className="font-display text-[42px] leading-[1.1] font-semibold text-body">
        Tahle karta v balíčku není.
      </h1>
      <p className="max-w-md text-body-dim">
        Stránka, kterou hledáš, neexistuje nebo se přestěhovala. Zkus to z
        úvodní stránky.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-rose-500 px-6 py-3 font-medium text-plum-900 hover:opacity-90"
      >
        Zpět na úvod
      </Link>
    </div>
  );
}
