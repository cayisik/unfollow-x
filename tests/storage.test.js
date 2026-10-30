import {
  clearActivity,
  clearActivityScan,
  loadActivity,
  loadActivityScan,
  loadState,
  persistState,
  loadCheckpoint,
  saveActivity,
  saveActivityScan,
  saveCheckpoint,
  clearCheckpoint,
  loadLastScan,
  saveLastScan,
  TTL,
} from "../src/storage.js";
import test from "node:test";
import assert from "node:assert/strict";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    clear: () => map.clear(),
  };
}

test("state round-trips and drops corrupt json", () => {
  const s = memoryStorage();
  persistState(s, {
    language: "tr",
    hidden: ["1"],
    timings: { maxUnfollows: 50 },
  });
  const loaded = loadState(s);
  assert.equal(loaded.language, "tr");
  assert.deepEqual(loaded.hidden, ["1"]);
  assert.equal(loaded.timings.maxUnfollows, 50);
  s.setItem("ux_state_v1", "{oops");
  assert.deepEqual(loadState(s), {});
});

test("checkpoint expires after TTL and ignores another viewer", () => {
  const s = memoryStorage();
  const cp = {
    viewerHandle: "me",
    users: [{ handle: "a" }],
    cursor: "c",
    savedAt: Date.now(),
  };
  saveCheckpoint(s, cp);
  assert.equal(loadCheckpoint(s, "me").cursor, "c");
  assert.equal(loadCheckpoint(s, "other"), null);
  cp.savedAt = Date.now() - TTL - 1;
  saveCheckpoint(s, cp);
  assert.equal(loadCheckpoint(s, "me"), null);
  clearCheckpoint(s);
  assert.equal(loadCheckpoint(s, "me"), null);
});

test("last scan only returns the current viewer's fresh data", () => {
  const s = memoryStorage();
  saveLastScan(s, {
    viewerHandle: "me",
    users: [{ handle: "a" }],
    savedAt: Date.now(),
  });
  assert.equal(loadLastScan(s, "me").users.length, 1);
  assert.equal(loadLastScan(s, "other"), null);
});

test("storage errors never throw", () => {
  const broken = {
    getItem() {
      throw new Error("nope");
    },
    setItem() {
      throw new Error("quota");
    },
    removeItem() {
      throw new Error("nope");
    },
  };
  assert.deepEqual(loadState(broken), {});
  assert.equal(loadCheckpoint(broken, "me"), null);
  assert.equal(loadLastScan(broken, "me"), null);
  assert.doesNotThrow(() => persistState(broken, { language: "en" }));
  assert.doesNotThrow(() => saveCheckpoint(broken, { users: [] }));
  assert.doesNotThrow(() => clearCheckpoint(broken));
});

test("activity cache is viewer-bound and drops entries older than 24h", () => {
  const storage = memoryStorage();
  const now = Date.now();
  saveActivity(storage, "me", {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: now - 1000,
      checkedAt: now,
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: 0,
      checkedAt: now - 25 * 60 * 60 * 1000,
    },
  });
  assert.deepEqual(Object.keys(loadActivity(storage, "me")), ["1"]);
  assert.deepEqual(loadActivity(storage, "other"), {});
});

test("activity cache can be cleared", () => {
  const storage = memoryStorage();
  saveActivity(storage, "me", {
    "1": { id: "1", handle: "alice", state: "known", lastTweetAt: 0, checkedAt: Date.now() },
  });
  assert.equal(clearActivity(storage), true);
  assert.deepEqual(loadActivity(storage, "me"), {});
});

test("activity scan checkpoint is viewer-bound and fresh", () => {
  const storage = memoryStorage();
  const scan = {
    viewerHandle: "me",
    startedAt: Date.now(),
    checked: 10,
    total: 20,
    complete: false,
  };
  saveActivityScan(storage, scan);
  assert.equal(loadActivityScan(storage, "me").checked, 10);
  assert.equal(loadActivityScan(storage, "other"), null);
  assert.equal(clearActivityScan(storage), true);
  assert.equal(loadActivityScan(storage, "me"), null);
});

test("activity load prunes stale entries already on disk", () => {
  const storage = memoryStorage();
  const now = Date.now();
  storage.setItem(
    "ux_activity_v1",
    JSON.stringify({
      version: 1,
      viewerHandle: "me",
      savedAt: now,
      entries: {
        fresh: { id: "fresh", checkedAt: now },
        stale: { id: "stale", checkedAt: now - 25 * 60 * 60 * 1000 },
      },
    })
  );
  assert.deepEqual(Object.keys(loadActivity(storage, "me")), ["fresh"]);
  const stored = JSON.parse(storage.getItem("ux_activity_v1"));
  assert.deepEqual(Object.keys(stored.entries), ["fresh"]);
  assert.equal(stored.version, 1);
  assert.equal(stored.viewerHandle, "me");
});

test("activity load removes the key when every entry is stale", () => {
  const storage = memoryStorage();
  const now = Date.now();
  storage.setItem(
    "ux_activity_v1",
    JSON.stringify({
      version: 1,
      viewerHandle: "me",
      savedAt: now,
      entries: {
        stale: { id: "stale", checkedAt: now - 25 * 60 * 60 * 1000 },
      },
    })
  );
  assert.deepEqual(loadActivity(storage, "me"), {});
  assert.equal(storage.getItem("ux_activity_v1"), null);
});

test("activity load drops entries checked in the future", () => {
  const storage = memoryStorage();
  const now = Date.now();
  storage.setItem(
    "ux_activity_v1",
    JSON.stringify({
      version: 1,
      viewerHandle: "me",
      savedAt: now,
      entries: {
        future: { id: "future", checkedAt: now + 61_000 },
      },
    })
  );
  assert.deepEqual(loadActivity(storage, "me"), {});
});

test("activity scan checkpoint expires after 24h", () => {
  const storage = memoryStorage();
  const old = Date.now() - 25 * 60 * 60 * 1000;
  storage.setItem(
    "ux_activity_scan_v1",
    JSON.stringify({
      viewerHandle: "me",
      startedAt: old,
      checked: 10,
      total: 20,
      complete: false,
      savedAt: old,
    })
  );
  assert.equal(loadActivityScan(storage, "me"), null);
  assert.equal(storage.getItem("ux_activity_scan_v1"), null);
});

test("activity scan load keeps another viewer's record on mismatch", () => {
  const storage = memoryStorage();
  saveActivityScan(storage, {
    viewerHandle: "me",
    startedAt: Date.now(),
    checked: 10,
    total: 20,
    complete: false,
  });
  assert.equal(loadActivityScan(storage, "other"), null);
  assert.ok(storage.getItem("ux_activity_scan_v1"));
});

test("stale activity scan from another viewer is not deleted", () => {
  const storage = memoryStorage();
  const old = Date.now() - 25 * 60 * 60 * 1000;
  storage.setItem(
    "ux_activity_scan_v1",
    JSON.stringify({
      viewerHandle: "other",
      startedAt: old,
      checked: 10,
      total: 20,
      complete: false,
      savedAt: old,
    })
  );
  assert.equal(loadActivityScan(storage, "me"), null);
  assert.ok(storage.getItem("ux_activity_scan_v1"));
});

test("saving activity requires a viewer handle", () => {
  const storage = memoryStorage();
  const entry = { id: "1", checkedAt: Date.now() };
  assert.equal(saveActivity(storage, "", { "1": entry }), false);
  assert.deepEqual(loadActivity(storage, ""), {});
});
