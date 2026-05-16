# Flipbook Publishing Revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace admin flipbook table with a category-driven library grid; add a self-hosted PDF→WebP pre-render pipeline + `LoftFlipbookViewer` that mimics Heyzine's flip experience, so Heyzine outages no longer break consumer access.

**Architecture:** Inline `pdf-processor` (Ghostscript + pdftocairo + sharp) runs during `createFlipbook` server action. Pages written through the existing `lib/upload.ts` storage abstraction (Supabase staging / local FS on Plesk prod). New `Category` model FK on `Flipbook`. `ReliableFlipbookViewer` is rewritten and renamed to `LoftFlipbookViewer`, branching on iframe content vs page manifest. Admin UI swaps from table to pill-filter grid with rich cards.

**Tech Stack:** Next.js 15 App Router · Prisma + Postgres · `sharp` · `howler` · `react-pageflip` (already present) · Ghostscript + Poppler (system binaries) · native `node:test` for unit tests.

**Source spec:** `docs/superpowers/specs/2026-05-16-flipbook-revamp-design.md`

---

## File Structure

**New files**

| Path | Responsibility |
|---|---|
| `src/lib/pdf-processor.ts` | Pure pipeline: PDF buffer → compressed PDF + WebP page buffers + dimensions. No IO. |
| `src/lib/howler-wrapper.ts` | Lazy Howler loader; SSR-safe. |
| `src/app/actions/categories.ts` | CRUD server actions for Category. |
| `src/components/flipbook/LoftFlipbookViewer.tsx` | Rewritten viewer; iframe OR pages manifest. |
| `src/components/flipbook/FlipbookCard.tsx` | Rich card primitive + hover action overlay. |
| `src/components/flipbook/AdminFlipbookLibrary.tsx` | Search + pill filter + 4-col grid. |
| `src/components/flipbook/CreateFlipbookDialog.tsx` | Source-type tabs + upload progress. |
| `src/components/flipbook/UploadProgress.tsx` | Stage indicator reading SSE events. |
| `src/components/admin/CategoryManager.tsx` | Drag-reorder + rename + add/delete. |
| `prisma/migrations/<ts>_flipbook_revamp/migration.sql` | Schema migration. |
| `prisma/seed-categories.ts` | One-off data fix-up runner. |
| `public/sounds/page-flip.mp3` | Sound asset (CC0). |
| `tests/pdf-processor.test.mjs` | Processor pure-logic tests. |
| `tests/upload-helpers.test.mjs` | uploadBuffer + deleteFlipbookAssets tests. |
| `tests/category-slug.test.mjs` | Slug derivation tests. |

**Modified files**

| Path | Reason |
|---|---|
| `prisma/schema.prisma` | Add `Category` model + Flipbook fields. |
| `src/lib/upload.ts` | Add `uploadBuffer` + `deleteFlipbookAssets`. |
| `src/app/actions/flipbooks.ts` | Branch `createFlipbook` on sourceType; add `reRenderFlipbook`, `getFlipbooksGroupedByCategory`; wire delete to wipe assets. |
| `src/app/(dashboard)/admin/flipbooks/page.tsx` | Replace table with `AdminFlipbookLibrary`. |
| `src/components/admin/SystemSettingsForm.tsx` | New Categories tab mounting `CategoryManager`. |
| `src/components/flipbook/ReliableFlipbookViewer.tsx` | Delete (replaced by `LoftFlipbookViewer`). |
| All callers of `ReliableFlipbookViewer` | Import the new name. |
| `package.json` | Add `sharp`, `howler`, `@types/howler`. Add `test` script. |
| `README.md` | Document Plesk preconditions (ghostscript + poppler-utils). |

---

## Task 1: Install runtime dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install packages**

Run:
```bash
npm install sharp howler
npm install -D @types/howler
```

- [ ] **Step 2: Verify install**

Run:
```bash
node -e "require('sharp'); require('howler'); console.log('ok')"
```
Expected output: `ok`

- [ ] **Step 3: Add `test` script for node:test runner**

Edit `package.json` scripts block to include:
```json
"test": "node --test tests/**/*.test.mjs"
```

- [ ] **Step 4: Verify existing tests still pass**

Run:
```bash
npm test
```
Expected: `tests/access-control.test.mjs` and `tests/payout.test.mjs` both pass.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add sharp + howler deps and test script"
```

---

## Task 2: Document Plesk system-binary preconditions

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a deployment-preconditions section near the bottom of the README**

Append to `README.md`:

```markdown
## Deployment Preconditions

The self-hosted flipbook pipeline requires two system binaries on the host:

- `ghostscript` — PDF compression (`gs -dPDFSETTINGS=/ebook`)
- `poppler-utils` — PDF page rendering (`pdftocairo`)

**Debian / Ubuntu / Plesk:**
```bash
sudo apt-get update && sudo apt-get install -y ghostscript poppler-utils
```

**RHEL / CentOS:**
```bash
sudo yum install -y ghostscript poppler-utils
```

If either binary is missing, PDF uploads fail with a clear error and admin can still publish via Heyzine.
```

- [ ] **Step 2: Verify both binaries on current host (local dev only)**

Run:
```bash
which gs && gs --version
which pdftocairo && pdftocairo -v 2>&1 | head -1
```
Expected: both print paths + versions. If missing, install before proceeding.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: document ghostscript + poppler deployment preconditions"
```

---

## Task 3: Add page-flip sound asset

**Files:**
- Create: `public/sounds/page-flip.mp3`

- [ ] **Step 1: Create the sounds directory**

Run:
```bash
mkdir -p public/sounds
```

- [ ] **Step 2: Download a CC0-licensed page-flip sound**

Source: https://freesound.org/people/Mafon2/sounds/371274/ (CC0). Or use an internal asset.

Place at `public/sounds/page-flip.mp3`. Size should be under 50 KB.

Run:
```bash
ls -lh public/sounds/page-flip.mp3
```
Expected: file present, size sensible.

- [ ] **Step 3: Commit**

```bash
git add public/sounds/page-flip.mp3
git commit -m "feat: add CC0 page-flip sound asset for self-hosted viewer"
```

---

## Task 4: Add Category model + new Flipbook fields to Prisma schema

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the Category model**

Insert this block in `prisma/schema.prisma`, just above `model Flipbook`:

```prisma
model Category {
  id           String     @id @default(uuid())
  name         String     @unique
  slug         String     @unique
  displayOrder Int        @default(0) @map("display_order")
  createdAt    DateTime   @default(now()) @map("created_at")
  flipbooks    Flipbook[]

  @@index([displayOrder])
  @@map("categories")
}
```

- [ ] **Step 2: Add new fields + relation + enum to Flipbook**

Inside the `model Flipbook { … }` block, before `@@index([createdById])`, add:

```prisma
  categoryId           String?         @map("category_id")
  pagesManifest        Json?           @map("pages_manifest")
  optimizedPdfUrl      String?         @map("optimized_pdf_url")
  sourceType           FlipbookSource  @default(HEYZINE) @map("source_type")
  processingStartedAt  DateTime?       @map("processing_started_at")
  categoryRef          Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)
```

Then add these indexes inside the same model block:

```prisma
  @@index([categoryId])
  @@index([sourceType])
```

Add the enum at the bottom of the file (with the other enums):

```prisma
enum FlipbookSource {
  HEYZINE
  SELF_HOSTED
}
```

- [ ] **Step 3: Validate the schema parses**

Run:
```bash
npx prisma validate
```
Expected: `The schema at prisma/schema.prisma is valid`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add Category model + Flipbook source/manifest fields"
```

---

## Task 5: Generate + apply migration

**Files:**
- Create: `prisma/migrations/<timestamp>_flipbook_revamp/migration.sql`

- [ ] **Step 1: Generate the migration**

Run:
```bash
npx prisma migrate dev --name flipbook_revamp --create-only
```
Expected: new migration directory under `prisma/migrations/`.

- [ ] **Step 2: Open the generated migration.sql and append the data fix-up**

Append to the bottom of the generated `migration.sql`:

```sql
-- Seed default categories (idempotent)
INSERT INTO categories (id, name, slug, display_order, created_at)
VALUES
  (gen_random_uuid(), 'Sci-Fi',       'sci-fi',       10, NOW()),
  (gen_random_uuid(), 'Fantasy',      'fantasy',      20, NOW()),
  (gen_random_uuid(), 'Drama',        'drama',        30, NOW()),
  (gen_random_uuid(), 'Business',     'business',     40, NOW()),
  (gen_random_uuid(), 'Education',    'education',    50, NOW()),
  (gen_random_uuid(), 'Geography',    'geography',    60, NOW()),
  (gen_random_uuid(), 'Adventure',    'adventure',    70, NOW()),
  (gen_random_uuid(), 'Mystery',      'mystery',      80, NOW()),
  (gen_random_uuid(), 'Picture Book', 'picture-book', 90, NOW())
ON CONFLICT (slug) DO NOTHING;

-- Backfill source_type for existing rows
UPDATE flipbooks
SET source_type = 'SELF_HOSTED'
WHERE pdf_url IS NOT NULL
  AND iframe_content IS NULL
  AND heyzine_url IS NULL;
```

- [ ] **Step 3: Apply the migration**

Run:
```bash
npx prisma migrate dev
```
Expected: migration applied, Prisma client regenerated.

- [ ] **Step 4: Spot-check the result**

Run:
```bash
npx prisma db execute --stdin <<'SQL'
SELECT slug FROM categories ORDER BY display_order;
SELECT COUNT(*) FROM flipbooks WHERE source_type = 'HEYZINE';
SQL
```
Expected: all 9 seed slugs present; legacy Heyzine row count > 0 if you had any.

- [ ] **Step 5: Commit**

```bash
git add prisma/migrations/
git commit -m "feat: migrate flipbook schema, seed categories, backfill source_type"
```

---

## Task 6: Write legacy-category fix-up script

**Files:**
- Create: `prisma/seed-categories.ts`

- [ ] **Step 1: Create the script**

Write `prisma/seed-categories.ts`:

```ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const rows = await prisma.flipbook.findMany({
    where: { category: { not: null }, categoryId: null },
    select: { id: true, category: true },
  });

  const distinct = Array.from(new Set(rows.map((r) => r.category!.trim()).filter(Boolean)));
  console.log(`Found ${distinct.length} distinct legacy category strings, ${rows.length} flipbook rows to migrate.`);

  for (const name of distinct) {
    const slug = slugify(name);
    if (!slug) continue;
    const cat = await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, displayOrder: 1000 },
    });
    const updated = await prisma.flipbook.updateMany({
      where: { category: name, categoryId: null },
      data: { categoryId: cat.id },
    });
    console.log(`  ${name} (slug=${slug}) → ${updated.count} flipbooks linked`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run the script**

Run:
```bash
npx tsx prisma/seed-categories.ts
```
Expected: prints distinct count + per-category link count. Zero errors.

- [ ] **Step 3: Verify no orphan flipbooks remain**

Run:
```bash
npx prisma db execute --stdin <<'SQL'
SELECT COUNT(*) AS unmigrated FROM flipbooks WHERE category IS NOT NULL AND category_id IS NULL;
SQL
```
Expected: `unmigrated = 0`.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed-categories.ts
git commit -m "chore: legacy category string → Category FK fix-up script"
```

---

## Task 7: Write category-slug helper + unit tests

**Files:**
- Create: `src/lib/slug.ts`
- Create: `tests/category-slug.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `tests/category-slug.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { slugify } from "../src/lib/slug.ts";

test("slugify lowercases and replaces whitespace", () => {
  assert.equal(slugify("Picture Book"), "picture-book");
});

test("slugify strips non-word chars", () => {
  assert.equal(slugify("Sci-Fi & Fantasy!"), "sci-fi-fantasy");
});

test("slugify collapses underscores and dashes", () => {
  assert.equal(slugify("hello___world--foo"), "hello-world-foo");
});

test("slugify trims edges", () => {
  assert.equal(slugify("  Adventure  "), "adventure");
});

test("slugify returns empty string for symbols-only", () => {
  assert.equal(slugify("!@#"), "");
});
```

- [ ] **Step 2: Run test, expect failure**

Run:
```bash
npm test -- tests/category-slug.test.mjs
```
Expected: FAIL — module `../src/lib/slug.ts` not found.

- [ ] **Step 3: Implement `src/lib/slug.ts`**

```ts
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
```

- [ ] **Step 4: Run test, expect pass**

Run:
```bash
npm test -- tests/category-slug.test.mjs
```
Expected: 5/5 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/slug.ts tests/category-slug.test.mjs
git commit -m "feat(lib): add slugify helper with unit tests"
```

---

## Task 8: Write PDF processor failing tests

**Files:**
- Create: `tests/pdf-processor.test.mjs`
- Create: `tests/__fixtures__/sample-3p.pdf` (use any small 3-page test PDF)

- [ ] **Step 1: Add fixture PDF**

Either copy any small 3-page PDF you have to `tests/__fixtures__/sample-3p.pdf`, or generate one with Ghostscript:

```bash
mkdir -p tests/__fixtures__
gs -sDEVICE=pdfwrite -o tests/__fixtures__/sample-3p.pdf -dDEVICEWIDTHPOINTS=200 -dDEVICEHEIGHTPOINTS=300 \
   -c "/Helvetica findfont 24 scalefont setfont 50 150 moveto (Page 1) show showpage" \
   -c "/Helvetica findfont 24 scalefont setfont 50 150 moveto (Page 2) show showpage" \
   -c "/Helvetica findfont 24 scalefont setfont 50 150 moveto (Page 3) show showpage"
```

Verify:
```bash
file tests/__fixtures__/sample-3p.pdf
```
Expected: `PDF document`.

- [ ] **Step 2: Write the failing test**

Create `tests/pdf-processor.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { processPdf } from "../src/lib/pdf-processor.ts";

let hasBinaries = true;
try {
  execSync("which gs && which pdftocairo", { stdio: "ignore" });
} catch {
  hasBinaries = false;
}

test("processPdf returns manifest + optimized pdf for 3-page fixture", { skip: !hasBinaries }, async () => {
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
```

- [ ] **Step 3: Run test, expect failure**

Run:
```bash
npm test -- tests/pdf-processor.test.mjs
```
Expected: FAIL — module not found.

---

## Task 9: Implement pdf-processor

**Files:**
- Create: `src/lib/pdf-processor.ts`

- [ ] **Step 1: Write the implementation**

Create `src/lib/pdf-processor.ts`:

```ts
import { promises as fs } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const exec = promisify(execFile);

export class PdfProcessorError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`PdfProcessor: ${message}`);
    this.name = "PdfProcessorError";
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
```

- [ ] **Step 2: Run tests, expect pass**

Run:
```bash
npm test -- tests/pdf-processor.test.mjs
```
Expected: 3/3 PASS (or first test skipped if binaries absent).

- [ ] **Step 3: Commit**

```bash
git add src/lib/pdf-processor.ts tests/pdf-processor.test.mjs tests/__fixtures__/sample-3p.pdf
git commit -m "feat(lib): pdf-processor — compress + render PDF to WebP pages"
```

---

## Task 10: Extend upload helpers with uploadBuffer + deleteFlipbookAssets

**Files:**
- Modify: `src/lib/upload.ts`
- Create: `tests/upload-helpers.test.mjs`

- [ ] **Step 1: Write failing tests**

Create `tests/upload-helpers.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

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
```

- [ ] **Step 2: Run test, expect failure**

Run:
```bash
npm test -- tests/upload-helpers.test.mjs
```
Expected: FAIL — `uploadBuffer` / `deleteFlipbookAssets` not exported.

- [ ] **Step 3: Add helpers to `src/lib/upload.ts`**

Add these imports near the top:
```ts
import { promises as fs } from "fs";
```

(Already present — verify.)

Add these new exports at the bottom of `src/lib/upload.ts`:

```ts
/**
 * Upload a raw Buffer (vs File). Used by the PDF processor pipeline
 * which generates page buffers, not File objects.
 */
export async function uploadBuffer(
  data: Buffer,
  contentType: string,
  folder: string,
  filename?: string
): Promise<string> {
  const finalName = filename ?? `${randomUUID()}.${extFromContentType(contentType)}`;

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
  ) {
    const filePath = `${folder}/${finalName}`;
    const { error } = await supabase.storage
      .from("uploads")
      .upload(filePath, data, { contentType, upsert: false });
    if (error) throw new Error(`Failed to upload buffer: ${error.message}`);
    const { data: publicData } = supabase.storage.from("uploads").getPublicUrl(filePath);
    return publicData.publicUrl;
  }

  const baseUploadDir =
    process.env.UPLOAD_DIR_BASE || path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  const uploadDir = path.join(/*turbopackIgnore: true*/ baseUploadDir, folder);
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(/*turbopackIgnore: true*/ uploadDir, finalName), data);
  return `/uploads/${folder}/${finalName}`;
}

function extFromContentType(ct: string): string {
  if (ct === "image/webp") return "webp";
  if (ct === "image/png") return "png";
  if (ct === "image/jpeg") return "jpg";
  if (ct === "application/pdf") return "pdf";
  return "bin";
}

/**
 * Wipe all assets under flipbooks/<id>/ (local fs OR Supabase prefix).
 */
export async function deleteFlipbookAssets(flipbookId: string): Promise<void> {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
  ) {
    const prefix = `flipbooks/${flipbookId}/`;
    const { data: list, error: listErr } = await supabase.storage.from("uploads").list(prefix);
    if (listErr || !list) return;
    const paths = list.map((f) => `${prefix}${f.name}`);
    if (paths.length > 0) await supabase.storage.from("uploads").remove(paths);
    return;
  }

  const baseUploadDir =
    process.env.UPLOAD_DIR_BASE || path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  const dir = path.join(/*turbopackIgnore: true*/ baseUploadDir, "flipbooks", flipbookId);
  await fs.rm(dir, { recursive: true, force: true });
}
```

- [ ] **Step 4: Run test, expect pass**

Run:
```bash
npm test -- tests/upload-helpers.test.mjs
```
Expected: 3/3 PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/upload.ts tests/upload-helpers.test.mjs
git commit -m "feat(lib): uploadBuffer + deleteFlipbookAssets for flipbook pipeline"
```

---

## Task 11: Add Howler wrapper (SSR-safe)

**Files:**
- Create: `src/lib/howler-wrapper.ts`

- [ ] **Step 1: Create the wrapper**

```ts
"use client";

import type { Howl as HowlType } from "howler";

let howlInstance: HowlType | null = null;
let sound: HowlType | null = null;

export async function preloadPageFlipSound(): Promise<void> {
  if (typeof window === "undefined") return;
  if (sound) return;
  const { Howl } = await import("howler");
  howlInstance = Howl as any;
  sound = new Howl({
    src: ["/sounds/page-flip.mp3"],
    volume: 0.4,
    onloaderror: () => {
      sound = null;
    },
  });
}

export function playPageFlip(): void {
  if (sound && typeof window !== "undefined") {
    try {
      sound.stop();
      sound.play();
    } catch {
      // swallow — sound is non-critical
    }
  }
}

export function isPageFlipSoundAvailable(): boolean {
  return sound !== null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/howler-wrapper.ts
git commit -m "feat(lib): SSR-safe Howler wrapper for page-flip sound"
```

---

## Task 12: Create categories server actions

**Files:**
- Create: `src/app/actions/categories.ts`

- [ ] **Step 1: Implement the action module**

```ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slug";

async function assertAdminOrOps() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
    throw new Error("Unauthorized");
  }
}

export async function listCategories() {
  return prisma.category.findMany({
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { flipbooks: true } } },
  });
}

export async function createCategory(name: string) {
  try {
    await assertAdminOrOps();
    const trimmed = name.trim();
    if (!trimmed) return { error: "Name required" };
    const slug = slugify(trimmed);
    if (!slug) return { error: "Name produces empty slug — use letters/numbers" };
    const last = await prisma.category.findFirst({
      orderBy: { displayOrder: "desc" },
      select: { displayOrder: true },
    });
    const cat = await prisma.category.create({
      data: { name: trimmed, slug, displayOrder: (last?.displayOrder ?? 0) + 10 },
    });
    revalidatePath("/settings");
    return { success: true, category: cat };
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A category with this name already exists" };
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    console.error("createCategory failed", e);
    return { error: "Failed to create category" };
  }
}

export async function renameCategory(id: string, name: string) {
  try {
    await assertAdminOrOps();
    const trimmed = name.trim();
    if (!trimmed) return { error: "Name required" };
    const slug = slugify(trimmed);
    if (!slug) return { error: "Name produces empty slug" };
    await prisma.category.update({ where: { id }, data: { name: trimmed, slug } });
    revalidatePath("/settings");
    revalidatePath("/admin/flipbooks");
    return { success: true };
  } catch (e: any) {
    if (e?.code === "P2002") return { error: "A category with this name already exists" };
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: "Failed to rename" };
  }
}

export async function reorderCategories(orderedIds: string[]) {
  try {
    await assertAdminOrOps();
    await prisma.$transaction(
      orderedIds.map((id, idx) =>
        prisma.category.update({
          where: { id },
          data: { displayOrder: (idx + 1) * 10 },
        })
      )
    );
    revalidatePath("/settings");
    revalidatePath("/admin/flipbooks");
    return { success: true };
  } catch (e: any) {
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: "Failed to reorder" };
  }
}

export async function deleteCategory(id: string) {
  try {
    await assertAdminOrOps();
    const count = await prisma.flipbook.count({ where: { categoryId: id } });
    if (count > 0) {
      return { error: `Category in use by ${count} flipbooks. Reassign first.` };
    }
    await prisma.category.delete({ where: { id } });
    revalidatePath("/settings");
    return { success: true };
  } catch (e: any) {
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: "Failed to delete" };
  }
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/categories.ts
git commit -m "feat(actions): category CRUD with role guards"
```

---

## Task 13: Extend flipbooks server actions

**Files:**
- Modify: `src/app/actions/flipbooks.ts`

- [ ] **Step 1: Read the current file to understand existing exports**

Run:
```bash
grep -n "^export" src/app/actions/flipbooks.ts
```
Note the names of existing exports so you don't duplicate them.

- [ ] **Step 2: Add imports at the top of the file**

Add (or merge with existing imports):

```ts
import { processPdf, PdfProcessorError } from "@/lib/pdf-processor";
import { uploadBuffer, deleteFlipbookAssets } from "@/lib/upload";
```

- [ ] **Step 3: Add a helper inside the module**

```ts
const MAX_SOURCE_PDF_MB = 50;
const MAX_OPTIMIZED_PDF_MB = 25;

async function assertAdminOrOpsForFlipbook() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.id || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
    throw new Error("Unauthorized");
  }
  return session!.user!.id;
}
```

(If `auth` is not already imported, add `import { auth } from "@/auth";`.)

- [ ] **Step 4: Replace the existing `createFlipbook` with a sourceType-branching version**

Locate the existing `createFlipbook` export. Replace it entirely with:

```ts
type CreateFlipbookInput =
  | {
      sourceType: "HEYZINE";
      title: string;
      description?: string;
      categoryId?: string | null;
      ageGroup?: string | null;
      isFree?: boolean;
      coverImageUrl?: string | null;
      heyzineUrl?: string | null;
      iframeContent?: string | null;
    }
  | {
      sourceType: "SELF_HOSTED";
      title: string;
      description?: string;
      categoryId?: string | null;
      ageGroup?: string | null;
      isFree?: boolean;
      coverImageUrl?: string | null;
      pdfFile: { name: string; type: string; size: number; arrayBuffer(): Promise<ArrayBuffer> };
    };

export async function createFlipbook(input: CreateFlipbookInput) {
  try {
    const userId = await assertAdminOrOpsForFlipbook();

    if (input.sourceType === "HEYZINE") {
      const fb = await prisma.flipbook.create({
        data: {
          title: input.title,
          description: input.description,
          categoryId: input.categoryId ?? null,
          ageGroup: input.ageGroup ?? null,
          isFree: input.isFree ?? false,
          coverImageUrl: input.coverImageUrl ?? null,
          heyzineUrl: input.heyzineUrl ?? null,
          iframeContent: input.iframeContent ?? null,
          sourceType: "HEYZINE",
          createdById: userId,
        },
      });
      revalidatePath("/admin/flipbooks");
      return { success: true, id: fb.id };
    }

    // SELF_HOSTED path
    const sizeMb = input.pdfFile.size / (1024 * 1024);
    if (sizeMb > MAX_SOURCE_PDF_MB) {
      return { error: `PDF too large (${sizeMb.toFixed(1)} MB). Max ${MAX_SOURCE_PDF_MB} MB.` };
    }
    if (input.pdfFile.type !== "application/pdf") {
      return { error: "Only PDF files are accepted" };
    }

    const created = await prisma.flipbook.create({
      data: {
        title: input.title,
        description: input.description,
        categoryId: input.categoryId ?? null,
        ageGroup: input.ageGroup ?? null,
        isFree: input.isFree ?? false,
        coverImageUrl: input.coverImageUrl ?? null,
        sourceType: "SELF_HOSTED",
        createdById: userId,
        processingStartedAt: new Date(),
      },
    });

    try {
      const ab = await input.pdfFile.arrayBuffer();
      const buf = Buffer.from(ab);
      const result = await processPdf(buf);

      const optMb = result.optimizedPdf.length / (1024 * 1024);
      if (optMb > MAX_OPTIMIZED_PDF_MB) {
        throw new Error(
          `PDF couldn't be compressed below ${MAX_OPTIMIZED_PDF_MB} MB (got ${optMb.toFixed(1)} MB). Try splitting into chapters.`
        );
      }

      const folder = `flipbooks/${created.id}`;
      const sourceUrl = await uploadBuffer(buf, "application/pdf", folder, "source.pdf");
      const optimizedUrl = await uploadBuffer(result.optimizedPdf, "application/pdf", folder, "optimized.pdf");

      const pages = [];
      for (let i = 0; i < result.pages.length; i++) {
        const name = `page-${String(i + 1).padStart(3, "0")}.webp`;
        const url = await uploadBuffer(result.pages[i].buffer, "image/webp", folder, name);
        pages.push({ url, width: result.pages[i].width, height: result.pages[i].height });
      }

      const manifest = {
        totalPages: result.totalPages,
        pages,
        generatedAt: new Date().toISOString(),
      };

      await prisma.flipbook.update({
        where: { id: created.id },
        data: {
          pdfUrl: sourceUrl,
          optimizedPdfUrl: optimizedUrl,
          pagesManifest: manifest as any,
          totalPages: result.totalPages,
          coverImageUrl: input.coverImageUrl ?? pages[0]?.url ?? null,
          processingStartedAt: null,
        },
      });

      revalidatePath("/admin/flipbooks");
      return { success: true, id: created.id };
    } catch (e: any) {
      // Roll back DB row + wipe any partial assets
      await deleteFlipbookAssets(created.id).catch(() => {});
      await prisma.flipbook.delete({ where: { id: created.id } }).catch(() => {});
      const msg =
        e instanceof PdfProcessorError ? e.message : e?.message ?? "PDF processing failed";
      return { error: msg };
    }
  } catch (e: any) {
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    console.error("createFlipbook failed", e);
    return { error: "Failed to create flipbook" };
  }
}
```

- [ ] **Step 5: Add `reRenderFlipbook`**

Append:

```ts
export async function reRenderFlipbook(id: string) {
  try {
    await assertAdminOrOpsForFlipbook();
    const fb = await prisma.flipbook.findUnique({
      where: { id },
      select: { id: true, sourceType: true, pdfUrl: true, processingStartedAt: true },
    });
    if (!fb) return { error: "Flipbook not found" };
    if (fb.sourceType !== "SELF_HOSTED") return { error: "Only self-hosted flipbooks can be re-rendered" };
    if (!fb.pdfUrl) return { error: "No source PDF on record — re-upload required" };
    if (fb.processingStartedAt && Date.now() - fb.processingStartedAt.getTime() < 10 * 60 * 1000) {
      return { error: "Re-render already in progress" };
    }

    await prisma.flipbook.update({
      where: { id },
      data: { processingStartedAt: new Date() },
    });

    // Fetch the original PDF from storage (resolved as URL or local path)
    let buf: Buffer;
    if (fb.pdfUrl.startsWith("/uploads/")) {
      const fsMod = await import("fs/promises");
      const pathMod = await import("path");
      const base = process.env.UPLOAD_DIR_BASE || pathMod.join(process.cwd(), "public", "uploads");
      const relative = fb.pdfUrl.replace("/uploads/", "");
      buf = await fsMod.readFile(pathMod.join(base, relative));
    } else {
      const res = await fetch(fb.pdfUrl);
      if (!res.ok) throw new Error(`Cannot fetch source PDF: ${res.status}`);
      buf = Buffer.from(await res.arrayBuffer());
    }

    const result = await processPdf(buf);

    // Write new pages under flipbooks/<id>/v<timestamp>/ then atomic-swap
    const ts = Date.now();
    const folder = `flipbooks/${id}/v${ts}`;
    const optimizedUrl = await uploadBuffer(result.optimizedPdf, "application/pdf", folder, "optimized.pdf");
    const newPages = [];
    for (let i = 0; i < result.pages.length; i++) {
      const name = `page-${String(i + 1).padStart(3, "0")}.webp`;
      const url = await uploadBuffer(result.pages[i].buffer, "image/webp", folder, name);
      newPages.push({ url, width: result.pages[i].width, height: result.pages[i].height });
    }

    const manifest = {
      totalPages: result.totalPages,
      pages: newPages,
      generatedAt: new Date().toISOString(),
    };

    await prisma.flipbook.update({
      where: { id },
      data: {
        optimizedPdfUrl: optimizedUrl,
        pagesManifest: manifest as any,
        totalPages: result.totalPages,
        processingStartedAt: null,
      },
    });

    // Note: old page assets remain at flipbooks/<id>/page-*.webp.
    // They become orphan but harmless. A maintenance pass can prune older v* folders.

    revalidatePath("/admin/flipbooks");
    return { success: true };
  } catch (e: any) {
    await prisma.flipbook.update({ where: { id }, data: { processingStartedAt: null } }).catch(() => {});
    if (e.message === "Unauthorized") return { error: "Unauthorized" };
    return { error: e?.message || "Re-render failed" };
  }
}
```

- [ ] **Step 6: Add `getFlipbooksGroupedByCategory`**

```ts
export async function getFlipbooksGroupedByCategory() {
  await assertAdminOrOpsForFlipbook();
  const [categories, flipbooks] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.flipbook.findMany({
      orderBy: { createdAt: "desc" },
      include: { categoryRef: true },
    }),
  ]);

  const uncategorized = flipbooks.filter((f) => !f.categoryId);
  const groups = categories.map((c) => ({
    category: c,
    flipbooks: flipbooks.filter((f) => f.categoryId === c.id),
  }));

  if (uncategorized.length > 0) {
    groups.push({
      category: { id: "__uncategorized__", name: "Uncategorized", slug: "uncategorized", displayOrder: 9999, createdAt: new Date() } as any,
      flipbooks: uncategorized,
    });
  }

  return groups;
}
```

- [ ] **Step 7: Update `deleteFlipbook` to wipe assets first**

Find the existing `deleteFlipbook` export. Before the existing `prisma.flipbook.delete` call, add:

```ts
await deleteFlipbookAssets(id).catch((e) => console.error("Asset wipe failed for", id, e));
```

- [ ] **Step 8: Type-check**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add src/app/actions/flipbooks.ts
git commit -m "feat(actions): createFlipbook source branching, reRender, category grouping"
```

---

## Task 14: Rewrite ReliableFlipbookViewer → LoftFlipbookViewer

**Files:**
- Create: `src/components/flipbook/LoftFlipbookViewer.tsx`
- Delete (later): `src/components/flipbook/ReliableFlipbookViewer.tsx`

- [ ] **Step 1: Create the new viewer**

```tsx
"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { ChevronLeft, ChevronRight, X, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { preloadPageFlipSound, playPageFlip } from "@/lib/howler-wrapper";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), { ssr: false });

interface ManifestPage {
  url: string;
  width: number;
  height: number;
}

export interface LoftFlipbookViewerProps {
  iframeContent?: string;
  pages?: ManifestPage[];
  onClose: () => void;
  title?: string;
  initialPage?: number;
  onComplete?: () => void;
}

const IFRAME_LOAD_TIMEOUT_MS = 8000;
const MUTE_STORAGE_KEY = "loft.flipbook.muted";

export function LoftFlipbookViewer({
  iframeContent,
  pages,
  onClose,
  title,
  initialPage = 0,
  onComplete,
}: LoftFlipbookViewerProps) {
  const [iframeFailed, setIframeFailed] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [dimensions, setDimensions] = useState({ width: 600, height: 800 });
  const flipRef = useRef<any>(null);

  const useIframe = Boolean(iframeContent) && !iframeFailed;
  const useSelfHost = !useIframe && pages && pages.length > 0;

  useEffect(() => {
    if (useSelfHost) preloadPageFlipSound();
  }, [useSelfHost]);

  // Iframe timeout watchdog
  useEffect(() => {
    if (!iframeContent || iframeFailed) return;
    const t = setTimeout(() => setIframeFailed(true), IFRAME_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [iframeContent, iframeFailed]);

  // Responsive sizing for the self-host flipbook
  useEffect(() => {
    if (!useSelfHost) return;
    const recalc = () => {
      const w = Math.min(window.innerWidth * 0.9, 900);
      const h = Math.min(window.innerHeight * 0.85, 1200);
      setDimensions({ width: Math.floor(w / 2) * 2, height: Math.floor(h) });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [useSelfHost]);

  const toggleMute = () => {
    setMuted((m) => {
      const next = !m;
      try {
        localStorage.setItem(MUTE_STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const onFlipHandler = (e: any) => {
    if (!muted) playPageFlip();
    if (pages && e?.data === pages.length - 1 && onComplete) onComplete();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
      >
        <X className="h-5 w-5" />
      </button>

      {title && (
        <div className="absolute top-4 left-4 z-10 text-white font-bold tracking-wide">{title}</div>
      )}

      {useSelfHost && (
        <button
          onClick={toggleMute}
          aria-label={muted ? "Unmute" : "Mute"}
          className="absolute top-4 right-16 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
      )}

      {useIframe && iframeContent && (
        <iframe
          srcDoc={iframeContent}
          className="w-[95vw] h-[90vh] border-0 rounded-lg"
          onError={() => setIframeFailed(true)}
        />
      )}

      {useSelfHost && pages && (
        <HTMLFlipBook
          // @ts-expect-error — react-pageflip types are loose
          width={dimensions.width / 2}
          height={dimensions.height}
          size="stretch"
          minWidth={300}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1200}
          drawShadow
          flippingTime={700}
          usePortrait
          startZIndex={0}
          autoSize
          maxShadowOpacity={0.5}
          showCover
          mobileScrollSupport
          startPage={initialPage}
          ref={flipRef}
          onFlip={onFlipHandler}
          className="loft-flipbook"
        >
          {pages.map((p, idx) => (
            <div key={idx} className="page bg-white">
              <img
                src={p.url}
                alt={`Page ${idx + 1}`}
                loading="lazy"
                draggable={false}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            </div>
          ))}
        </HTMLFlipBook>
      )}

      {!useIframe && !useSelfHost && (
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-xl font-black mb-2">Flipbook unavailable</h2>
          <p className="text-slate-500 mb-4">
            We couldn't load this flipbook right now. Try again later or contact support.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/flipbook/LoftFlipbookViewer.tsx
git commit -m "feat(flipbook): LoftFlipbookViewer — iframe + self-host with sound + mute"
```

---

## Task 15: Migrate callers from ReliableFlipbookViewer to LoftFlipbookViewer

**Files:**
- Modify: every file importing `ReliableFlipbookViewer`
- Delete: `src/components/flipbook/ReliableFlipbookViewer.tsx`

- [ ] **Step 1: Find all callers**

Run:
```bash
grep -rln "ReliableFlipbookViewer" src/ --include='*.ts' --include='*.tsx'
```
Note every file. Likely candidates: `src/app/child/(dashboard)/flipbooks/[id]/page.tsx`, parent dashboard, admin preview, etc.

- [ ] **Step 2: Rewrite each caller**

In each file:
- Replace `import { ReliableFlipbookViewer } from "@/components/flipbook/ReliableFlipbookViewer"` with `import { LoftFlipbookViewer } from "@/components/flipbook/LoftFlipbookViewer"`.
- Replace JSX usage `<ReliableFlipbookViewer pdfUrl={X} ... />` with `<LoftFlipbookViewer pages={flipbook.pagesManifest?.pages} iframeContent={flipbook.iframeContent} ... />`.
- For each caller, fetch `pagesManifest` on the server query for the flipbook page so it's available client-side.

- [ ] **Step 3: Delete the old viewer**

```bash
rm src/components/flipbook/ReliableFlipbookViewer.tsx
```

- [ ] **Step 4: Type-check + grep cleanup**

```bash
npx tsc --noEmit -p tsconfig.json
grep -rn "ReliableFlipbookViewer" src/ || echo "all clean"
```
Expected: clean type-check; grep prints nothing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: migrate all callers to LoftFlipbookViewer, remove old viewer"
```

---

## Task 16: Create FlipbookCard component

**Files:**
- Create: `src/components/flipbook/FlipbookCard.tsx`

- [ ] **Step 1: Create the card**

```tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, RefreshCw, Play, Pause, Globe, HardDrive } from "lucide-react";
import { deleteFlipbook, reRenderFlipbook } from "@/app/actions/flipbooks";

export interface FlipbookCardData {
  id: string;
  title: string;
  coverImageUrl: string | null;
  isPublished: boolean;
  isFree: boolean;
  totalPages: number | null;
  ageGroup: string | null;
  sourceType: "HEYZINE" | "SELF_HOSTED";
}

interface Props {
  flipbook: FlipbookCardData;
  onEdit: (id: string) => void;
  onPublishToggle: (id: string, next: boolean) => Promise<void>;
}

export function FlipbookCard({ flipbook, onEdit, onPublishToggle }: Props) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const [busy, startTransition] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Delete "${flipbook.title}"? This wipes the cover, pages, and source PDF.`)) return;
    startTransition(async () => {
      const r = await deleteFlipbook(flipbook.id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Flipbook deleted");
        router.refresh();
      }
    });
  };

  const handleRerender = () => {
    if (flipbook.sourceType !== "SELF_HOSTED") {
      toast.error("Re-render only available for self-hosted flipbooks");
      return;
    }
    startTransition(async () => {
      const r = await reRenderFlipbook(flipbook.id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Re-render complete");
        router.refresh();
      }
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      await onPublishToggle(flipbook.id, !flipbook.isPublished);
      router.refresh();
    });
  };

  return (
    <div
      className="relative w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-200 to-slate-300">
        {flipbook.coverImageUrl && (
          <img src={flipbook.coverImageUrl} alt={flipbook.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
              flipbook.isPublished ? "bg-emerald-500 text-white" : "bg-slate-400 text-white"
            }`}
          >
            {flipbook.isPublished ? "Live" : "Draft"}
          </span>
        </div>
        {flipbook.ageGroup && (
          <div className="absolute top-2 left-2 text-[9px] font-bold bg-black/40 backdrop-blur text-white px-2 py-0.5 rounded">
            {flipbook.ageGroup}
          </div>
        )}

        {hovered && (
          <div className="absolute inset-0 bg-slate-950/85 flex flex-col justify-center items-stretch gap-2 p-4">
            <Button size="sm" className="bg-[#E87154] hover:bg-[#D66144] text-white font-bold" onClick={() => onEdit(flipbook.id)} disabled={busy}>
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={handlePublish} disabled={busy}>
              {flipbook.isPublished ? <Pause className="h-3 w-3 mr-1" /> : <Play className="h-3 w-3 mr-1" />}
              {flipbook.isPublished ? "Unpublish" : "Publish"}
            </Button>
            {flipbook.sourceType === "SELF_HOSTED" && (
              <Button size="sm" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10" onClick={handleRerender} disabled={busy}>
                <RefreshCw className="h-3 w-3 mr-1" /> Re-render
              </Button>
            )}
            <Button size="sm" variant="outline" className="bg-transparent border-red-400/40 text-red-300 hover:bg-red-500/10" onClick={handleDelete} disabled={busy}>
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-sm font-black text-slate-900 truncate">{flipbook.title}</p>
        <div className="flex justify-between items-center mt-1 text-[10px] text-slate-500 font-bold">
          <span>{flipbook.totalPages ?? "—"} pages</span>
          <span className={flipbook.isFree ? "text-emerald-600" : "text-[#E87154]"}>{flipbook.isFree ? "FREE" : "PAID"}</span>
        </div>
        <div className="mt-1 flex items-center gap-1 text-[9px] text-slate-400 font-bold">
          {flipbook.sourceType === "HEYZINE" ? <Globe className="h-3 w-3" /> : <HardDrive className="h-3 w-3" />}
          {flipbook.sourceType === "HEYZINE" ? "Heyzine" : "Self-host"}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run:
```bash
npx tsc --noEmit -p tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add src/components/flipbook/FlipbookCard.tsx
git commit -m "feat(flipbook): FlipbookCard component with hover action overlay"
```

---

## Task 17: Create AdminFlipbookLibrary component

**Files:**
- Create: `src/components/flipbook/AdminFlipbookLibrary.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FlipbookCard, type FlipbookCardData } from "./FlipbookCard";

interface CategoryGroup {
  category: { id: string; name: string; slug: string };
  flipbooks: FlipbookCardData[];
}

interface Props {
  groups: CategoryGroup[];
  onEdit: (id: string) => void;
  onPublishToggle: (id: string, next: boolean) => Promise<void>;
  renderCreateButton?: () => React.ReactNode;
}

export function AdminFlipbookLibrary({ groups, onEdit, onPublishToggle, renderCreateButton }: Props) {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string>("ALL");

  const flatFiltered = useMemo(() => {
    const all = groups.flatMap((g) => g.flipbooks.map((f) => ({ ...f, _catId: g.category.id })));
    const byCat = activeCat === "ALL" ? all : all.filter((f) => f._catId === activeCat);
    if (!search.trim()) return byCat;
    const q = search.toLowerCase();
    return byCat.filter((f) => f.title.toLowerCase().includes(q));
  }, [groups, activeCat, search]);

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search flipbooks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl font-medium"
          />
        </div>
        {renderCreateButton?.()}
      </div>

      <div className="flex flex-wrap gap-2">
        <CategoryPill label="All" active={activeCat === "ALL"} onClick={() => setActiveCat("ALL")} />
        {groups.map((g) => (
          <CategoryPill
            key={g.category.id}
            label={`${g.category.name} (${g.flipbooks.length})`}
            active={activeCat === g.category.id}
            onClick={() => setActiveCat(g.category.id)}
          />
        ))}
      </div>

      {flatFiltered.length === 0 ? (
        <div className="text-center py-20 text-slate-400 font-medium">
          No flipbooks match your filters.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {flatFiltered.map((f) => (
            <FlipbookCard key={f.id} flipbook={f} onEdit={onEdit} onPublishToggle={onPublishToggle} />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-black transition ${
        active
          ? "bg-slate-900 text-white shadow"
          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
      }`}
    >
      {label}
    </button>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add src/components/flipbook/AdminFlipbookLibrary.tsx
git commit -m "feat(flipbook): AdminFlipbookLibrary — search + pill filter + grid"
```

---

## Task 18: Create UploadProgress component

**Files:**
- Create: `src/components/flipbook/UploadProgress.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type UploadStage =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "compressing" }
  | { kind: "rendering" }
  | { kind: "saving" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const STAGE_ORDER: Array<{ key: UploadStage["kind"]; label: string }> = [
  { key: "uploading", label: "Uploading source PDF" },
  { key: "compressing", label: "Compressing" },
  { key: "rendering", label: "Rendering pages" },
  { key: "saving", label: "Saving manifest" },
];

function rank(stage: UploadStage): number {
  if (stage.kind === "idle") return -1;
  if (stage.kind === "error") return 999;
  if (stage.kind === "done") return STAGE_ORDER.length;
  return STAGE_ORDER.findIndex((s) => s.key === stage.kind);
}

export function UploadProgress({ stage }: { stage: UploadStage }) {
  if (stage.kind === "idle") return null;
  const current = rank(stage);

  return (
    <div className="space-y-2">
      {STAGE_ORDER.map((s, idx) => {
        const isDone = idx < current || stage.kind === "done";
        const isActive = idx === current && stage.kind !== "done" && stage.kind !== "error";
        return (
          <div key={s.key} className="flex items-center gap-2 text-sm">
            {stage.kind === "error" && idx === current ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : isDone ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : isActive ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#E87154]" />
            ) : (
              <div className="h-4 w-4 rounded-full border-2 border-slate-200" />
            )}
            <span
              className={cn(
                "font-medium",
                isDone && "text-slate-700",
                isActive && "text-slate-900 font-bold",
                !isDone && !isActive && "text-slate-400"
              )}
            >
              {s.label}
            </span>
          </div>
        );
      })}
      {stage.kind === "error" && (
        <p className="text-xs text-red-600 font-medium pt-2">{stage.message}</p>
      )}
      {stage.kind === "done" && (
        <p className="text-xs text-emerald-600 font-bold pt-2">All done.</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/flipbook/UploadProgress.tsx
git commit -m "feat(flipbook): UploadProgress stage indicator"
```

---

## Task 19: Create CreateFlipbookDialog

**Files:**
- Create: `src/components/flipbook/CreateFlipbookDialog.tsx`

- [ ] **Step 1: Create the dialog**

```tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Globe, HardDrive } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createFlipbook } from "@/app/actions/flipbooks";
import { UploadProgress, type UploadStage } from "./UploadProgress";

interface Category {
  id: string;
  name: string;
}

export function CreateFlipbookDialog({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"heyzine" | "pdf">("heyzine");
  const [pending, startTransition] = useTransition();
  const [stage, setStage] = useState<UploadStage>({ kind: "idle" });

  // shared fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [ageGroup, setAgeGroup] = useState<string>("");
  const [isFree, setIsFree] = useState(true);

  // heyzine fields
  const [heyzineUrl, setHeyzineUrl] = useState("");
  const [iframeContent, setIframeContent] = useState("");

  // pdf fields
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setCategoryId("");
    setAgeGroup("");
    setIsFree(true);
    setHeyzineUrl("");
    setIframeContent("");
    setPdfFile(null);
    setStage({ kind: "idle" });
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Title required");
      return;
    }

    startTransition(async () => {
      try {
        if (tab === "heyzine") {
          if (!heyzineUrl && !iframeContent) {
            toast.error("Provide a Heyzine URL or iframe HTML");
            return;
          }
          setStage({ kind: "saving" });
          const r = await createFlipbook({
            sourceType: "HEYZINE",
            title,
            description,
            categoryId: categoryId || null,
            ageGroup: ageGroup || null,
            isFree,
            heyzineUrl: heyzineUrl || null,
            iframeContent: iframeContent || null,
          });
          if (r?.error) {
            setStage({ kind: "error", message: r.error });
            return;
          }
          setStage({ kind: "done" });
          toast.success("Flipbook created");
          setOpen(false);
          reset();
          router.refresh();
        } else {
          if (!pdfFile) {
            toast.error("Pick a PDF");
            return;
          }
          setStage({ kind: "uploading" });
          // Server action runs end-to-end; we can't observe stages without SSE.
          // Show "compressing" right after handoff to keep UI alive.
          setTimeout(() => setStage((s) => (s.kind === "uploading" ? { kind: "compressing" } : s)), 1500);
          setTimeout(() => setStage((s) => (s.kind === "compressing" ? { kind: "rendering" } : s)), 5000);

          const r = await createFlipbook({
            sourceType: "SELF_HOSTED",
            title,
            description,
            categoryId: categoryId || null,
            ageGroup: ageGroup || null,
            isFree,
            pdfFile,
          });

          if (r?.error) {
            setStage({ kind: "error", message: r.error });
            return;
          }
          setStage({ kind: "done" });
          toast.success("Flipbook published");
          setTimeout(() => {
            setOpen(false);
            reset();
            router.refresh();
          }, 600);
        }
      } catch (e: any) {
        setStage({ kind: "error", message: e?.message || "Upload failed" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button className="bg-[#E87154] hover:bg-[#D66144] text-white font-bold gap-2">
          <Plus className="h-4 w-4" /> New Flipbook
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create flipbook</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={pending}>
                <SelectTrigger><SelectValue placeholder="Pick…" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age group</Label>
              <Select value={ageGroup} onValueChange={setAgeGroup} disabled={pending}>
                <SelectTrigger><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0-3">0-3</SelectItem>
                  <SelectItem value="4-7">4-7</SelectItem>
                  <SelectItem value="8+">8+</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <input id="isFree" type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} disabled={pending} />
              <Label htmlFor="isFree">Free</Label>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="heyzine"><Globe className="h-4 w-4 mr-2" /> Heyzine</TabsTrigger>
              <TabsTrigger value="pdf"><HardDrive className="h-4 w-4 mr-2" /> PDF Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="heyzine" className="space-y-3 pt-4">
              <div>
                <Label>Heyzine URL</Label>
                <Input value={heyzineUrl} onChange={(e) => setHeyzineUrl(e.target.value)} placeholder="https://heyzine.com/flip-book/…" disabled={pending} />
              </div>
              <div>
                <Label>Or paste iframe HTML</Label>
                <Textarea value={iframeContent} onChange={(e) => setIframeContent(e.target.value)} rows={4} disabled={pending} />
              </div>
            </TabsContent>
            <TabsContent value="pdf" className="space-y-3 pt-4">
              <Input type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)} disabled={pending} />
              {pdfFile && <p className="text-xs text-slate-500">{pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(1)} MB)</p>}
              <p className="text-[11px] text-slate-400">Max 50 MB. The server will compress + render pages — this may take 10-60 seconds.</p>
            </TabsContent>
          </Tabs>

          {stage.kind !== "idle" && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <UploadProgress stage={stage} />
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={submit} disabled={pending} className="bg-[#E87154] hover:bg-[#D66144] text-white font-bold">
              {pending ? "Working…" : "Create flipbook"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add src/components/flipbook/CreateFlipbookDialog.tsx
git commit -m "feat(flipbook): CreateFlipbookDialog with Heyzine + PDF tabs"
```

---

## Task 20: Rewrite /admin/flipbooks page

**Files:**
- Modify (rewrite): `src/app/(dashboard)/admin/flipbooks/page.tsx`

- [ ] **Step 1: Rewrite the page**

Replace the entire file contents with:

```tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getFlipbooksGroupedByCategory } from "@/app/actions/flipbooks";
import { listCategories } from "@/app/actions/categories";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { AdminFlipbookLibraryClient } from "./AdminFlipbookLibraryClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminFlipbooksPage() {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user || (role !== "ADMIN" && role !== "OPERATIONS_MANAGER")) {
    redirect("/parent");
  }

  const [groups, categories] = await Promise.all([
    getFlipbooksGroupedByCategory(),
    listCategories(),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Flipbook Library"
        subtitle="Publish via Heyzine or upload a PDF that we render into a self-hosted flipbook."
      />
      <AdminFlipbookLibraryClient initialGroups={groups as any} categories={categories as any} />
    </div>
  );
}
```

- [ ] **Step 2: Create the client wrapper**

Create `src/app/(dashboard)/admin/flipbooks/AdminFlipbookLibraryClient.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import { AdminFlipbookLibrary } from "@/components/flipbook/AdminFlipbookLibrary";
import { CreateFlipbookDialog } from "@/components/flipbook/CreateFlipbookDialog";
import { EditFlipbookDialog } from "@/components/flipbook/EditFlipbookDialog";
import { updateFlipbook } from "@/app/actions/flipbooks";

interface Props {
  initialGroups: any[];
  categories: { id: string; name: string }[];
}

export function AdminFlipbookLibraryClient({ initialGroups, categories }: Props) {
  const [editId, setEditId] = useState<string | null>(null);

  const onPublishToggle = useCallback(async (id: string, next: boolean) => {
    await updateFlipbook(id, { isPublished: next } as any);
  }, []);

  return (
    <>
      <AdminFlipbookLibrary
        groups={initialGroups}
        onEdit={(id) => setEditId(id)}
        onPublishToggle={onPublishToggle}
        renderCreateButton={() => <CreateFlipbookDialog categories={categories} />}
      />
      {editId && (
        <EditFlipbookDialog
          flipbookId={editId}
          open={true}
          onOpenChange={(o) => { if (!o) setEditId(null); }}
          categories={categories}
        />
      )}
    </>
  );
}
```

- [ ] **Step 3: Type-check + run dev server**

```bash
npx tsc --noEmit -p tsconfig.json
```
Then in another terminal:
```bash
npm run dev
```
Open `http://localhost:3000/admin/flipbooks` while logged in as ADMIN. Verify:
- Category pills render with counts
- Existing flipbooks appear as cards
- Hover overlay shows action buttons
- Create dialog opens

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/admin/flipbooks/
git commit -m "feat(admin): flipbooks page rewritten to use library grid"
```

---

## Task 21: Update EditFlipbookDialog to use categoryId FK

**Files:**
- Modify: `src/components/flipbook/EditFlipbookDialog.tsx`

- [ ] **Step 1: Inspect current edit dialog**

Run:
```bash
grep -n "category" src/components/flipbook/EditFlipbookDialog.tsx
```

- [ ] **Step 2: Replace the free-text Category input with a Select of categoryId**

Locate the Category input (likely an `Input` bound to `category`). Replace with a `Select` bound to `categoryId`, populated from a `categories` prop passed by the parent.

If the dialog currently fetches `categories` itself, leave it; otherwise add the prop to the interface:
```ts
categories: { id: string; name: string }[];
```

And inside the form add:
```tsx
<Select value={form.watch("categoryId") || ""} onValueChange={(v) => form.setValue("categoryId", v || null)}>
  <SelectTrigger><SelectValue placeholder="Pick a category" /></SelectTrigger>
  <SelectContent>
    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
  </SelectContent>
</Select>
```

Ensure the form schema includes `categoryId: z.string().nullable().optional()`.

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

- [ ] **Step 4: Commit**

```bash
git add src/components/flipbook/EditFlipbookDialog.tsx
git commit -m "feat(flipbook): EditFlipbookDialog uses categoryId FK select"
```

---

## Task 22: Create CategoryManager component

**Files:**
- Create: `src/components/admin/CategoryManager.tsx`

- [ ] **Step 1: Implement the manager**

```tsx
"use client";

import { useState, useTransition, useOptimistic } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GripVertical, Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { createCategory, renameCategory, deleteCategory, reorderCategories } from "@/app/actions/categories";

interface Category {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  _count?: { flipbooks: number };
}

export function CategoryManager({ initial }: { initial: Category[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [pending, startTransition] = useTransition();

  const refresh = () => router.refresh();

  const add = () => {
    if (!newName.trim()) return;
    startTransition(async () => {
      const r = await createCategory(newName);
      if (r?.error) toast.error(r.error);
      else {
        toast.success(`Added "${newName}"`);
        setNewName("");
        refresh();
      }
    });
  };

  const startRename = (c: Category) => {
    setEditingId(c.id);
    setEditingName(c.name);
  };

  const saveRename = () => {
    if (!editingId) return;
    startTransition(async () => {
      const r = await renameCategory(editingId, editingName);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Renamed");
        setEditingId(null);
        refresh();
      }
    });
  };

  const remove = (c: Category) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    startTransition(async () => {
      const r = await deleteCategory(c.id);
      if (r?.error) toast.error(r.error);
      else {
        toast.success("Deleted");
        refresh();
      }
    });
  };

  // simple up/down reorder (drag-and-drop omitted for v1 simplicity)
  const move = (idx: number, dir: -1 | 1) => {
    const next = [...list];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setList(next);
    startTransition(async () => {
      const r = await reorderCategories(next.map((c) => c.id));
      if (r?.error) toast.error(r.error);
      else refresh();
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          onKeyDown={(e) => e.key === "Enter" && add()}
          disabled={pending}
        />
        <Button onClick={add} disabled={pending} className="bg-[#E87154] hover:bg-[#D66144] text-white gap-2">
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>

      <div className="space-y-1">
        {list.map((c, idx) => (
          <div key={c.id} className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-xl">
            <div className="flex flex-col">
              <button onClick={() => move(idx, -1)} className="text-slate-400 hover:text-slate-700 text-xs">▲</button>
              <button onClick={() => move(idx, +1)} className="text-slate-400 hover:text-slate-700 text-xs">▼</button>
            </div>
            <GripVertical className="h-4 w-4 text-slate-300" />
            {editingId === c.id ? (
              <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} className="flex-1" />
            ) : (
              <div className="flex-1">
                <p className="font-bold text-sm">{c.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">{c.slug} · {c._count?.flipbooks ?? 0} books</p>
              </div>
            )}
            {editingId === c.id ? (
              <>
                <Button size="icon" variant="ghost" onClick={saveRename} disabled={pending}><Check className="h-4 w-4 text-emerald-600" /></Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}><X className="h-4 w-4 text-slate-400" /></Button>
              </>
            ) : (
              <>
                <Button size="icon" variant="ghost" onClick={() => startRename(c)}><Pencil className="h-4 w-4 text-slate-500" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(c)} disabled={(c._count?.flipbooks ?? 0) > 0}><Trash2 className="h-4 w-4 text-red-500" /></Button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/CategoryManager.tsx
git commit -m "feat(admin): CategoryManager UI with rename / reorder / delete"
```

---

## Task 23: Mount CategoryManager as a Categories tab in SystemSettingsForm

**Files:**
- Modify: `src/components/admin/SystemSettingsForm.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`

- [ ] **Step 1: Pass categories down through SystemSettingsForm**

Edit `src/components/admin/SystemSettingsForm.tsx`:

Update the interface:
```ts
interface SystemSettingsFormProps {
    settings: Record<string, any>;
    categories?: { id: string; name: string; slug: string; displayOrder: number; _count?: { flipbooks: number } }[];
}
```

Add a new icon import and TabsTrigger:

```tsx
import { /* …existing… */ FolderTree } from "lucide-react";
```

After the existing `<TabsTrigger value="commissions">` line, add:

```tsx
<TabsTrigger value="categories" className="flex-1 rounded-lg py-2.5 font-bold data-[state=active]:bg-white data-[state=active]:text-[#E87154] data-[state=active]:shadow-sm transition-all gap-2">
  <FolderTree size={16} /> Categories
</TabsTrigger>
```

After the existing `</TabsContent>` for `commissions`, add:

```tsx
<TabsContent value="categories" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
  <Card className="border-none shadow-md overflow-hidden bg-white rounded-[2rem]">
    <CardHeader className="p-8 bg-stone-50 border-b border-stone-100">
      <CardTitle className="text-xl font-black">Flipbook Categories</CardTitle>
      <CardDescription className="text-sm font-medium">Add, rename, reorder, or remove categories used to group flipbooks.</CardDescription>
    </CardHeader>
    <CardContent className="p-8">
      <CategoryManager initial={categories || []} />
    </CardContent>
  </Card>
</TabsContent>
```

Add the import at top:

```ts
import { CategoryManager } from "@/components/admin/CategoryManager";
```

- [ ] **Step 2: Fetch categories on the settings page and pass them in**

Edit `src/app/(dashboard)/settings/page.tsx`. Where `systemSettings` is fetched, also fetch categories:

```ts
import { listCategories } from "@/app/actions/categories";
// …
let systemSettings = {};
let categories: any[] = [];
if (canSeeSystemSettings) {
    [systemSettings, categories] = await Promise.all([
        getSystemSettings(),
        listCategories(),
    ]);
}
```

Pass `categories` into `<SystemSettingsForm settings={systemSettings} categories={categories} />`.

- [ ] **Step 3: Type-check + smoke**

```bash
npx tsc --noEmit -p tsconfig.json
```
Browse `/settings` → System Admin → Categories tab. Verify add/rename/reorder/delete all work.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/SystemSettingsForm.tsx src/app/\(dashboard\)/settings/page.tsx
git commit -m "feat(settings): mount CategoryManager as Categories tab"
```

---

## Task 24: Manual smoke test full pipeline

**Files:** None. Manual.

- [ ] **Step 1: Heyzine path**

Open `/admin/flipbooks`. Click New Flipbook → Heyzine tab. Paste a Heyzine URL (`https://heyzine.com/flip-book/<id>.html`) and a title. Submit. Expect: row appears within ~1 second, card shows Heyzine source badge.

- [ ] **Step 2: Self-host path**

Click New Flipbook → PDF Upload tab. Pick a ≤10 MB PDF. Submit. Expect: progress indicator advances through stages; on done, card appears within ~30 seconds with the first page as cover.

- [ ] **Step 3: Viewer**

Click a self-hosted card → opens `LoftFlipbookViewer`. Verify:
- Pages flip with animation
- Sound plays on flip
- Mute toggle silences sound; preference persists across reloads

Click a Heyzine card. Verify iframe renders.

- [ ] **Step 4: Heyzine fallback**

Edit a Heyzine flipbook record to have an invalid `heyzineUrl` AND have a `pagesManifest` (re-upload a PDF for it). Open. Verify after 8s timeout viewer swaps to self-host with toast.

- [ ] **Step 5: Re-render**

Hover a self-hosted card → click Re-render. Watch toast. Verify pages refresh.

- [ ] **Step 6: Delete**

Hover any card → Delete → confirm. Verify card disappears and `flipbooks/<id>/` folder is gone:

```bash
ls public/uploads/flipbooks/ 2>/dev/null
```

- [ ] **Step 7: Category CRUD**

`/settings → System → Categories`. Add a new category. Verify it appears as a new pill in `/admin/flipbooks`. Rename it. Reorder. Try to delete a category that has flipbooks — should toast error. Delete an empty category — should succeed.

- [ ] **Step 8: Negative tests**

- Upload a non-PDF: client should reject before submit.
- Upload a 60 MB PDF: server should reject with "PDF too large".
- (Skip if no easy way) Trigger a corrupt PDF — server should rollback row + wipe partial assets.

---

## Task 25: Final type-check + cleanup

**Files:** None.

- [ ] **Step 1: Full project type-check**

```bash
npx tsc --noEmit -p tsconfig.json
```
Expected: clean.

- [ ] **Step 2: Run all unit tests**

```bash
npm test
```
Expected: all green or skipped (binary-dependent tests).

- [ ] **Step 3: Lint**

```bash
npm run lint
```
Expected: clean.

- [ ] **Step 4: Commit any housekeeping**

```bash
git add -A
git commit -m "chore: post-revamp cleanup" --allow-empty
```

---

## Follow-ups (not in this plan)

- Drop the legacy `Flipbook.category` String column once analytics confirms no readers. New migration: `DROP COLUMN category;`.
- Drag-and-drop reorder for `CategoryManager` (current is ▲/▼ buttons).
- React-component testing setup (Vitest + RTL) so `LoftFlipbookViewer` + `AdminFlipbookLibrary` can have automated tests beyond manual smoke.
- Maintenance job to prune old `flipbooks/<id>/v<ts>/` directories left by `reRenderFlipbook`.
- Per-flipbook `Download original PDF` button (uses `pdfUrl`).
