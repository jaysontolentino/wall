import assert from "node:assert/strict";
import test from "node:test";
import { MAX_MESSAGE_LENGTH, MAX_PHOTO_BYTES, PHOTO_BUCKET, messageLength, timeAgo, validatePhoto } from "../src/lib/wall.ts";

test("message limits count Unicode characters consistently with Postgres", () => {
  assert.equal(messageLength("\u{1F600}".repeat(280)), MAX_MESSAGE_LENGTH);
  assert.equal(messageLength("hello\nworld"), 11);
  assert.equal(messageLength("a".repeat(281)), 281);
});

test("photo uploads accept supported types up to the exact size boundary", () => {
  for (const type of ["image/jpeg", "image/png", "image/gif"]) {
    assert.equal(validatePhoto({ size: MAX_PHOTO_BYTES, type }), null);
  }
  assert.match(validatePhoto({ size: MAX_PHOTO_BYTES + 1, type: "image/jpeg" }), /5 MB/);
  assert.match(validatePhoto({ size: 100, type: "image/svg+xml" }), /JPG, PNG, or GIF/);
  assert.match(validatePhoto({ size: 0, type: "image/png" }), /empty/);
  assert.equal(PHOTO_BUCKET, "wall-photos");
});

test("feed timestamps handle new, old, future, and missing timestamps", () => {
  const now = Date.parse("2026-11-14T12:00:00Z");
  assert.equal(timeAgo("2026-11-14T12:00:00Z", now), "now");
  assert.equal(timeAgo("2026-11-14T11:58:00Z", now), "2m");
  assert.equal(timeAgo("2026-11-14T10:00:00Z", now), "2h");
  assert.equal(timeAgo("2026-11-12T12:00:00Z", now), "2d");
  assert.equal(timeAgo("2026-11-15T12:00:00Z", now), "now");
  assert.equal(timeAgo(null, now), "");
  assert.equal(timeAgo("invalid", now), "");
});
