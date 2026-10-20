import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  CSS,
  bindDrag,
  clampPanelPosition,
  renderShell,
  renderResultsView,
  getDisplayUsers,
  pruneSelection,
  settingsHTML,
  readSettings,
  showDialog,
  pillLabel,
  countdownText,
  mountUI,
} from "../src/ui.js";

function state() {
  return {
    language: "en",
    mode: "results",
    viewer: { handle: "me", id: "9" },
    users: [
      {
        id: "1",
        handle: "alice",
        name: "Alice",
        verified: true,
        protected: false,
        avatar: "https://p/a.jpg",
        followsViewer: false,
      },
      {
        id: "2",
        handle: "bob",
        name: "Bob",
        verified: false,
        protected: false,
        avatar:
          "https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png",
        followsViewer: false,
      },
      {
        id: "3",
        handle: "carol",
        name: "Carol",
        verified: false,
        protected: false,
        avatar: "https://p/c.jpg",
        followsViewer: true,
      },
    ],
    hidden: new Set(),
    selected: new Set(["1"]),
    filters: {
      verified: true,
      protected: true,
      noAvatar: true,
      showHidden: false,
    },
    search: "",
    partial: false,
    unverified: false,
    coverage: "",
    checkpoint: null,
    timings: {
      scanDelayMin: 1500,
      scanDelayMax: 2500,
      scanPauseEveryPages: 10,
      scanPauseMs: 10000,
      usersPerRequest: 50,
      unfollowDelayMin: 12000,
      unfollowDelayMax: 20000,
      unfollowPauseEvery: 25,
      unfollowPauseMs: 300000,
      maxUnfollows: 190,
    },
    scan: { scanned: 0, total: null, page: 0, source: "api" },
    unfollow: { current: null, total: 0, ok: 0, fail: 0, nextAt: 0 },
    cooldownUntil: 0,
    scanPauseUntil: 0,
  };
}

test("non-followers only, sorted by handle", () => {
  const s = state();
  assert.deepEqual(
    getDisplayUsers(s).map((u) => u.handle),
    ["alice", "bob"]
  );
});

test("verified filter hides verified accounts when off", () => {
  const s = state();
  s.filters.verified = false;
  assert.deepEqual(
    getDisplayUsers(s).map((u) => u.handle),
    ["bob"]
  );
});

test("no-avatar filter hides the default egg", () => {
  const s = state();
  s.filters.noAvatar = false;
  assert.deepEqual(
    getDisplayUsers(s).map((u) => u.handle),
    ["alice"]
  );
});

test("hidden accounts are excluded unless showHidden", () => {
  const s = state();
  s.hidden.add("bob");
  assert.deepEqual(
    getDisplayUsers(s).map((u) => u.handle),
    ["alice"]
  );
  s.filters.showHidden = true;
  assert.deepEqual(
    getDisplayUsers(s).map((u) => u.handle),
    ["alice", "bob"]
  );
});

test("search matches name and handle", () => {
  const s = state();
  s.search = "bo";
  assert.deepEqual(
    getDisplayUsers(s).map((u) => u.handle),
    ["bob"]
  );
  s.search = "@ali";
  assert.deepEqual(
    getDisplayUsers(s).map((u) => u.handle),
    ["alice"]
  );
});

test("selection is pruned to the visible set", () => {
  const s = state();
  s.filters.verified = false;
  pruneSelection(s);
  assert.deepEqual([...s.selected], []);
});

test("results view contains rows and action bar", () => {
  const html = renderResultsView(state());
  assert.match(html, /alice/);
  assert.match(html, /bob/);
  assert.doesNotMatch(html, /carol/);
  assert.match(html, /data-action="unfollow"/);
  assert.match(html, /data-search/);
  assert.match(html, /data-filter="verified"/);
});

test("settings form has all timing fields", () => {
  const html = settingsHTML({
    scanDelayMin: 1500,
    scanDelayMax: 2500,
    scanPauseEveryPages: 10,
    scanPauseMs: 10000,
    usersPerRequest: 50,
    unfollowDelayMin: 12000,
    unfollowDelayMax: 20000,
    unfollowPauseEvery: 25,
    unfollowPauseMs: 300000,
    maxUnfollows: 190,
  });
  assert.match(html, /data-setting="maxUnfollows"/);
  assert.match(html, /data-setting="unfollowDelayMin"/);
  assert.match(html, /data-setting="scanDelayMin"/);
});

test("readSettings converts seconds to milliseconds and clamps", () => {
  const dom = new JSDOM(`<div id="root">${settingsHTML(state().timings)}</div>`);
  const root = dom.window.document.getElementById("root");
  const timings = readSettings(root);
  assert.equal(timings.scanDelayMin, 1500);
  assert.equal(timings.unfollowDelayMin, 12000);
  assert.equal(timings.maxUnfollows, 190);
});

test("dialog confirm runs the callback and closes", () => {
  const dom = new JSDOM('<div id="ux-app"></div>');
  global.document = dom.window.document;
  let ran = false;
  showDialog({
    title: "T",
    body: "B",
    confirmLabel: "OK",
    onConfirm: () => {
      ran = true;
    },
  });
  const app = document.getElementById("ux-app");
  app.querySelector("[data-confirm]").click();
  assert.equal(ran, true);
  assert.equal(app.querySelector(".ux-overlay"), null);
});

test("mounted panel filters, searches, selects, and confirms", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  const actions = [];
  const ui = mountUI({
    state: s,
    onAction: (action) => actions.push(action),
    onChange: () => {},
  });
  const root = dom.window.document.getElementById("ux-app");

  root.querySelector('[data-filter="verified"]').click();
  assert.equal(s.filters.verified, false);
  assert.doesNotMatch(root.querySelector("[data-list]").textContent, /Alice/);

  const search = root.querySelector("[data-search]");
  search.value = "bob";
  search.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  assert.equal(s.search, "bob");
  assert.match(root.querySelector("[data-list]").textContent, /Bob/);

  const checkbox = root.querySelector('[data-select="2"]');
  checkbox.checked = true;
  checkbox.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.equal(root.querySelector('[data-action="unfollow"]').disabled, false);
  assert.match(root.querySelector('[data-action="unfollow"]').textContent, /1/);

  root.querySelector('[data-action="unfollow"]').click();
  root.querySelector("[data-confirm]").click();
  assert.deepEqual(actions, ["start-unfollow"]);
  ui.destroy();
});

test("pill and countdown labels", () => {
  const s = state();
  assert.match(pillLabel(s), /2/);
  s.mode = "unfollowing";
  s.unfollow = { current: "alice", total: 4, ok: 1, fail: 0, nextAt: Date.now() + 9000 };
  assert.match(countdownText(s), /Next in/);
});

test("partial results show the error and offer a resume action", () => {
  const s = state();
  s.partial = true;
  s.error = "Network error. Check your connection.";
  s.checkpoint = { users: [{ id: "1" }], cursor: "next" };
  const html = renderResultsView(s);
  assert.match(html, /Network error/);
  assert.match(html, /data-action="resume"/);
  assert.match(html, /data-action="rescan"/);
});

test("scanning view updates the waiting and pause hints", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.mode = "scanning";
  s.paused = false;
  s.scan = { scanned: 3, total: 10, page: 1, source: "api", waiting: true };
  const ui = mountUI({ state: s, onAction: () => {}, onChange: () => {} });
  const root = dom.window.document.getElementById("ux-app");
  assert.match(root.querySelector("[data-scan-hint]").textContent, /Waiting/);

  s.scan.waiting = false;
  s.scanPauseUntil = Date.now() + 9000;
  ui.update();
  assert.match(root.querySelector("[data-scan-hint]").textContent, /Pausing scan/);

  s.paused = true;
  ui.update();
  assert.match(root.querySelector("[data-scan-hint]").textContent, /paused/i);
  ui.destroy();
});

test("CSS exposes both X themes, Chirp, and no glass effects", () => {
  assert.match(CSS, /\[data-theme="light"\]/);
  assert.match(CSS, /TwitterChirp/);
  assert.match(CSS, /data-high-contrast/);
  assert.match(CSS, /data-reduce-motion/);
  assert.doesNotMatch(CSS, /backdrop-filter/);
  assert.doesNotMatch(CSS, /linear-gradient/);
});

test("shell exposes a keyboard-accessible drag grip", () => {
  const html = renderShell(state());
  assert.match(html, /data-drag-handle/);
  assert.match(
    html,
    /aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight Home"/
  );
  assert.match(html, /ux-mark/);
  assert.match(html, /Unfollow X/);
});

test("clampPanelPosition keeps the panel inside the viewport margin", () => {
  assert.deepEqual(
    clampPanelPosition(-20, -20, 424, 600, 1200, 900, 16),
    { left: 16, top: 16 }
  );
  assert.deepEqual(
    clampPanelPosition(9999, 9999, 424, 600, 1200, 900, 16),
    { left: 760, top: 284 }
  );
});

test("drag grip moves with arrow keys and Home resets", () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><div id="ux-app"><header data-drag><button data-drag-handle></button></header><div data-panel></div></div></body></html>'
  );
  global.document = dom.window.document;
  global.window = dom.window;
  const panel = dom.window.document.querySelector("[data-panel]");
  Object.defineProperty(panel, "offsetWidth", { value: 424, configurable: true });
  Object.defineProperty(panel, "offsetHeight", { value: 600, configurable: true });
  panel.getBoundingClientRect = () => ({
    left: 100,
    top: 100,
    width: 424,
    height: 600,
  });
  const handle = dom.window.document.querySelector("[data-drag]");
  const grip = dom.window.document.querySelector("[data-drag-handle]");
  const saved = [];
  const cleanup = bindDrag(handle, panel, (position) => saved.push(position));

  grip.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
    })
  );
  assert.equal(panel.style.left, "108px");
  assert.equal(panel.style.top, "100px");

  grip.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", {
      key: "ArrowDown",
      shiftKey: true,
      bubbles: true,
    })
  );
  assert.equal(panel.style.top, "132px");

  grip.dispatchEvent(
    new dom.window.KeyboardEvent("keydown", { key: "Home", bubbles: true })
  );
  assert.equal(panel.style.left, "");
  assert.equal(panel.style.top, "");
  assert.equal(saved.at(-1), null);

  cleanup();
  dom.window.close();
});
