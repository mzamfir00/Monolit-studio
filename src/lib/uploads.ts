/**
 * Limits for customer sketch uploads, shared by the configurator and POST /api/uploads.
 * Serverless hosts cap request bodies at about 4.5 MB (Vercel), so the file itself stays under 4 MB.
 */
export const MAX_UPLOAD_MB = 4;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

export const UPLOAD_ACCEPT =
  "image/png,image/jpeg,image/webp,image/heic,image/heif,application/pdf,image/svg+xml,.heic,.svg,.pdf";

export const UPLOAD_FORMATS_LABEL = "PNG, JPG, WEBP, HEIC, PDF sau SVG";

/** Stored sketch id: "<uuid>.<ext>", the extension taken from the sniffed file type. */
export const SKETCH_ID = /^[0-9a-f-]{36}\.(png|jpg|webp|heic|pdf|svg)$/;
