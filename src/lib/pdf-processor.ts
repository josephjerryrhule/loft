import { promises as fs } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const exec = promisify(execFile);

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
const RENDER_DPI = 150;

export async function processPdf(input: Buffer): Promise<ProcessedPdf> {
  if (!input || input.length === 0) {
    throw new PdfProcessorError("empty buffer");
  }
  if (input.subarray(0, 4).toString() !== "%PDF") {
    throw new PdfProcessorError("not a PDF (magic bytes missing)");
  }

  const dir = await mkdtemp(path.join(tmpdir(), "loft-pdf-"));
  const sourcePath = path.join(dir, "source.pdf");
  const optimizedPath = path.join(dir, "optimized.pdf");
  const pagesPrefix = path.join(dir, "page");

  try {
    await fs.writeFile(sourcePath, input);

    // 1. Compress with Ghostscript
    try {
      await exec("gs", [
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        "-dPDFSETTINGS=/ebook",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        `-sOutputFile=${optimizedPath}`,
        sourcePath,
      ]);
    } catch (e: any) {
      if (e.code === "ENOENT") {
        // gs missing — fall back to passthrough
        await fs.copyFile(sourcePath, optimizedPath);
      } else {
        throw new PdfProcessorError("ghostscript failed", e);
      }
    }

    // 2. Render pages with pdftocairo → PNG
    try {
      await exec("pdftocairo", ["-png", "-r", String(RENDER_DPI), optimizedPath, pagesPrefix]);
    } catch (e: any) {
      if (e.code === "ENOENT") {
        throw new PdfProcessorError("pdftocairo missing — install poppler-utils");
      }
      throw new PdfProcessorError("pdftocairo failed", e);
    }

    // 3. Collect generated PNGs and convert each to WebP via sharp
    const files = (await fs.readdir(dir))
      .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
      .sort();

    if (files.length === 0) {
      throw new PdfProcessorError("no pages rendered (0-page or corrupt PDF)");
    }

    const pages: ProcessedPage[] = [];
    for (const f of files) {
      const pngBuf = await fs.readFile(path.join(dir, f));
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

    const optimizedPdf = await fs.readFile(optimizedPath);

    return { optimizedPdf, pages, totalPages: pages.length };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
