import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("bundle contains the host guard and no import statements", () => {
  const code = readFileSync(new URL("../unfollow-x.js", import.meta.url), "utf8");
  assert.match(code, /x\.com/);
  assert.doesNotMatch(code, /^\s*import\s/m);
  assert.doesNotMatch(code, /\brequire\(/);
});
