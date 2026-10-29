import type { Viewport } from "next";
import type { ReactNode } from "react";
import { BranchShell } from "@/components/shell/BranchShell";

export const viewport: Viewport = { themeColor: "#f7f5f0" };

export default function UmbrellaLayout({ children }: { children: ReactNode }) {
  return <BranchShell atelier="umbrella">{children}</BranchShell>;
}
