import sharp from "sharp";
import { pdf } from "pdf-to-img";

export class PdfProcessorError extends Error {
  readonly cause: unknown;
  constructor(message: string, cause?: unknown) {
    super(`PdfProcessor: ${message}`);
    this.name = "PdfProcessorError";
    this.cause = cause;
  }
}

export interface ProcessedPage {
  buffer: Buffer;
  width: number;
  height: number;
}

export interface ProcessedPdf {
  optimizedPdf: Buffer;
  pages: ProcessedPage[];
  totalPages: number;
}

const MAX_LONG_EDGE = 1600;
const WEBP_QUALITY = 80;
const RENDER_SCALE = 2; // ~150 DPI equivalent for typical letter-size PDFs

/**
 * Process a PDF buffer: rasterize each page to WebP via pdf-to-img + sharp.
 * Pure Node — no system binaries (gs / poppler) required.
 * Plesk deployment works with zero additional setup.
 *
 * Compression is intentionally a passthrough: the WebP page assets are the
 * runtime artifact that matters; a Ghostscript-compressed source PDF would
 * require a system binary not available across our environments. The raw
 * source PDF is still stored separately so admin can re-render anytime.
 */
export async function processPdf(input: Buffer): Promise<ProcessedPdf> {
  if (!input || input.length === 0) {
    throw new PdfProcessorError("empty buffer");
  }
  if (input.subarray(0, 4).toString() !== "%PDF") {
    throw new PdfProcessorError("not a PDF (magic bytes missing)");
  }

  let document: Awaited<ReturnType<typeof pdf>>;
  try {
    document = await pdf(input, { scale: RENDER_SCALE });
  } catch (e) {
    throw new PdfProcessorError("failed to load PDF (corrupt or encrypted)", e);
  }

  const pages: ProcessedPage[] = [];
  try {
    for await (const pngBuf of document) {
      const img = sharp(pngBuf).resize({
        width: MAX_LONG_EDGE,
        height: MAX_LONG_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      });
      const meta = await img.metadata();
      const webpBuf = await img.webp({ quality: WEBP_QUALITY }).toBuffer();
      pages.push({
        buffer: webpBuf,
        width: meta.width ?? 0,
        height: meta.height ?? 0,
      });
    }
  } catch (e) {
    throw new PdfProcessorError("failed to render page", e);
  }

  if (pages.length === 0) {
    throw new PdfProcessorError("no pages rendered (0-page PDF)");
  }

  // Passthrough: no Ghostscript-style compression. Source PDF stored as-is.
  return { optimizedPdf: input, pages, totalPages: pages.length };
}
