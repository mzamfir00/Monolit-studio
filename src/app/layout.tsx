import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MaterialDefs } from "@/components/product/MaterialDefs";
import { fontVariables } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Maison Gravure — Atelier de gravură mecanică",
    template: "%s · Maison Gravure",
  },
  description:
    "Atelier de gravură mecanică pe trei mașini Gravograph M20: alamă masivă, argint 925, titan și inox, gravate cu diamantul sau frezate rotativ.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ro" className={fontVariables}>
      <body>
        <MaterialDefs />
        {children}
      </body>
    </html>
  );
}
