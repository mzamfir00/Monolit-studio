import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { BranchShell } from "@/components/shell/BranchShell";
import { ATELIERS, isBranch } from "@/lib/branches";
import { BRANCHES, type Branch } from "@/lib/types";

type Params = Promise<{ branch: string }>;

const THEME_COLORS: Record<Branch, string> = {
  pet: "#f4efe6",
  jewelry: "#fcfcfa",
  vault: "#121316",
  corporate: "#edeeeb",
};

export const dynamicParams = false;

export function generateStaticParams() {
  return BRANCHES.map((branch) => ({ branch }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { branch } = await params;
  if (!isBranch(branch)) return {};
  const atelier = ATELIERS[branch];
  // Page-level metadata (canonical, previews) lives in each page; the layout only sets the title suffix.
  return {
    title: { default: `${atelier.seoTitle} · ${atelier.name}`, template: `%s · ${atelier.name}` },
    description: atelier.seoDescription,
  };
}

export async function generateViewport({ params }: { params: Params }): Promise<Viewport> {
  const { branch } = await params;
  return isBranch(branch) ? { themeColor: THEME_COLORS[branch] } : {};
}

export default async function BranchLayout({ children, params }: { children: ReactNode; params: Params }) {
  const { branch } = await params;
  if (!isBranch(branch)) notFound();
  return <BranchShell atelier={branch}>{children}</BranchShell>;
}
