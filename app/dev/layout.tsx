import type { Metadata } from "next";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Dev",
  robots: { index: false, follow: false },
};

// v1.1 H.5: dev nástroje nesmí v produkci existovat (env-gate).
export default function Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_TOOLS !== "1") {
    notFound();
  }
  return children;
}
