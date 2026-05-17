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
