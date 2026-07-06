export const PRICES = {
  first: parseInt(process.env.NEXT_PUBLIC_INTRO_PRICE_CZK ?? "29", 10), // A/B 29 vs 19: konfigurace, ne konstanta (v1 §1)
  single: 49,
  pack5: 199,
  pack20: 599,
};

export const PRICE_IDS = {
  first: "price_first_29",
  single: "price_single_49",
  pack5: "price_pack5_199",
  pack20: "price_pack20_599",
} as const;
