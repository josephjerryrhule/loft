# Flipbook Publishing Revamp — Design Spec

**Date:** 2026-05-16
**Author:** Brainstormed via superpowers + Claude
**Status:** Approved by stakeholder; ready for implementation planning

## Goal

Revamp the admin flipbook publishing surface so the platform no longer depends on Heyzine as a single point of failure, while keeping Heyzine as a co-equal source. Replace the current admin table with a category-driven library grid, add a self-hosted PDF-based flipbook viewer that mimics the Heyzine flipping experience, and introduce a compression + pre-render pipeline so consumer flipbook loads are fast and bandwidth-light.

## Non-Goals

- Consumer dashboards (`/child/library`, `/parent/flipbooks`) keep their current layout. Only the admin surface gets the library grid.
- No Redis / BullMQ. Processing runs inline during the upload server action.
- No "Recommended" / featured-pin system. Library is grouped strictly by category.
- No Heyzine deprecation. Both sources stay first-class.

## Decisions (locked during brainstorm)

| Topic | Decision |
|---|---|
| Heyzine role | Co-equal. Admin chooses per flipbook. Both must look production-quality. |
| Render pipeline | Server pre-render at upload (Option B). |
| Job runner | Inline in `createFlipbook` server action. No queue infra. |
| Library scope | Admin only. Consumer surfaces unchanged. |
| Library layout | Tab/pill filter + single grid below (Option A). |
| Card density | Rich (cover + meta footer: pages, free/paid, age group, source badge). |
| Recommended row | Dropped. |
| Categories model | Admin-managed `Category` table (Option C). |
| Page-flip sound | ON by default, toggleable, preference in `localStorage`. |
| Source PDF retention | Keep original PDF after pre-render. |
| Compression | Ghostscript `-dPDFSETTINGS=/ebook`. Target ≤ 8 MB. Reject if final > 25 MB. |
| Image format | WebP quality 80, long edge ≤ 1600 px. |
| Storage | Existing `lib/upload.ts` abstraction — Supabase (staging) or local FS (Plesk prod). |

## Architecture

Five subsystems, loosely coupled:

```
Admin UI (Library Grid)
    │ server actions
    ▼
Server actions (createFlipbook, updateFlipbook, deleteFlipbook,
                listByCategory, reRenderFlipbook, categories CRUD)
    │
    ├─▶ Prisma / Postgres (Category, Flipbook, FlipbookProgress)
    │
    └─▶ PDF Processor (pure lib)
             │ ① gs compress  → optimized PDF
             │ ② pdftocairo   → per-page PNG
             │ ③ sharp        → WebP q80, ≤1600px
             ▼
        uploadFile() abstraction → Supabase OR local /uploads/flipbooks/<id>/
             │
             ▼
        Consumer Viewer (LoftFlipbookViewer)
        — iframe (Heyzine) OR react-pageflip + Howler (self-host)
```

**Storage paths**
- `flipbooks/<id>/source.pdf`
- `flipbooks/<id>/optimized.pdf`
- `flipbooks/<id>/page-001.webp` … `page-NNN.webp`

**Plesk preconditions:** `ghostscript` and `poppler-utils` must be installed on the host. Documented in README + deployment guide.

## Components

| # | File | Type | Responsibility |
|---|------|------|----------------|
| 1 | `src/lib/pdf-processor.ts` | NEW | Pure pipeline: `processPdf(buffer) → { optimizedPdf, pages, totalPages }`. Shells out to `gs` + `pdftocairo`, pipes through `sharp`. No IO. |
| 2 | `src/lib/upload.ts` | MODIFY | Add `deleteFlipbookAssets(flipbookId)` directory wipe (local + Supabase variants). Add `uploadBuffer(buf, contentType, folder, filename?)` overload. |
| 3 | `src/app/actions/flipbooks.ts` | MODIFY | `createFlipbook` branches on `sourceType`. New: `reRenderFlipbook`, `getFlipbooksGroupedByCategory`. |
| 4 | `src/app/actions/categories.ts` | NEW | CRUD; ADMIN/OPS only; delete blocks when referenced by flipbooks. |
| 5 | `prisma/schema.prisma` | MODIFY | `Category` model, `Flipbook.categoryId`, `pagesManifest Json?`, `optimizedPdfUrl String?`, `sourceType FlipbookSource`. |
| 6 | `prisma/migrations/<ts>_flipbook_revamp/migration.sql` | NEW | DDL + seed defaults + data fix-up script (string → FK). |
| 7 | `src/app/(dashboard)/admin/flipbooks/page.tsx` | REWRITE | Replace table with `<AdminFlipbookLibrary>`. Keeps Create dialog mount. |
| 8 | `src/components/flipbook/AdminFlipbookLibrary.tsx` | NEW | Search + category pill filter + 4-col grid. |
| 9 | `src/components/flipbook/FlipbookCard.tsx` | NEW | Rich card primitive with hover action overlay. |
| 10 | `src/components/flipbook/CreateFlipbookDialog.tsx` | NEW (extract) | Source-type tabs (Heyzine ¦ PDF Upload) + progress streaming. |
| 11 | `src/components/flipbook/UploadProgress.tsx` | NEW | Stage indicator reading SSE/streamed progress. |
| 12 | `src/components/flipbook/LoftFlipbookViewer.tsx` | RENAME + REWRITE of `ReliableFlipbookViewer.tsx` | iframe path unchanged; self-host path uses `react-pageflip` with image pages + `Howler.js` page-flip sound. |
| 13 | `src/components/admin/CategoryManager.tsx` | NEW | Drag-reorder + inline rename + add/delete. Mounted in `SystemSettingsForm` as a new Categories tab. |
| 14 | `src/lib/howler-wrapper.ts` | NEW | Lazy-loads Howler only on viewer mount to keep SSR clean. |
| 15 | `package.json` | MODIFY | Add `sharp`, `howler`, `@types/howler`. `react-pageflip` already present. Keep `pdfjs-dist` (needed by `/api/proxy-pdf`). |

**Boundary invariants**
- `pdf-processor` has no Prisma / Supabase / actions imports. Testable with a fixture PDF.
- `LoftFlipbookViewer` accepts a manifest or iframe HTML; knows nothing about pipeline.
- `CategoryManager` is self-contained; no flipbook coupling.

## Data flow

### Create flipbook (PDF source)

```
Admin → CreateFlipbookDialog (PDF tab)
      → POST FormData(file, title, categoryId, ageGroup, isFree)
      → createFlipbook(input) server action
          1. Validate role (ADMIN / OPS) + zod schema
          2. Insert Flipbook row (isPublished=false, pagesManifest=null)
          3. Stream stages back via ReadableStream
          4. pdfProcessor.processPdf(buffer):
               a. gs -dPDFSETTINGS=/ebook       ("compress")
               b. pdftocairo -png -r 150        ("render")
               c. sharp().webp(q80).resize(1600) ("encode")
          5. uploadBuffer() each WebP + optimized PDF → URLs collected
          6. prisma.flipbook.update({
               pagesManifest, optimizedPdfUrl, pdfUrl (original),
               coverImageUrl = pages[0].url
             })
          7. revalidatePath("/admin/flipbooks")
      → return { id, status: "ready" }
```

### Create flipbook (Heyzine source)

```
Admin → CreateFlipbookDialog (Heyzine tab) → paste URL or iframe HTML
      → createFlipbook({sourceType:"HEYZINE", heyzineUrl|iframeContent, …})
      → No processor invocation. Row inserted with iframeContent.
      → done <1s
```

### View flipbook (consumer)

```
LoftFlipbookViewer receives one of:
  • {iframeContent}        → iframe (Heyzine)
  • {pages: ManifestPage[]} → react-pageflip with <img> children
                              Howler preloads /sounds/page-flip.mp3
                              onFlip → sound.play() (unless muted)

If iframe times out (8s) or errors AND pagesManifest exists:
  → auto-swap to self-host with toast "Heyzine unavailable, using local copy"
If no fallback exists:
  → error UI with "Open in new tab" link
```

### Re-render

```
reRenderFlipbook(id):
  1. fetch original PDF from pdfUrl
  2. run pdfProcessor on fresh upload prefix flipbooks/<id>/v<n>/
  3. atomic swap: update pagesManifest to new URLs
  4. deleteFlipbookAssets old prefix
```

Atomic swap ensures old pages keep serving until the new manifest is fully populated.

### Delete

```
deleteFlipbook(id):
  → deleteFlipbookAssets(id)   (wipe prefix)
  → prisma.flipbook.delete      (FlipbookProgress cascades)
```

## Schema changes

```prisma
model Category {
  id           String     @id @default(uuid())
  name         String     @unique
  slug         String     @unique
  displayOrder Int        @default(0)
  createdAt    DateTime   @default(now())
  flipbooks    Flipbook[]

  @@index([displayOrder])
  @@map("categories")
}

model Flipbook {
  // ...existing fields preserved...
  categoryId           String?         @map("category_id")
  category             String?         // legacy; kept one release, then dropped
  pagesManifest        Json?           @map("pages_manifest")
  optimizedPdfUrl      String?         @map("optimized_pdf_url")
  sourceType           FlipbookSource  @default(HEYZINE) @map("source_type")
  processingStartedAt  DateTime?       @map("processing_started_at")  // re-render guard; cleared on success/failure

  categoryRef       Category?       @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  @@index([categoryId])
  @@index([sourceType])
}

enum FlipbookSource {
  HEYZINE
  SELF_HOSTED
}
```

`pagesManifest` JSON shape (validated by zod):

```ts
{
  totalPages: number,
  pages: Array<{ url: string, width: number, height: number }>,
  generatedAt: string  // ISO timestamp
}
```

**Migration steps**
1. `CREATE TABLE categories` + indexes.
2. Seed defaults: Sci-Fi, Fantasy, Drama, Business, Education, Geography, Adventure, Mystery, Picture Book.
3. `ALTER TABLE flipbooks ADD COLUMN category_id, pages_manifest, optimized_pdf_url, source_type, processing_started_at`.
4. For each `DISTINCT category` string on existing flipbooks: upsert into `categories`, update FK.
5. `UPDATE flipbooks SET source_type='SELF_HOSTED' WHERE pdf_url IS NOT NULL AND iframe_content IS NULL AND heyzine_url IS NULL`.
6. Keep `category String?` for one release; second migration drops it after viewer + admin UI exclusively use the FK.

## Error handling

Failure rows. Each: trigger → user behavior → server recovery.

| Surface | Trigger | UI | Recovery |
|---|---|---|---|
| Upload too large | File > 50 MB pre-compression | Dialog blocks submit | None — never hits server |
| Wrong file type | Non-PDF MIME | Inline error | None |
| Ghostscript missing | `gs` ENOENT | "Compression unavailable — flipbook saved without optimization" | Processor falls back to passthrough |
| Poppler missing | `pdftocairo` ENOENT | Hard error; row rolled back | `deleteFlipbookAssets` + `prisma.delete` |
| Output > 25 MB | Final optimized PDF too big | "PDF couldn't be compressed below 25 MB" | Row rolled back |
| Page render fails | `pdftocairo` non-zero on page N | Progress indicator red | Row rolled back |
| Storage write fails | uploadFile error | "Storage error — please retry" | Row rolled back, partial pages wiped |
| Re-render fails | Existing book, processor errors | Toast "Re-render failed. Old pages still in use." | Atomic swap — old manifest untouched until new succeeds |
| Heyzine iframe blocked | Load timeout (8s) or X-Frame-Options | Auto-swap to manifest if exists, else error UI | Client-side only |
| Manifest URL 404 | Page asset deleted out-of-band | Broken-page placeholder; warning badge on card | Logged via `lib/logger.ts` |
| Category in use, delete | Admin deletes referenced category | "Category in use by N flipbooks. Reassign first." | Guard with count check |
| Sound asset missing | `/sounds/page-flip.mp3` 404 | Mute toggle hidden, sound disabled silently | Howler error caught |
| Mute pref corrupted | Bad localStorage value | Default unmuted | `JSON.parse` guarded |
| Concurrent re-render | Two admins click Re-render | Second toast "Re-render already in progress" | `processingStartedAt` timestamp guard |

**Rollback invariant:** every PDF-source create or re-render is atomic — either the flipbook ends with a complete manifest, or no manifest changes and no orphan assets remain.

**Logging:** every processor stage logs to `lib/logger.ts` with `flipbookId`, `stage`, `durationMs`. Failed stages log `stderr` from the binary.

## Testing

| Layer | Test file | What's tested |
|---|---|---|
| PDF processor | `src/lib/__tests__/pdf-processor.test.ts` | Real `gs` + `pdftocairo` on fixture PDFs. Skips with warning if binaries absent. Edge cases: malformed, encrypted, empty. |
| Upload helpers | `src/lib/__tests__/upload.test.ts` | `uploadBuffer` round-trip, `deleteFlipbookAssets` prefix wipe. |
| Category actions | `src/app/actions/__tests__/categories.test.ts` | Role guards; slug uniqueness; delete-with-references blocked. |
| Flipbook actions | `src/app/actions/__tests__/flipbooks.test.ts` | Heyzine path skips processor; PDF path populates manifest; throw → rollback + wipe; re-render atomic swap. |
| LoftFlipbookViewer | `src/components/flipbook/__tests__/LoftFlipbookViewer.test.tsx` | iframe vs pages branching; iframe-error → swap; mute persistence; sound 404 hides toggle. |
| AdminFlipbookLibrary | `src/components/flipbook/__tests__/AdminFlipbookLibrary.test.tsx` | Category pill filter; search; hover overlay actions per status. |
| Migration | `prisma/__tests__/flipbook-revamp-migration.test.ts` | Legacy `category` strings → `categoryId` populated, dedup, no orphans. |
| E2E smoke (if Playwright) | `e2e/flipbook-admin.spec.ts` | Upload → appears in section → opens viewer → flips → sound → delete. |

**Fixtures:** `src/lib/__fixtures__/sample-3p.pdf`, `encrypted.pdf`, `malformed.pdf`, `empty.pdf`.

**CI preconditions:** `apt-get install -y ghostscript poppler-utils` before tests. Skipped suites noisy but non-failing.

**Out of scope for tests:** `react-pageflip` internals, Howler internals, Supabase SDK, Plesk static-file serving.

## Open Questions for Implementation Phase

- Exact sound asset source / license (placeholder: free CC0 page-flip sample). Track separately.
- Should `optimizedPdfUrl` be downloadable from the admin UI as a "verify pre-render" tool? Probably yes; trivial add.
- Future: should `Category` get a `description` field for filter-page SEO? Out of scope here.
