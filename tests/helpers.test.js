import test from "node:test";
import assert from "node:assert/strict";
import {
  getCookie,
  parseTwid,
  escapeHTML,
  formatCount,
  parseRetryAfter,
  normalizeUser,
  dedupeUsers,
  isDefaultAvatar,
  retryDecision,
  timeAgo,
  formatDuration,
  clamp,
  safeJsonParse,
} from "../src/utils.js";

test("twid decodes to a numeric id", () => {
  assert.equal(parseTwid("u%3D12345"), "12345");
  assert.equal(parseTwid("u=999"), "999");
  assert.equal(parseTwid("bad"), "");
  assert.equal(parseTwid(""), "");
});

test("escapeHTML blocks markup", () => {
  assert.equal(escapeHTML('<b a="x">'), "&lt;b a=&quot;x&quot;&gt;");
  assert.equal(escapeHTML("a&b'c"), "a&amp;b&#39;c");
});

test("normalizeUser handles old and new schemas", () => {
  const oldUser = {
    rest_id: "1",
    legacy: {
      screen_name: "alice",
      name: "Alice",
      profile_image_url_https: "https://p/a_normal.jpg",
      followed_by: false,
      verified: true,
      protected: false,
    },
  };
  const newUser = {
    rest_id: "2",
    core: { screen_name: "bob", name: "Bob" },
    avatar: { image_url: "https://p/b.jpg" },
    relationship_perspectives: { followed_by: true },
    is_blue_verified: true,
    privacy: { protected: true },
  };
  assert.deepEqual(normalizeUser(oldUser), {
    id: "1",
    handle: "alice",
    name: "Alice",
    avatar: "https://p/a_normal.jpg",
    verified: true,
    protected: false,
    followsViewer: false,
  });
  assert.equal(normalizeUser(newUser).followsViewer, true);
  assert.equal(normalizeUser(newUser).handle, "bob");
  assert.equal(normalizeUser(newUser).protected, true);
  assert.equal(normalizeUser({ legacy: {} }), null);
});

test("dedupeUsers keeps the first by id then handle", () => {
  const users = [
    { id: "1", handle: "a" },
    { id: "1", handle: "a" },
    { id: "", handle: "b" },
    { id: "", handle: "B" },
  ];
  assert.equal(dedupeUsers(users).length, 2);
});

test("default avatar detection", () => {
  assert.equal(
    isDefaultAvatar({
      avatar:
        "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png",
    }),
    true
  );
  assert.equal(isDefaultAvatar({ avatar: "https://pbs.twimg.com/a.jpg" }), false);
  assert.equal(isDefaultAvatar({ avatar: "" }), true);
});

test("retryAfter parses seconds and dates", () => {
  assert.equal(parseRetryAfter("120"), 120000);
  assert.ok(parseRetryAfter(new Date(Date.now() + 5000).toUTCString()) > 0);
  assert.equal(parseRetryAfter(""), 0);
});

test("retryDecision classifies statuses", () => {
  assert.equal(retryDecision(429, {}).kind, "rate");
  assert.equal(retryDecision(401, {}).kind, "auth");
  assert.equal(retryDecision(403, {}).kind, "blocked");
  assert.equal(retryDecision(500, {}).retry, true);
  assert.equal(retryDecision(200, {}).kind, "ok");
  assert.equal(retryDecision(400, {}).kind, "format");
});

test("formatting helpers", () => {
  assert.equal(formatCount(12345, "en"), "12,345");
  assert.equal(formatDuration(65000), "1:05");
  assert.equal(clamp(500, 1, 190), 190);
  assert.equal(clamp("nope", 1, 190), 1);
  assert.deepEqual(safeJsonParse("{bad", { ok: false }), { ok: false });
  assert.equal(typeof timeAgo(Date.now() - 5000, "en"), "string");
  assert.equal(getCookie("missing"), "");
});
