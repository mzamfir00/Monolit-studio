"use client";

import { useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, Printer, X } from "lucide-react";
import { useHydrated } from "@/store/useCartStore";

/**
 * Opens the server-rendered job sheet in a native modal dialog; printing prints only the sheet.
 * The dialog is portalled to <body> so the print stylesheet can drop the rest of the page.
 */
export function JobSheetDialog({ orderNumber, children }: { orderNumber: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const hydrated = useHydrated();
  return (
    <>
      <button
        type="button"
        onClick={() => dialog.current?.showModal()}
        className="inline-flex items-center gap-1.5 rounded-branch border border-line-strong bg-bg px-2.5 py-1.5 text-xs hover:border-ink"
      >
        <ClipboardList className="size-3.5" aria-hidden="true" />
        Fișă tehnică de atelier
      </button>
      {hydrated &&
        createPortal(
          <dialog
            ref={dialog}
            data-branch="umbrella"
            aria-label={`Fișă tehnică de atelier ${orderNumber}`}
            className="print-sheet m-auto max-h-[92dvh] w-[min(64rem,calc(100vw-2rem))] overflow-y-auto rounded-branch-lg border border-line bg-bg p-0 text-ink shadow-2xl backdrop:bg-black/40"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-bg px-6 py-3 print:hidden">
              <p className="eyebrow text-muted">Fișă tehnică de atelier · {orderNumber}</p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => window.print()} className="btn btn-primary min-h-9 px-4">
                  <Printer className="size-4" aria-hidden="true" />
                  Printează
                </button>
                <button
                  type="button"
                  onClick={() => dialog.current?.close()}
                  aria-label="Închide fișa"
                  className="flex size-9 items-center justify-center rounded-full hover:bg-ink/5"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <div className="p-6 sm:p-8">{children}</div>
          </dialog>,
          document.body,
        )}
    </>
  );
}
