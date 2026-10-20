import test from "node:test";
import assert from "node:assert/strict";
import { I18N, makeT, DEFAULT_TIMINGS, VERSION } from "../src/config.js";

test("t interpolates and falls back to English", () => {
  const tr = makeT("tr");
  assert.equal(tr("scanBtn"), "Taramayı başlat");
  assert.equal(tr("foundCount", { count: 3 }), "3 takip etmeyen");
  const en = makeT("en");
  assert.equal(en("nope"), "nope");
  assert.equal(en("scanBtn"), "Scan now");
});

test("timings are sane", () => {
  assert.equal(VERSION, "0.2.0");
  assert.ok(DEFAULT_TIMINGS.unfollowDelayMin >= 8000);
  assert.ok(DEFAULT_TIMINGS.maxUnfollows <= 400);
  assert.ok(I18N.en && I18N.tr);
});

test("TR and EN expose the same keys", () => {
  assert.deepEqual(
    Object.keys(I18N.en).sort(),
    Object.keys(I18N.tr).sort()
  );
});
