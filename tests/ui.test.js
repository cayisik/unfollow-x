import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  CSS,
  bindDrag,
  clampPanelPosition,
  renderShell,
  renderResultsView,
  renderRow,
  renderUnfollowView,
  getDisplayUsers,
  getActivityEntry,
  getUnknownActivityUsers,
  activityStatus,
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
    activeTab: "nonFollowers",
    activityDays: 30,
    activityEntries: {},
    activityScan: null,
    activity: {
      status: "idle",
      checked: 0,
      total: 0,
      inactive: 0,
      unknown: 0,
      current: "",
      source: "lookup",
      error: "",
      nextAt: 0,
      startedAt: 0,
    },
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

test("results view uses one hero count and inline secondary stats", () => {
  const html = renderResultsView(state());
  assert.match(html, /data-result-count/);
  assert.match(html, /data-result-unit/);
  assert.match(html, /data-selected-count/);
  assert.doesNotMatch(html, /ux-statline/);
});

test("selected rows carry the selected state", () => {
  const s = state();
  assert.match(renderRow(s.users[0], s), /is-selected/);
});

test("unfollow ledger uses localized stats and cancellation stamps", () => {
  const s = state();
  s.mode = "unfollowing";
  s.language = "tr";
  s.unfollow = {
    total: 4,
    ok: 1,
    fail: 1,
    current: "alice",
    transport: "mutation",
    log: [
      { handle: "alice", ok: true },
      { handle: "bob", ok: false, reason: "hata" },
    ],
  };
  const html = renderUnfollowView(s);
  assert.match(html, /başarılı/);
  assert.match(html, /hata/);
  assert.match(html, /kalan/);
  assert.match(html, /ux-strike/);
  assert.match(html, /çıktı/);
  assert.match(html, />API</);
  assert.doesNotMatch(html, /MUTATION/);
});

test("pill labels avoid middle dots", () => {
  const s = state();
  s.mode = "scanning";
  s.scan = { scanned: 3 };
  assert.doesNotMatch(pillLabel(s), /·/);
  s.mode = "unfollowing";
  s.unfollow = { ok: 1, total: 4 };
  assert.doesNotMatch(pillLabel(s), /·/);
});

test("settings group titles are localized", () => {
  const html = settingsHTML(state().timings, "tr");
  assert.match(html, /Tarama/);
  assert.match(html, /Takipten çıkarma/);
  assert.doesNotMatch(html, />Scan</);
});

test("user metadata styles do not stretch inline badges", () => {
  assert.match(CSS, /\.ux-user > span/);
  assert.doesNotMatch(CSS, /\.ux-user span\s*\{/);
});

test("inactive tab lists only inactive users, never-posted first", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: Date.now() - 40 * 86400000,
      checkedAt: Date.now(),
    },
    "3": {
      id: "3",
      handle: "carol",
      state: "unknown",
      reason: "not-found",
      checkedAt: Date.now(),
    },
  };
  assert.deepEqual(
    getDisplayUsers(s).map((user) => user.handle),
    ["alice", "bob"]
  );
  assert.deepEqual(
    getUnknownActivityUsers(s).map((user) => user.handle),
    ["carol"]
  );
  assert.equal(activityStatus(s, s.users[0]), "inactive");
  assert.equal(getActivityEntry(s, s.users[0]).lastTweetAt, 0);
});

test("results view renders tabs and the activity intro", () => {
  const s = state();
  s.activeTab = "inactive";
  const html = renderResultsView(s);
  assert.match(html, /data-tab="nonFollowers"/);
  assert.match(html, /data-tab="inactive"/);
  assert.match(html, /data-action="start-activity"/);
  assert.match(html, /Activity audit/);
});

test("activity rows show last post notes and unknown section", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: Date.now() - 40 * 86400000,
      checkedAt: Date.now(),
    },
    "3": {
      id: "3",
      handle: "carol",
      state: "unknown",
      reason: "not-found",
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /No posts yet/);
  assert.match(html, /Last post:/);
  assert.match(html, /could not be checked/);
  assert.doesNotMatch(html, /data-select="3"/);
});

test("passive pill shows the inactive count", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  s.mode = "results";
  assert.match(pillLabel(s), /inactive/);
});

test("inactive view asks for a following scan when the list is empty", () => {
  const s = state();
  s.users = [];
  s.activeTab = "inactive";
  const html = renderResultsView(s);
  assert.match(html, /Scan your following list first/);
  assert.doesNotMatch(html, /data-action="start-activity"/);
});

test("scanning activity view shows live progress and no actionbar", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activity = {
    ...s.activity,
    status: "scanning",
    checked: 3,
    total: 10,
    inactive: 1,
    current: "alice",
    source: "lookup",
  };
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /3 \/ 10 checked/);
  assert.match(html, /Now: @alice/);
  assert.match(html, /Batch/);
  assert.match(html, /data-activity-found>1 inactive account</);
  assert.match(html, /data-action="pause-activity"/);
  assert.match(html, /data-action="cancel-activity"/);
  assert.doesNotMatch(html, /data-actionbar/);
});

test("paused activity view offers resume and cancel", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activity = {
    ...s.activity,
    status: "paused",
    checked: 3,
    total: 10,
    current: "alice",
    source: "lookup",
  };
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /Paused/);
  assert.match(html, /data-action="resume-activity"/);
  assert.doesNotMatch(html, /data-action="pause-activity"/);
});

test("partial activity view warns and labels both scan actions as resume", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityScan = { complete: false, checked: 2 };
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /2 accounts checked\. Continue to finish\./);
  assert.match(html, /data-action="start-activity">Resume</);
  s.activityEntries = {};
  const intro = renderResultsView(s);
  assert.match(intro, /data-action="start-activity">Resume</);
  assert.doesNotMatch(intro, /Start activity scan/);
});

test("activity errors surface as a warning", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activity = { ...s.activity, status: "error", error: "Rate limited" };
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /Rate limited/);
});

test("activity error state offers retry and back actions", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activity = { ...s.activity, status: "error", error: "Rate limited" };
  const intro = renderResultsView(s);
  assert.match(intro, /data-action="start-activity">Retry</);
  assert.match(intro, /data-action="tab" data-tab="nonFollowers">Back</);
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const full = renderResultsView(s);
  assert.match(full, /data-action="start-activity">Retry</);
  assert.match(full, /data-action="tab" data-tab="nonFollowers">Back</);
});

test("completed activity view reports zero inactive accounts", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: Date.now() - 86400000,
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /No inactive accounts in this window/);
  assert.doesNotMatch(html, /data-row="1"/);
});

test("stale activity entries do not leak into the inactive view", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: Date.now() - 86400000,
      checkedAt: Date.now(),
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now() - 2 * 86400000,
    },
  };
  const html = renderResultsView(s);
  assert.doesNotMatch(html, /data-row="2"/);
  assert.doesNotMatch(html, /No posts yet/);
  assert.match(html, /No inactive accounts in this window/);
});

test("orphan activity entries do not satisfy the activity data check", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "99": {
      id: "99",
      handle: "dave",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /data-action="start-activity">Start activity scan</);
  assert.doesNotMatch(html, /data-action="clear-activity"/);
  assert.doesNotMatch(html, /data-row="99"/);
});

test("mounted panel switches tabs, clears selection, and starts activity", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const actions = [];
  const ui = mountUI({
    state: s,
    onAction: (action) => actions.push(action),
  });
  dom.window.document.querySelector('[data-tab="inactive"]').click();
  assert.equal(s.activeTab, "inactive");
  assert.equal(s.selected.size, 0);
  dom.window.document.querySelector('[data-action="start-activity"]').click();
  assert.deepEqual(actions, ["start-activity"]);
  ui.destroy();
});

test("settings form includes the inactivity threshold", () => {
  const html = settingsHTML(state().timings, "en", 45);
  assert.match(html, /data-setting="activityDays"/);
  assert.match(html, /data-setting="activityDays" value="45"/);
  const root = new JSDOM(`<div>${html}</div>`).window.document.querySelector("div");
  assert.equal(readSettings(root).activityDays, 45);
  const blank = html.replace('value="45"', 'value=""');
  assert.equal(
    readSettings(
      new JSDOM(`<div>${blank}</div>`).window.document.querySelector("div"),
      30
    ).activityDays,
    30
  );
  const zero = html.replace('value="45"', 'value="0"');
  assert.equal(
    readSettings(
      new JSDOM(`<div>${zero}</div>`).window.document.querySelector("div"),
      30
    ).activityDays,
    30
  );
});

test("passive unfollow confirmation warns about accounts that follow you", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.selected = new Set(["3"]);
  s.activityEntries = {
    "3": {
      id: "3",
      handle: "carol",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  mountUI({ state: s });
  dom.window.document.querySelector('[data-action="unfollow"]').click();
  const dialog = dom.window.document.querySelector('[role="dialog"]');
  const warning = dialog.querySelector(".ux-warning");
  assert.ok(warning);
  assert.match(warning.textContent, /1 selected accounts follow you/i);
});

test("passive unfollow confirmation omits the follows-you warning when safe", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.selected = new Set(["3"]);
  s.users[2].followsViewer = false;
  s.activityEntries = {
    "3": {
      id: "3",
      handle: "carol",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  mountUI({ state: s });
  dom.window.document.querySelector('[data-action="unfollow"]').click();
  const dialog = dom.window.document.querySelector('[role="dialog"]');
  assert.equal(dialog.querySelector(".ux-warning"), null);
});

test("inactive confirmation only counts visible inactive selections", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const now = Date.now();
  const s = state();
  s.activeTab = "inactive";
  s.selected = new Set(["1", "2"]);
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: now,
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: now,
      checkedAt: now,
    },
  };
  mountUI({ state: s });
  dom.window.document.querySelector('[data-action="unfollow"]').click();
  const dialog = dom.window.document.querySelector('[role="dialog"]');
  assert.ok(dialog);
  assert.match(dialog.textContent, /Unfollow 1 inactive accounts\?/);
  assert.doesNotMatch(dialog.textContent, /Unfollow 2/);
  pruneSelection(s);
  assert.deepEqual([...s.selected], ["1"]);
});

test("following controls lock while an activity scan is running", () => {
  const s = state();
  s.activeTab = "nonFollowers";
  s.partial = true;
  s.checkpoint = { users: [{ id: "1" }], cursor: "next" };
  s.active = { job: "activity", running: true };
  const html = renderResultsView(s);
  const document = new JSDOM(`<!doctype html><body>${html}</body>`).window
    .document;
  assert.equal(
    document.querySelector('[data-action="unfollow"]').disabled,
    true
  );
  assert.equal(document.querySelector('[data-action="rescan"]').disabled, true);
  assert.equal(document.querySelector('[data-action="resume"]').disabled, true);

  s.active = { job: null, running: false };
  const unlocked = new JSDOM(
    `<!doctype html><body>${renderResultsView(s)}</body>`
  ).window.document;
  assert.equal(
    unlocked.querySelector('[data-action="unfollow"]').disabled,
    false
  );
  assert.equal(unlocked.querySelector('[data-action="rescan"]').disabled, false);
  assert.equal(unlocked.querySelector('[data-action="resume"]').disabled, false);
});

test("inactive selection with unknown follow-back keeps unfollow disabled", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.selected = new Set(["1"]);
  s.users[0].followsViewer = null;
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  mountUI({ state: s });
  const button = dom.window.document.querySelector('[data-action="unfollow"]');
  assert.equal(button.disabled, true);
  button.click();
  assert.equal(dom.window.document.querySelector('[role="dialog"]'), null);
});

test("activity live card shows scan progress and controls", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  s.activity = {
    ...s.activity,
    status: "scanning",
    checked: 1,
    total: 2,
    inactive: 1,
    current: "alice",
    source: "graphql",
  };
  const ui = mountUI({ state: s });
  const root = dom.window.document.getElementById("ux-app");
  assert.match(
    root.querySelector("[data-activity-progress]").textContent,
    /1 \/ 2 checked/
  );
  assert.match(
    root.querySelector("[data-activity-current]").textContent,
    /Now: @alice/
  );
  assert.equal(root.querySelector("[data-activity-source]").textContent, "Profile");
  assert.equal(
    root.querySelector("[data-activity-found]").textContent,
    "1 inactive account"
  );
  assert.ok(root.querySelector('[data-action="pause-activity"]'));
  assert.ok(root.querySelector('[data-action="cancel-activity"]'));
  assert.equal(root.querySelector("[data-actionbar]"), null);
  ui.destroy();
});

test("activity pause updates the heading, dot, and toggle live", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  s.activity = {
    ...s.activity,
    status: "scanning",
    checked: 1,
    total: 2,
    current: "alice",
  };
  const ui = mountUI({ state: s });
  const root = dom.window.document.getElementById("ux-app");
  s.activity.status = "paused";
  s.activity.nextAt = Date.now() + 9000;
  ui.update();
  assert.equal(root.querySelector("[data-activity-status]").textContent, "Paused");
  assert.ok(
    root.querySelector("[data-activity-dot]").classList.contains("is-paused")
  );
  assert.equal(
    root.querySelector("[data-activity-toggle]").getAttribute("data-action"),
    "resume-activity"
  );
  const hint = root.querySelector("[data-activity-hint]").textContent;
  assert.doesNotMatch(hint, /Next in/);
  assert.match(hint, /Keep this tab visible/);
  ui.destroy();
});

test("activity selection updates rows when selecting and clearing all", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.selected = new Set();
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const ui = mountUI({ state: s });
  const root = dom.window.document.getElementById("ux-app");
  ui.update();
  const selectAll = root.querySelector("[data-select-all]");
  selectAll.checked = true;
  selectAll.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.equal(s.selected.size, 2);
  for (const key of ["1", "2"]) {
    assert.equal(root.querySelector(`[data-select="${key}"]`).checked, true);
    assert.ok(
      root.querySelector(`[data-row="${key}"]`).classList.contains("is-selected")
    );
  }
  assert.equal(root.querySelector('[data-action="unfollow"]').disabled, false);

  selectAll.checked = false;
  selectAll.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  assert.equal(s.selected.size, 0);
  for (const key of ["1", "2"]) {
    assert.equal(root.querySelector(`[data-select="${key}"]`).checked, false);
    assert.ok(
      !root
        .querySelector(`[data-row="${key}"]`)
        .classList.contains("is-selected")
    );
  }
  assert.equal(root.querySelector('[data-action="unfollow"]').disabled, true);
  ui.destroy();
});

test("activity live update keeps the unknown details open", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
    "3": {
      id: "3",
      handle: "carol",
      state: "unknown",
      reason: "not-found",
      checkedAt: Date.now(),
    },
  };
  const ui = mountUI({ state: s });
  const root = dom.window.document.getElementById("ux-app");
  const details = root.querySelector("[data-activity-unknown-list]");
  details.open = true;
  ui.update();
  const next = root.querySelector("[data-activity-unknown-list]");
  assert.equal(next, details);
  assert.equal(next.open, true);
  ui.destroy();
});

test("clicking the active tab keeps the current selection", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.selected = new Set(["1"]);
  const ui = mountUI({ state: s });
  dom.window.document.querySelector('[data-tab="nonFollowers"]').click();
  assert.equal(s.activeTab, "nonFollowers");
  assert.deepEqual([...s.selected], ["1"]);
  ui.destroy();
});

test("saving the inactivity threshold refreshes the intro copy", async () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.activityDays = 30;
  const actions = [];
  const ui = mountUI({
    state: s,
    onAction: (action, payload) => actions.push([action, payload]),
  });
  const root = dom.window.document.getElementById("ux-app");
  assert.match(root.textContent, /last 30 days/);
  root.querySelector('[data-action="settings"]').click();
  const overlay = dom.window.document.querySelector(".ux-overlay");
  overlay.querySelector('[data-setting="activityDays"]').value = "60";
  overlay.querySelector("[data-confirm]").click();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(s.activityDays, 60);
  assert.equal(actions[0][0], "save-settings");
  assert.equal(actions[0][1].activityDays, 60);
  assert.match(root.textContent, /last 60 days/);
  assert.doesNotMatch(root.textContent, /last 30 days/);
  ui.destroy();
});
