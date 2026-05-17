import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import { execSync } from "node:child_process";
import { processPdf } from "../src/lib/pdf-processor.ts";

let hasBinaries = true;
try {
  execSync("which gs && which pdftocairo", { stdio: "ignore" });
} catch {
  hasBinaries = false;
}

let hasFixture = true;
try {
  await access("tests/__fixtures__/sample-3p.pdf");
} catch {
  hasFixture = false;
}

test("processPdf returns manifest + optimized pdf for 3-page fixture", { skip: !hasBinaries || !hasFixture }, async () => {
  const buf = await readFile("tests/__fixtures__/sample-3p.pdf");
  const result = await processPdf(buf);

  assert.equal(result.totalPages, 3);
  assert.equal(result.pages.length, 3);
  for (const p of result.pages) {
    assert.ok(p.buffer instanceof Buffer);
    assert.ok(p.width > 0 && p.height > 0);
    // WebP magic bytes start with "RIFF" .. "WEBP"
    assert.equal(p.buffer.subarray(0, 4).toString(), "RIFF");
    assert.equal(p.buffer.subarray(8, 12).toString(), "WEBP");
  }
  assert.ok(result.optimizedPdf instanceof Buffer);
  assert.ok(result.optimizedPdf.length > 0);
});

test("processPdf throws PdfProcessorError on malformed input", async () => {
  await assert.rejects(processPdf(Buffer.from("not a pdf")), /PdfProcessor/);
});

test("processPdf throws PdfProcessorError on empty buffer", async () => {
  await assert.rejects(processPdf(Buffer.alloc(0)), /PdfProcessor/);
});
