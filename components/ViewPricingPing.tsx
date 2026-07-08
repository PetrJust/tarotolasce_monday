"use client";
// v1.5 §7: event view_pricing při zobrazení ceníku (ceník je server
// komponenta, proto tenhle mini client ping).
import { useEffect } from "react";
import { logEvent } from "@/lib/analytics";

export default function ViewPricingPing() {
  useEffect(() => {
    logEvent("view_pricing", {});
  }, []);
  return null;
}
