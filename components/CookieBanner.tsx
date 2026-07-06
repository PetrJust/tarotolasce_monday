"use client";
import { useEffect, useState } from "react";

// Mock cookie consent. Volba se ukládá do cookie (není to citlivý údaj).
export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!document.cookie.includes("tol_consent=")) setVisible(true);
  }, []);

  function choose(value: "all" | "necessary") {
    document.cookie = `tol_consent=${value}; path=/; max-age=${60 * 60 * 24 * 365}`;
    setVisible(false);
  }

  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-surface bg-surface-2 p-4 backdrop-blur">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-body-dim">
          Používáme cookies, aby web fungoval a abychom ho mohli zlepšovat.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => choose("necessary")}
            className="rounded-lg border border-surface px-4 py-2 text-sm text-body-dim hover:text-body"
          >
            Jen nezbytné
          </button>
          <button
            onClick={() => choose("all")}
            className="rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-plum-900 hover:opacity-90"
          >
            Přijmout vše
          </button>
        </div>
      </div>
    </div>
  );
}
