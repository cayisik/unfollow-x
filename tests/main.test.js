import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  mergeScan,
  canUnfollow,
  coverageFrom,
  createState,
  boot,
} from "../src/main.js";
import { getCapturedFollowing } from "../src/capture.js";

test("mergeScan dedupes by id and keeps existing users", () => {
  const existing = [
    { id: "1", handle: "a", followsViewer: false },
    { id: "2", handle: "b", followsViewer: false },
  ];
  const incoming = [
    { id: "1", handle: "a", followsViewer: false },
    { id: "3", handle: "c", followsViewer: null },
  ];
  const merged = mergeScan(existing, incoming);
  assert.equal(merged.length, 3);
  assert.deepEqual(
    merged.map((user) => user.handle),
    ["a", "b", "c"]
  );
});

test("mergeScan keeps ids and lets fresh relationship data win", () => {
  const merged = mergeScan(
    [{ id: "1", handle: "a", name: "Alice", followsViewer: null }],
    [{ handle: "A", followsViewer: false, avatar: "https://a.jpg" }]
  );
  assert.equal(merged.length, 1);
  assert.equal(merged[0].id, "1");
  assert.equal(merged[0].name, "Alice");
  assert.equal(merged[0].avatar, "https://a.jpg");
  assert.equal(merged[0].followsViewer, false);
});

test("canUnfollow blocks unverified scans and empty selections", () => {
  assert.equal(canUnfollow({ unverified: false, selected: new Set(["1"]) }), true);
  assert.equal(canUnfollow({ unverified: true, selected: new Set(["1"]) }), false);
  assert.equal(canUnfollow({ unverified: false, selected: new Set() }), false);
  assert.equal(canUnfollow({ unverified: false, selected: ["1"] }), true);
});

test("coverageFrom flags missing followed_by", () => {
  assert.equal(
    coverageFrom([
      { followsViewer: true },
      { followsViewer: false },
    ]).unverified,
    false
  );
  assert.equal(coverageFrom([{ followsViewer: null }]).unverified, true);
  assert.equal(coverageFrom([]).unverified, false);
});

test("boot mounts the panel, resolves the handle, and cleans up", () => {
  const dom = new JSDOM(
    '<!doctype html><html data-theme="light"><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    fetch: globalThis.fetch,
  };
  const localStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) {
      delete globalThis[key];
    } else {
      set(key, value);
    }
  };
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);

    const state = boot();
    assert.equal(state.viewer.handle, "me");
    assert.ok(dom.window.document.getElementById("ux-app"));
    assert.equal(
      dom.window.document.getElementById("ux-app").dataset.theme,
      "light"
    );
    assert.equal(typeof globalThis.__uxCleanup, "function");

    state.cleanup();
    assert.equal(dom.window.document.getElementById("ux-app"), null);
    assert.equal(globalThis.__uxCleanup, undefined);
  } finally {
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    if (localStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "localStorage",
        localStorageDescriptor
      );
    } else {
      delete globalThis.localStorage;
    }
    dom.window.close();
  }
});

test("scan flow reaches results from a captured following response", async () => {
  const payload = {
    data: {
      user_result_by_screen_name: {
        result: {
          relationship_counts: { following: 2 },
          following_timeline: {
            timeline: {
              instructions: [
                {
                  type: "TimelineAddEntries",
                  entries: [
                    {
                      entryId: "user-1",
                      content: {
                        itemContent: {
                          user_results: {
                            result: {
                              rest_id: "1",
                              core: { screen_name: "alice", name: "Alice" },
                              relationship_perspectives: { followed_by: false },
                            },
                          },
                        },
                      },
                    },
                    {
                      entryId: "user-2",
                      content: {
                        itemContent: {
                          user_results: {
                            result: {
                              rest_id: "2",
                              core: { screen_name: "bob", name: "Bob" },
                              relationship_perspectives: { followed_by: false },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  };
  const dom = new JSDOM(
    '<!doctype html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body>',
    { url: "https://x.com/me/following" }
  );
  dom.window.document.cookie = "ct0=test; path=/";
  dom.window.document.cookie = "twid=u%3D123; path=/";

  const originalFetch = globalThis.fetch;
  let fetchMode = "scan";
  const fakeFetch = async () =>
    new Response(
      JSON.stringify(
        fetchMode === "unfollow"
          ? {
              data: {
                unfollow_user: { __typename: "UnfollowSuccessResult" },
              },
            }
          : payload
      ),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    fetch: globalThis.fetch,
  };
  const localStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    set("fetch", fakeFetch);

    state = boot();
    assert.equal(state.viewer.handle, "me");
    assert.equal(state.viewer.id, "123");

    await globalThis.fetch(
      "https://x.com/i/api/graphql/q/followingQuery",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          variables: { screenName: "me", count: 20 },
          queryId: "q",
        }),
      }
    );
    assert.ok(getCapturedFollowing());

    dom.window.document.querySelector('[data-action="scan"]').click();
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (state.mode === "results" || Date.now() - started > 3000) {
          return resolve();
        }
        setTimeout(tick, 25);
      };
      tick();
    });

    assert.equal(state.mode, "results");
    assert.equal(state.users.length, 2);
    assert.deepEqual(
      state.users.map((user) => user.handle),
      ["alice", "bob"]
    );
    assert.match(
      dom.window.document.querySelector('[data-view="results"]').textContent,
      /Alice/
    );
    assert.ok(
      dom.window.document.querySelector('[data-view="results"] [data-list]')
    );

    fetchMode = "unfollow";
    const checkbox = dom.window.document.querySelector('[data-select="1"]');
    checkbox.checked = true;
    checkbox.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
    dom.window.document.querySelector('[data-action="unfollow"]').click();
    dom.window.document.querySelector("[data-confirm]").click();
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (state.mode === "done" || Date.now() - started > 3000) {
          return resolve();
        }
        setTimeout(tick, 25);
      };
      tick();
    });

    assert.equal(state.mode, "done");
    assert.equal(state.unfollow.ok, 1);
    assert.equal(state.users.length, 1);
    assert.equal(state.users[0].handle, "bob");
    assert.ok(dom.window.document.querySelector('[data-view="done"]'));
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    if (localStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "localStorage",
        localStorageDescriptor
      );
    } else {
      delete globalThis.localStorage;
    }
    globalThis.fetch = originalFetch;
    dom.window.close();
  }
});

test("unfollow keeps one panel through results, pause, and heartbeat", async () => {
  const dom = new JSDOM(
    '<!doctype html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body>',
    { url: "https://x.com/me/following" }
  );
  dom.window.document.cookie = "ct0=test; path=/";
  dom.window.document.cookie = "twid=u%3D123; path=/";

  const originalFetch = globalThis.fetch;
  const fakeFetch = async () =>
    new Response(
      JSON.stringify({
        data: { unfollow_user: { __typename: "UnfollowSuccessResult" } },
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      }
    );
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    fetch: globalThis.fetch,
  };
  const localStorageDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage"
  );
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const waitFor = async (predicate, timeout = 1000) => {
    const started = Date.now();
    while (Date.now() - started < timeout) {
      if (predicate()) return true;
      await delay(20);
    }
    return false;
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    set("fetch", fakeFetch);

    state = boot();
    state.users = [
      {
        id: "1",
        handle: "alice",
        name: "Alice",
        avatar: "",
        verified: false,
        protected: false,
        followsViewer: false,
      },
      {
        id: "2",
        handle: "bob",
        name: "Bob",
        avatar: "",
        verified: false,
        protected: false,
        followsViewer: false,
      },
    ];
    state.selected = new Set(["1", "2"]);
    state.unverified = false;
    state.mode = "results";
    state.timings = {
      ...state.timings,
      unfollowDelayMin: 1500,
      unfollowDelayMax: 1500,
      unfollowPauseEvery: 0,
    };
    state.ui.render();

    const originalRender = state.ui.render;
    let renders = 0;
    state.ui.render = (...args) => {
      renders += 1;
      return originalRender(...args);
    };

    dom.window.document.querySelector('[data-action="unfollow"]').click();
    dom.window.document.querySelector("[data-confirm]").click();
    const panel = dom.window.document.querySelector("[data-panel]");
    assert.ok(panel);

    const gotResult = await waitFor(() => state.unfollow.ok === 1);
    assert.equal(gotResult, true);
    assert.equal(
      dom.window.document.querySelector("[data-panel]"),
      panel,
      "a result must update the existing panel"
    );
    assert.match(
      dom.window.document.querySelector("[data-unfollow-log]").textContent,
      /@alice/
    );
    assert.equal(
      dom.window.document.querySelector("[data-unfollow-ok]").textContent,
      "1"
    );
    assert.equal(
      dom.window.document.querySelector("[data-unfollow-progress]").style.width,
      "50%"
    );

    renders = 0;
    dom.window.document
      .querySelector('[data-action="pause-unfollow"]')
      .click();
    const paused = await waitFor(() => {
      const eyebrow = dom.window.document.querySelector(
        '[data-view="unfollowing"] .ux-eyebrow'
      );
      return /paused/i.test(eyebrow?.textContent || "");
    });
    assert.equal(paused, true);
    assert.equal(
      dom.window.document.querySelector("[data-panel]"),
      panel,
      "pausing must update the existing panel"
    );
    assert.equal(
      dom.window.document
        .querySelector("[data-unfollow-toggle]")
        .getAttribute("data-action"),
      "resume-unfollow"
    );
    assert.equal(renders, 0, "pausing must not recreate the panel");

    await delay(1600);
    renders = 0;
    await delay(600);
    assert.equal(
      renders,
      0,
      "a paused queue must not recreate the panel every 250ms"
    );
    assert.equal(
      dom.window.document.querySelector("[data-panel]"),
      panel,
      "the paused panel must stay mounted"
    );
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    if (localStorageDescriptor) {
      Object.defineProperty(
        globalThis,
        "localStorage",
        localStorageDescriptor
      );
    } else {
      delete globalThis.localStorage;
    }
    globalThis.fetch = originalFetch;
    dom.window.close();
  }
});

test("createState includes activity defaults", () => {
  const state = createState();
  assert.equal(state.activeTab, "nonFollowers");
  assert.equal(state.activityDays, 30);
  assert.deepEqual(state.activityEntries, {});
  assert.equal(state.activity.status, "idle");
});

test("boot loads fresh activity cache for the viewer", () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    localStorage: globalThis.localStorage,
  };
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    dom.window.localStorage.setItem(
      "ux_state_v1",
      JSON.stringify({ activityDays: 45 })
    );
    dom.window.localStorage.setItem(
      "ux_activity_v1",
      JSON.stringify({
        version: 1,
        viewerHandle: "me",
        savedAt: Date.now(),
        entries: {
          "1": {
            id: "1",
            handle: "alice",
            state: "known",
            lastTweetAt: 0,
            checkedAt: Date.now(),
            source: "lookup",
          },
        },
      })
    );
    state = boot();
    assert.equal(state.activityDays, 45);
    assert.equal(state.activityEntries["1"].handle, "alice");
    assert.equal(state.activity.status, "done");
    assert.equal(state.activity.inactive, 1);
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    dom.window.close();
  }
});

test("activity scan from the inactive tab fills the cache and renders results", async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  dom.window.document.cookie = "ct0=test; path=/";
  const originalFetch = globalThis.fetch;
  const oldDate = new Date(Date.now() - 40 * 86400000).toUTCString();
  const recentDate = new Date(Date.now() - 86400000).toUTCString();
  const fakeFetch = async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/users/lookup.json")) {
      const ids = (parsed.searchParams.get("user_id") || "")
        .split(",")
        .filter(Boolean);
      return new Response(
        JSON.stringify(
          ids.map((id) => ({
            id_str: id,
            screen_name: id === "1" ? "alice" : id === "2" ? "bob" : "carol",
            statuses_count: id === "3" ? 0 : 1,
            status:
              id === "3"
                ? undefined
                : {
                    created_at: id === "1" ? recentDate : oldDate,
                  },
          }))
        ),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    localStorage: globalThis.localStorage,
    fetch: globalThis.fetch,
  };
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    set("fetch", fakeFetch);
    state = boot();
    state.users = [
      { id: "1", handle: "alice", name: "Alice", followsViewer: false },
      { id: "2", handle: "bob", name: "Bob", followsViewer: false },
      { id: "3", handle: "carol", name: "Carol", followsViewer: true },
    ];
    state.mode = "results";
    state.unverified = false;
    state.partial = false;
    state.timings = {
      ...state.timings,
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    };
    state.ui.render();
    dom.window.document.querySelector('[data-tab="inactive"]').click();
    dom.window.document.querySelector('[data-action="start-activity"]').click();
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (state.activity.status === "done" || Date.now() - started > 3000) {
          return resolve();
        }
        setTimeout(tick, 25);
      };
      tick();
    });
    assert.equal(state.activity.status, "done");
    assert.equal(Object.keys(state.activityEntries).length, 3);
    assert.equal(state.activityEntries["2"].state, "known");
    assert.equal(state.activityEntries["3"].lastTweetAt, 0);
    assert.match(
      dom.window.document.querySelector('[data-view="results"]').textContent,
      /Bob/
    );
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    globalThis.fetch = originalFetch;
    dom.window.close();
  }
});

test("activity scan keeps template-broken results as a retryable error", async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  dom.window.document.cookie = "ct0=test; path=/";
  const originalFetch = globalThis.fetch;
  const fakeFetch = async (url) => {
    if (String(url).includes("users/lookup")) {
      return new Response(
        JSON.stringify({ errors: [{ message: "Not Found" }] }),
        { status: 404, headers: { "content-type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ errors: [{ message: "Unknown queryId" }] }),
      { status: 200, headers: { "content-type": "application/json" } }
    );
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    localStorage: globalThis.localStorage,
    fetch: globalThis.fetch,
  };
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    set("fetch", fakeFetch);
    state = boot();
    state.users = [
      { id: "1", handle: "alice", name: "Alice", followsViewer: false },
      { id: "2", handle: "bob", name: "Bob", followsViewer: false },
    ];
    state.mode = "results";
    state.unverified = false;
    state.partial = false;
    state.timings = {
      ...state.timings,
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    };
    state.ui.render();
    dom.window.document.querySelector('[data-tab="inactive"]').click();
    dom.window.document.querySelector('[data-action="start-activity"]').click();
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (state.activity.status === "error" || Date.now() - started > 3000) {
          return resolve();
        }
        setTimeout(tick, 25);
      };
      tick();
    });
    assert.equal(state.activity.status, "error");
    assert.match(state.activity.error, /Replies/);
    assert.equal(state.activityEntries["1"].reason, "template");
    assert.equal(state.activityEntries["2"].reason, "template");
    assert.equal(state.activityScan.stopped, "template");
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    globalThis.fetch = originalFetch;
    dom.window.close();
  }
});
