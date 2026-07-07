"use client";
// Aplikuje uložené barevné overridy (z /dev/kredit editoru) na :root při
// každém načtení stránky - aby změny palety platily v CELÉ appce, ne jen
// v editoru. Nic nevykresluje. Overridy jsou v localStorage (per prohlížeč,
// dev nástroj); v produkci bez uložených overridů se nic nemění.
import { useEffect } from "react";
import { applyPaletteOverrides, loadPaletteOverrides } from "@/lib/paletteTokens";

export default function PaletteOverrides() {
  useEffect(() => {
    const ov = loadPaletteOverrides();
    if (Object.keys(ov).length) applyPaletteOverrides(ov);
  }, []);
  return null;
}
