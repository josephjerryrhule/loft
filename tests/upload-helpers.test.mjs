import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Register the TS-extension resolver so that extensionless relative imports
// (e.g. `import { supabase } from "./supabase"`) resolve to their .ts counterparts.
register(
  pathToFileURL(
    new URL("./loaders/ts-resolve.mjs", import.meta.url).pathname
  ).href
);

let helpers;
let tmp;
test.before(async () => {
  tmp = await mkdtemp(path.join(tmpdir(), "loft-upload-"));
  process.env.UPLOAD_DIR_BASE = tmp;
  // Unset Supabase env so local branch is taken
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  helpers = await import("../src/lib/upload.ts");
});

test.after(async () => {
  await rm(tmp, { recursive: true, force: true });
});

test("uploadBuffer writes file and returns public URL", async () => {
  const url = await helpers.uploadBuffer(Buffer.from("hello"), "text/plain", "flipbooks/test123", "hello.txt");
  assert.match(url, /^\/uploads\/flipbooks\/test123\/hello\.txt$/);
  const onDisk = path.join(tmp, "flipbooks/test123/hello.txt");
  await access(onDisk);
  const content = await readFile(onDisk, "utf8");
  assert.equal(content, "hello");
});

test("uploadBuffer generates filename when none provided", async () => {
  const url = await helpers.uploadBuffer(Buffer.from("x"), "application/octet-stream", "flipbooks/gen");
  assert.match(url, /^\/uploads\/flipbooks\/gen\/[a-f0-9-]+\.bin$/);
});

test("deleteFlipbookAssets removes entire prefix", async () => {
  await helpers.uploadBuffer(Buffer.from("p1"), "image/webp", "flipbooks/wipe-me", "page-001.webp");
  await helpers.uploadBuffer(Buffer.from("p2"), "image/webp", "flipbooks/wipe-me", "page-002.webp");
  await helpers.deleteFlipbookAssets("wipe-me");
  await assert.rejects(access(path.join(tmp, "flipbooks/wipe-me")));
});
