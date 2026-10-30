"use client";

import { useRef, useState, type DragEvent } from "react";
import { FileImage, Loader2, Upload, X } from "lucide-react";
import type { UploadedSketch } from "@/lib/engraving";
import { cn } from "@/lib/format";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_MB, UPLOAD_ACCEPT, UPLOAD_FORMATS_LABEL } from "@/lib/uploads";

const kb = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB` : `${Math.ceil(bytes / 1024)} KB`;

/** Browsers can only preview these; PDF and HEIC show a file card instead. */
const previewable = (type: string) => ["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(type);

/**
 * Drop zone that uploads immediately to POST /api/uploads and reports the stored sketch.
 * `previewUrl` is a local object URL for the engraving preview; it is never persisted.
 */
export function SketchUpload({
  sketch,
  previewUrl,
  onUploaded,
  onRemove,
}: {
  sketch: UploadedSketch | null;
  previewUrl: string | null;
  onUploaded: (sketch: UploadedSketch, previewUrl: string | null) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const attempt = useRef(0);
  const [status, setStatus] = useState<"idle" | "uploading">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`Fișierul depășește ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    const current = ++attempt.current;
    setStatus("uploading");
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch("/api/uploads", { method: "POST", body });
      const result = await response.json().catch(() => ({}));
      if (current !== attempt.current) return;
      if (!response.ok) {
        setError(result.error ?? "Încărcarea a eșuat. Încearcă din nou.");
        return;
      }
      onUploaded(result as UploadedSketch, previewable(result.type) ? URL.createObjectURL(file) : null);
    } catch {
      if (current === attempt.current) setError("Conexiunea s-a întrerupt. Încearcă din nou.");
    } finally {
      if (current === attempt.current) setStatus("idle");
      if (input.current) input.current.value = "";
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) void upload(file);
  }

  return (
    <div className="grid gap-3">
      {sketch ? (
        <div className="flex items-center gap-4 rounded-branch border border-line bg-bg p-3">
          <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-branch border border-line bg-surface">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL, not optimisable
              <img src={previewUrl} alt="" className="size-full object-contain grayscale" />
            ) : (
              <FileImage className="size-7 text-muted" strokeWidth={1.25} aria-hidden="true" />
            )}
          </div>
          <div className="grid min-w-0 flex-1 gap-0.5">
            <p className="truncate text-sm font-medium">{sketch.name}</p>
            <p className="text-xs text-muted">{kb(sketch.size)} · încărcat, îl vectorizăm manual înainte de gravare</p>
          </div>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="shrink-0 text-sm text-muted underline-offset-4 hover:text-ink hover:underline"
          >
            Înlocuiește
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label="Elimină schița"
            className="flex size-9 shrink-0 items-center justify-center rounded-full hover:bg-ink/5"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={status === "uploading"}
          className={cn(
            "grid justify-items-center gap-2 rounded-branch border border-dashed px-6 py-8 text-center transition-colors",
            dragging ? "border-ink bg-surface" : "border-line-strong bg-bg hover:bg-surface",
          )}
        >
          {status === "uploading" ? (
            <Loader2 className="size-6 animate-spin text-metal" aria-hidden="true" />
          ) : (
            <Upload className="size-6 text-metal" strokeWidth={1.5} aria-hidden="true" />
          )}
          <span className="font-medium">{status === "uploading" ? "Se încarcă…" : "Trage fișierul aici sau alege-l"}</span>
          <span className="text-xs text-muted">
            {UPLOAD_FORMATS_LABEL} · maximum {MAX_UPLOAD_MB} MB · o fotografie clară, pe fundal deschis
          </span>
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept={UPLOAD_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Fișier schiță"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      <p aria-live="polite" className="text-sm font-medium text-metal-text">
        {error}
      </p>
    </div>
  );
}
