import {
  APP_ID,
  STYLE_ID,
  DEFAULT_FILTERS,
  DEFAULT_TIMINGS,
  COOLDOWN_MS,
  SCAN_LIMITS,
  BEARER,
  makeT,
} from "./config.js";
import {
  getCookie,
  parseTwid,
  dedupeUsers,
  formatClock,
  timeAgo,
} from "./utils.js";
import {
  loadState,
  persistState,
  loadCheckpoint,
  saveCheckpoint,
  clearCheckpoint,
  loadLastScan,
  saveLastScan,
} from "./storage.js";
import {
  installCapture,
  uninstallCapture,
  getCapturedFollowing,
} from "./capture.js";
import { buildDefaultTemplates, scanFollowing } from "./api.js";
import {
  scanDom,
  findRowByHandle,
  isProfileHref,
  RESERVED,
} from "./dom.js";
import { runUnfollowQueue } from "./unfollow.js";
import { mountUI, showDialog, keyOf } from "./ui.js";

let ACTIVE = null;

export function mergeScan(existing, incoming) {
  const byHandle = new Map();
  const list = [
    ...(Array.isArray(existing) ? existing : []),
    ...(Array.isArray(incoming) ? incoming : []),
  ];
  for (const user of list) {
    if (!user || !user.handle) continue;
    const key = user.handle.toLowerCase();
    const previous = byHandle.get(key);
    if (!previous) {
      byHandle.set(key, user);
      continue;
    }
    byHandle.set(key, {
      ...previous,
      ...user,
      id: user.id || previous.id,
      name: user.name || previous.name,
      avatar: user.avatar || previous.avatar,
      verified: Boolean(user.verified || previous.verified),
      protected: Boolean(user.protected || previous.protected),
      followsViewer:
        user.followsViewer === true ||
        user.followsViewer === false ||
        user.followsViewer === null
          ? user.followsViewer
          : previous.followsViewer,
    });
  }
  return dedupeUsers([...byHandle.values()]);
}

export function coverageFrom(users) {
  const list = Array.isArray(users) ? users.filter(Boolean) : [];
  const sawFollowedBy = list.some(
    (user) => typeof user.followsViewer === "boolean"
  );
  const missing = list.some(
    (user) => user.followsViewer === null || user.followsViewer === undefined
  );
  return {
    unverified: list.length > 0 && (!sawFollowedBy || missing),
    sawFollowedBy,
    missing,
  };
}

export function canUnfollow(state) {
  const selected =
    state?.selected instanceof Set
      ? state.selected
      : new Set(Array.isArray(state?.selected) ? state.selected : []);
  return Boolean(state && !state.unverified && selected.size > 0);
}

function normalizeTimings(raw) {
  const merged = { ...DEFAULT_TIMINGS, ...(raw || {}) };
  for (const key of Object.keys(DEFAULT_TIMINGS)) {
    const number = Number(merged[key]);
    merged[key] =
      Number.isFinite(number) && number >= 0
        ? number
        : DEFAULT_TIMINGS[key];
  }
  return merged;
}

export function createState() {
  const stored = loadState();
  return {
    mode: "idle",
    language: stored.language === "tr" ? "tr" : "en",
    viewer: { handle: "", id: "" },
    users: [],
    hidden: new Set(
      Array.isArray(stored.hidden) ? stored.hidden.map(String) : []
    ),
    selected: new Set(),
    filters: { ...DEFAULT_FILTERS, ...(stored.filters || {}) },
    search: "",
    timings: normalizeTimings(stored.timings),
    panelPos:
      stored.panelPos && typeof stored.panelPos === "object"
        ? stored.panelPos
        : null,
    minimized: Boolean(stored.minimized),
    scan: {
      scanned: 0,
      total: null,
      page: 0,
      cursor: "",
      source: "api",
      waiting: false,
    },
    source: "api",
    unverified: false,
    partial: false,
    paused: false,
    checkpoint: null,
    lastScan: null,
    error: "",
    cooldownUntil: 0,
    scanPauseUntil: 0,
    unfollow: {
      current: null,
      total: 0,
      ok: 0,
      fail: 0,
      remaining: 0,
      nextAt: 0,
      log: [],
      transport: "mutation",
    },
    active: {
      running: false,
      paused: false,
      cancelled: false,
      abort: null,
      wake: null,
    },
    disposed: false,
    ui: null,
    cleanup: null,
  };
}

function persist(state) {
  persistState(undefined, {
    language: state.language,
    hidden: [...state.hidden],
    timings: state.timings,
    filters: state.filters,
    panelPos: state.panelPos,
    minimized: state.minimized,
  });
}

function bareHandleFromHref(href) {
  try {
    const raw = String(href || "");
    const path = /^https?:/i.test(raw)
      ? new URL(raw).pathname
      : raw.split(/[?#]/)[0];
    return path.replace(/^\/+/, "").replace(/\/+$/, "");
  } catch {
    return "";
  }
}

export function resolveHandle(state) {
  if (typeof document !== "undefined") {
    const link = document.querySelector(
      '[data-testid="AppTabBar_Profile_Link"]'
    );
    if (link) {
      const handle = bareHandleFromHref(link.getAttribute("href"));
      if (handle) {
        state.viewer.handle = handle;
        state.viewer.id = parseTwid(getCookie("twid"));
        return handle;
      }
    }
  }
  if (typeof location !== "undefined") {
    const first = location.pathname.split("/").filter(Boolean)[0];
    if (
      first &&
      /^[A-Za-z0-9_]{1,15}$/.test(first) &&
      !RESERVED.has(first.toLowerCase())
    ) {
      state.viewer.handle = first;
      state.viewer.id = parseTwid(getCookie("twid"));
      return first;
    }
  }
  return state.viewer.handle || "";
}

function cleanupExisting() {
  try {
    globalThis.__uxCleanup?.();
  } catch {
    // A previous copy of the script may be partially gone.
  }
  try {
    document.getElementById(APP_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
  } catch {
    // Ignore a missing DOM.
  }
}

function waitFor(state, predicate, timeoutMs) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      let result = false;
      try {
        result = Boolean(predicate());
      } catch {
        result = false;
      }
      if (result) return resolve(true);
      if (state.active.cancelled) return resolve(false);
      if (Date.now() - started >= timeoutMs) return resolve(false);
      setTimeout(tick, 150);
    };
    tick();
  });
}

function abortError() {
  const error = new Error("Aborted");
  error.kind = "aborted";
  return error;
}

function isFatalScanError(error) {
  return (
    error?.kind === "rate" ||
    error?.kind === "auth" ||
    error?.kind === "blocked"
  );
}

export function boot() {
  cleanupExisting();
  const state = createState();
  resolveHandle(state);

  const ui = mountUI({
    state,
    onAction: (action, payload) => handleAction(action, payload),
    onChange: () => persist(state),
  });
  state.ui = ui;

  state.checkpoint = loadCheckpoint(undefined, state.viewer.handle);
  state.lastScan = loadLastScan(undefined, state.viewer.handle);

  installCapture();
  ui.render();

  const t = () => makeT(state.language);
  let pauseTimer = null;

  function checkpointNow(stopReason = null) {
    if (!state.users.length || !state.viewer.handle) return;
    const checkpoint = {
      viewerHandle: state.viewer.handle,
      users: state.users,
      cursor: state.scan.cursor || "",
      total: state.scan.total,
      source: state.source,
      unverified: state.unverified,
      savedAt: Date.now(),
      stopReason,
    };
    saveCheckpoint(undefined, checkpoint);
    state.checkpoint = checkpoint;
  }

  function snapshotLastScan() {
    if (!state.viewer.handle) return;
    const snapshot = {
      viewerHandle: state.viewer.handle,
      users: state.users,
      unverified: state.unverified,
      source: state.source,
      total: state.scan.total,
      savedAt: Date.now(),
    };
    saveLastScan(undefined, snapshot);
    state.lastScan = snapshot;
  }

  function activeSleep(ms) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (state.active.wake === finish) state.active.wake = null;
        resolve();
      };
      const timer = setTimeout(finish, Math.max(0, ms));
      state.active.wake = finish;
    });
  }

  function queueSleep(ms) {
    const paused = state.active.paused;
    return new Promise((resolve) => {
      const until = Date.now() + Math.max(0, ms);
      if (!paused) {
        state.unfollow.nextAt = until;
        ui.update();
      }
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        clearInterval(ticker);
        state.unfollow.nextAt = 0;
        if (state.active.wake === finish) state.active.wake = null;
        ui.update();
        resolve();
      };
      const timer = setTimeout(finish, Math.max(0, ms));
      const ticker = paused ? null : setInterval(() => ui.update(), 500);
      state.active.wake = finish;
    });
  }

  async function waitForCaptured(timeoutMs) {
    const started = Date.now();
    while (Date.now() - started < timeoutMs) {
      if (state.active.cancelled) return null;
      const template = getCapturedFollowing();
      if (template) return template;
      await activeSleep(300);
    }
    return null;
  }

  function setHandle(value) {
    const raw = String(value || "").trim();
    const withoutUrl = raw.replace(
      /^https?:\/\/(?:www\.)?(?:x|twitter)\.com\//i,
      ""
    );
    const handle = withoutUrl
      .split(/[/?#]/)[0]
      .replace(/^@/, "")
      .trim();
    if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) {
      ui.toast(t()("manualHandleBody"));
      return false;
    }
    state.viewer.handle = handle;
    state.viewer.id = parseTwid(getCookie("twid"));
    state.checkpoint = loadCheckpoint(undefined, handle);
    state.lastScan = loadLastScan(undefined, handle);
    state.users = [];
    state.selected = new Set();
    state.mode = "idle";
    state.error = "";
    ui.render();
    return true;
  }

  function requestManualHandle() {
    showDialog({
      title: t()("manualHandle"),
      body: t()("manualHandleBody"),
      contentHTML:
        '<input class="ux-input" data-manual-handle placeholder="@handle" autocomplete="off" spellcheck="false">',
      confirmLabel: t()("openFollowing"),
      cancelLabel: t()("cancel"),
      onConfirm: (overlay) => {
        const value = String(
          overlay.querySelector("[data-manual-handle]")?.value || ""
        )
          .trim()
          .replace(/^@/, "");
        if (value && setHandle(value)) {
          startScan(false);
        }
      },
    });
  }

  function ensureSession() {
    const csrf = getCookie("ct0");
    if (!csrf) {
      state.mode = "error";
      state.error = t()("cookieMissing");
      ui.render();
      return null;
    }
    const handle = state.viewer.handle || resolveHandle(state);
    if (!handle) {
      requestManualHandle();
      return null;
    }
    state.viewer.handle = handle;
    state.viewer.id = state.viewer.id || parseTwid(getCookie("twid"));
    return {
      csrf,
      handle,
      userId: state.viewer.id,
      origin:
        typeof location !== "undefined" && location.origin
          ? location.origin
          : "https://x.com",
    };
  }

  async function ensureFollowingPage(handle) {
    if (typeof location === "undefined") return false;
    const target = `/${handle}/following`.toLowerCase();
    const current = location.pathname.replace(/\/+$/, "").toLowerCase();
    if (current === target) return true;

    const allLinks = () => [...document.querySelectorAll("a[href]")];
    const matching = allLinks().find(
      (anchor) =>
        isProfileHref(anchor.getAttribute("href")) &&
        bareHandleFromHref(anchor.getAttribute("href")).toLowerCase() ===
          handle.toLowerCase()
    );
    const navLink = document.querySelector(
      '[data-testid="AppTabBar_Profile_Link"]'
    );
    const navHandle = bareHandleFromHref(
      navLink?.getAttribute("href")
    ).toLowerCase();
    const profile =
      matching || (navHandle === handle.toLowerCase() ? navLink : null);

    if (profile) {
      profile.click();
      await waitFor(
        state,
        () =>
          location.pathname
            .replace(/\/+$/, "")
            .toLowerCase()
            .startsWith(`/${handle.toLowerCase()}`),
        5000
      );
    }
    if (state.active.cancelled) return false;

    const following = allLinks().find((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href) return false;
      const path = bareHandleFromHref(href).toLowerCase();
      return path === `${handle.toLowerCase()}/following`;
    });
    if (!following) return false;
    following.click();
    return waitFor(
      state,
      () =>
        location.pathname.replace(/\/+$/, "").toLowerCase() === target,
      12000
    );
  }

  function handlePage(payload) {
    if (state.disposed) return;
    state.users = mergeScan(
      state.users,
      payload.allUsers || payload.users || []
    );
    state.source = payload.source || state.source;
    const total = payload.total;
    state.scan = {
      ...state.scan,
      scanned: state.users.length,
      total:
        total === null || total === undefined
          ? state.scan.total
          : Number(total),
      page: payload.page || state.scan.page,
      cursor: payload.nextCursor || "",
      source: state.source,
      waiting: false,
    };
    const coverage = coverageFrom(state.users);
    state.unverified =
      payload.unverified === true || coverage.unverified;
    checkpointNow(null);
    ui.update();
  }

  function handleStatus(event) {
    if (state.disposed) return;
    if (event.kind === "pause") {
      state.scanPauseUntil = Date.now() + Number(event.ms || 0);
      ui.update();
      clearTimeout(pauseTimer);
      pauseTimer = setTimeout(() => {
        if (state.scanPauseUntil && state.scanPauseUntil <= Date.now()) {
          state.scanPauseUntil = 0;
          ui.update();
        }
      }, Number(event.ms || 0) + 50);
    } else if (event.kind === "paused") {
      if (!state.paused) {
        state.paused = true;
        ui.render();
      }
    }
  }

  function finishScan(result) {
    if (state.disposed) return;
    state.users = mergeScan(state.users, result.users || []);
    state.source = result.source || state.source;
    state.scan = {
      ...state.scan,
      scanned: state.users.length,
      total:
        result.total === null || result.total === undefined
          ? state.scan.total
          : Number(result.total),
      page: result.pages ?? state.scan.page,
      source: state.source,
      waiting: false,
    };
    state.unverified =
      result.unverified === true || coverageFrom(state.users).unverified;
    const truncated =
      result.stopReason === "maxUsers" || result.stopReason === "maxPages";
    state.partial = truncated;
    state.mode = "results";
    state.paused = false;
    state.scanPauseUntil = 0;
    state.active.running = false;
    state.active.wake = null;
    if (truncated) {
      checkpointNow(result.stopReason);
    } else {
      state.checkpoint = null;
      clearCheckpoint(undefined);
    }
    state.error =
      state.source === "dom" && state.users.length === 0
        ? t()("domEmpty")
        : "";
    snapshotLastScan();
    ui.render();
    const count = state.users.filter(
      (user) => user.followsViewer !== true
    ).length;
    ui.toast(t()("scanCompletedToast", { count }));
  }

  function handleScanError(error) {
    if (state.disposed) return;
    state.active.running = false;
    state.active.paused = false;
    state.active.wake = null;
    state.paused = false;
    state.scanPauseUntil = 0;
    const kind = error?.kind;
    const hasUsers = state.users.length > 0;

    if (state.active.cancelled || kind === "aborted") {
      state.mode = hasUsers ? "results" : "idle";
      state.partial = hasUsers;
      state.error = "";
      if (hasUsers) {
        checkpointNow("cancelled");
        snapshotLastScan();
      }
      ui.render();
      return;
    }

    if (hasUsers) {
      checkpointNow(kind);
      snapshotLastScan();
    }
    state.mode = hasUsers ? "results" : "error";
    state.partial = hasUsers;
    if (kind === "rate") {
      const until =
        Number(error.resetAt) ||
        Date.now() + Number(error.retryAfter || COOLDOWN_MS.rate);
      state.cooldownUntil = until;
      state.error = t()("tooManyRequests", {
        time: formatClock(until),
      });
    } else if (kind === "auth") {
      state.error = t()("sessionExpired");
    } else if (kind === "blocked") {
      state.error = t()("scanBlocked");
    } else if (kind === "network") {
      state.error = t()("networkError");
    } else {
      state.error = t()("requestFailed", {
        status: error?.status || "?",
      });
    }
    ui.render();
  }

  async function startScan(resume = false) {
    if (state.active.running || state.disposed) return;
    const handle = state.viewer.handle || resolveHandle(state);
    if (!handle) {
      requestManualHandle();
      return;
    }
    const session = ensureSession();
    if (!session) return;

    const useResume = Boolean(resume && state.checkpoint);
    state.error = "";
    state.partial = false;
    state.paused = false;
    state.cooldownUntil = 0;
    state.scanPauseUntil = 0;
    clearTimeout(pauseTimer);
    state.unverified = useResume ? Boolean(state.checkpoint.unverified) : false;
    state.mode = "scanning";
    state.source = useResume ? state.checkpoint.source || "api" : "api";
    state.scan = {
      scanned: 0,
      total: null,
      page: 0,
      cursor: "",
      source: state.source,
      waiting: true,
    };
    if (useResume) {
      state.users = dedupeUsers(state.checkpoint.users || []);
      state.scan.scanned = state.users.length;
      state.scan.total =
        state.checkpoint.total === null ||
        state.checkpoint.total === undefined
          ? null
          : Number.isFinite(Number(state.checkpoint.total))
            ? Number(state.checkpoint.total)
            : null;
      state.scan.cursor = state.checkpoint.cursor || "";
      state.scan.source = state.checkpoint.source || "api";
    } else {
      state.users = [];
      state.selected = new Set();
      state.checkpoint = null;
      clearCheckpoint(undefined);
    }
    state.active = {
      running: true,
      paused: false,
      cancelled: false,
      abort: new AbortController(),
      wake: null,
    };
    ui.render();

    const onFollowing = await ensureFollowingPage(handle);
    if (state.active.cancelled) {
      handleScanError(abortError());
      return;
    }
    if (!onFollowing) {
      state.active.running = false;
      state.mode = "error";
      state.error = t()("navFailed", {
        url: `https://x.com/${handle}/following`,
      });
      ui.render();
      return;
    }

    state.scan.waiting = true;
    ui.render();
    let template = getCapturedFollowing();
    if (!template) {
      try {
        window.scrollBy(0, Math.max(320, window.innerHeight * 0.75));
      } catch {
        // Scrolling is a best-effort trigger for X's own request.
      }
      template = await waitForCaptured(SCAN_LIMITS.captureWaitMs);
    }
    if (state.active.cancelled) {
      handleScanError(abortError());
      return;
    }
    state.scan.waiting = false;
    ui.update();

    const resumeCursor = useResume ? state.scan.cursor : "";
    const resumeSeed = useResume ? state.users : [];
    const resumeTotal = useResume ? state.scan.total : null;
    const scanOptions = {
      handle,
      userId: session.userId,
      csrf: session.csrf,
      signal: state.active.abort.signal,
      timings: state.timings,
      onPage: handlePage,
      onStatus: handleStatus,
      shouldPause: () => state.active.paused,
      shouldCancel: () => state.active.cancelled,
      sleepFn: (ms) => activeSleep(ms),
    };

    let lastError = null;
    if (template) {
      try {
        const result = await scanFollowing({
          ...scanOptions,
          template,
          startCursor: resumeCursor,
          seedUsers: resumeSeed,
          seedTotal: resumeTotal,
        });
        finishScan(result);
        return;
      } catch (error) {
        lastError = error;
        if (state.active.cancelled || error.kind === "aborted") {
          handleScanError(error);
          return;
        }
        if (isFatalScanError(error)) {
          handleScanError(error);
          return;
        }
      }
    }

    for (const fallback of buildDefaultTemplates({
      handle,
      userId: session.userId,
    })) {
      if (state.active.cancelled) break;
      try {
        const result = await scanFollowing({
          ...scanOptions,
          template: fallback,
          startCursor: "",
          seedUsers: state.users,
          seedTotal: state.scan.total,
        });
        finishScan(result);
        return;
      } catch (error) {
        lastError = error;
        if (state.active.cancelled || error.kind === "aborted") {
          handleScanError(error);
          return;
        }
        if (isFatalScanError(error)) break;
      }
    }

    if (state.active.cancelled || lastError?.kind === "aborted") {
      handleScanError(lastError || abortError());
      return;
    }
    if (isFatalScanError(lastError)) {
      handleScanError(lastError);
      return;
    }

    try {
      const result = await scanDom({
        onPage: handlePage,
        signal: state.active.abort.signal,
        sleepFn: (ms) => activeSleep(ms),
        win: window,
        maxUsers: SCAN_LIMITS.maxUsers,
      });
      finishScan({
        ...result,
        source: "dom",
        pages: result.rounds,
      });
    } catch (error) {
      handleScanError(error || lastError);
    }
  }

  function cancelScan() {
    if (!state.active.running) {
      state.mode = state.users.length ? "results" : "idle";
      ui.render();
      return;
    }
    state.active.cancelled = true;
    state.active.paused = false;
    state.paused = false;
    state.active.wake?.();
    state.active.abort?.abort();
    ui.toast(t()("cancel"));
  }

  function showLastScan() {
    const scan =
      state.lastScan || loadLastScan(undefined, state.viewer.handle);
    if (!scan) {
      ui.toast(t()("lastScanEmpty"));
      return;
    }
    state.lastScan = scan;
    state.users = dedupeUsers(scan.users || []);
    state.unverified = Boolean(scan.unverified);
    state.source = scan.source || "api";
    state.scan = {
      scanned: state.users.length,
      total:
        scan.total === null || scan.total === undefined
          ? null
          : Number.isFinite(Number(scan.total))
            ? Number(scan.total)
            : null,
      page: 0,
      cursor: "",
      source: state.source,
      waiting: false,
    };
    state.mode = "results";
    state.partial = false;
    state.paused = false;
    state.error = "";
    state.selected = new Set();
    ui.render();
    ui.toast(
      t()("lastScanNotice", {
        time: timeAgo(scan.savedAt, state.language),
      })
    );
  }

  async function startUnfollow() {
    if (state.active.running || state.disposed) return;
    if (!canUnfollow(state)) {
      ui.toast(t()("noSelection"));
      return;
    }
    if (state.unverified) {
      ui.toast(t()("unverified"));
      return;
    }
    const session = ensureSession();
    if (!session) return;
    const selected = state.users.filter(
      (user) =>
        user &&
        user.handle &&
        state.selected instanceof Set &&
        state.selected.has(keyOf(user))
    );
    if (!selected.length) {
      ui.toast(t()("noSelection"));
      return;
    }
    if (selected.some((user) => user.followsViewer !== false)) {
      ui.toast(t()("unverified"));
      return;
    }
    const cap = Math.max(
      1,
      Math.min(400, Number(state.timings.maxUnfollows) || 190)
    );
    const targets = selected.slice(0, cap);
    if (selected.length > cap) {
      ui.toast(t()("capNotice", { max: cap }));
    }

    state.mode = "unfollowing";
    state.paused = false;
    state.error = "";
    state.cooldownUntil = 0;
    state.unfollow = {
      current: null,
      total: targets.length,
      ok: 0,
      fail: 0,
      remaining: targets.length,
      nextAt: 0,
      log: [],
      transport: "mutation",
    };
    state.active = {
      running: true,
      paused: false,
      cancelled: false,
      abort: new AbortController(),
      wake: null,
    };
    ui.render();

    const ctx = {
      csrf: session.csrf,
      bearer: BEARER,
      handle: session.handle,
      userId: session.userId,
      origin: session.origin,
      fetchImpl: globalThis.fetch,
      root: document,
      timings: state.timings,
      sleep: (ms) => queueSleep(ms),
      random: Math.random,
      findRow: (user) => findRowByHandle(document, user.handle),
    };

    const onProgress = (event) => {
      if (state.disposed) return;
      if (event.counts) {
        state.unfollow.ok = Number(event.counts.ok) || 0;
        state.unfollow.fail = Number(event.counts.fail) || 0;
      }
      state.unfollow.transport = event.transport || state.unfollow.transport;
      if (event.total) state.unfollow.total = event.total;
      if (event.kind === "result") {
        state.unfollow.current = event.user?.handle || state.unfollow.current;
        if (event.ok && event.user) {
          const key = keyOf(event.user);
          state.users = state.users.filter((user) => keyOf(user) !== key);
          state.selected.delete(key);
        }
        state.unfollow.log.push({
          handle: event.user?.handle || "",
          ok: Boolean(event.ok),
          reason: event.reason || "",
        });
        state.unfollow.remaining = Math.max(
          0,
          state.unfollow.total -
            (state.unfollow.ok + state.unfollow.fail)
        );
        snapshotLastScan();
        ui.render();
      } else if (event.kind === "downgrade") {
        ui.toast(
          event.to === "ui"
            ? t()("uiFallback")
            : t()("transportDowngrade")
        );
        ui.render();
      } else if (event.kind === "long-pause") {
        ui.toast(
          t()("scanPause", {
            seconds: Math.round(Number(event.ms || 0) / 1000),
          })
        );
        ui.update();
      } else if (event.kind === "paused") {
        if (!state.paused) {
          state.paused = true;
          ui.render();
        }
      } else if (event.kind === "delay") {
        state.unfollow.nextAt = Date.now() + Number(event.ms || 0);
        ui.update();
      }
    };

    let output;
    try {
      output = await runUnfollowQueue({
        targets,
        ctx,
        max: targets.length,
        shouldPause: () => state.active.paused,
        shouldCancel: () => state.active.cancelled,
        onProgress,
      });
    } catch (error) {
      output = {
        ok: state.unfollow.ok,
        fail: state.unfollow.fail + 1,
        processed: state.unfollow.ok + state.unfollow.fail + 1,
        remaining: state.unfollow.remaining,
        stopped: "network",
        transport: state.unfollow.transport,
        results: [],
        stopInfo: error,
      };
    }
    if (state.disposed) return;

    state.active.running = false;
    state.active.paused = false;
    state.active.wake = null;
    state.paused = false;
    state.unfollow.ok = Number(output.ok) || 0;
    state.unfollow.fail = Number(output.fail) || 0;
    const overflow = Math.max(0, selected.length - targets.length);
    state.unfollow.remaining = (Number(output.remaining) || 0) + overflow;
    state.unfollow.transport = output.transport || state.unfollow.transport;
    state.unfollow.current = null;
    state.unfollow.nextAt = 0;

    if (output.stopped === "rate" || output.stopped === "blocked") {
      const until =
        Number(output.stopInfo?.resetAt) ||
        Date.now() +
          Number(
            output.stopInfo?.retryAfter ||
              (output.stopped === "rate"
                ? COOLDOWN_MS.rate
                : COOLDOWN_MS.blocked)
          );
      state.cooldownUntil = until;
      ui.toast(
        output.stopped === "rate"
          ? t()("tooManyRequests", { time: formatClock(until) })
          : t()("unfollowBlocked")
      );
    } else if (output.stopped === "auth") {
      ui.toast(t()("sessionExpired"));
    } else if (output.stopped === "network") {
      ui.toast(t()("networkError"));
    }

    snapshotLastScan();
    state.mode = "done";
    ui.render();
  }

  function handleAction(action, payload) {
    if (state.disposed) return;
    if (action === "toggle-language") {
      state.language = state.language === "tr" ? "en" : "tr";
      persist(state);
      ui.render();
      return;
    }
    if (action === "save-settings") {
      state.timings = normalizeTimings(payload || state.timings);
      persist(state);
      ui.toast(t()("settingsSaved"));
      return;
    }
    if (action === "scan") {
      startScan(false);
      return;
    }
    if (action === "resume") {
      startScan(true);
      return;
    }
    if (action === "show-last") {
      showLastScan();
      return;
    }
    if (action === "rescan") {
      startScan(false);
      return;
    }
    if (action === "pause-scan") {
      if (state.active.running) {
        state.active.paused = true;
        state.paused = true;
        ui.render();
      }
      return;
    }
    if (action === "resume-scan") {
      state.active.paused = false;
      state.paused = false;
      ui.render();
      return;
    }
    if (action === "cancel-scan") {
      cancelScan();
      return;
    }
    if (action === "start-unfollow") {
      startUnfollow();
      return;
    }
    if (action === "pause-unfollow") {
      if (state.active.running) {
        state.active.paused = true;
        state.paused = true;
        ui.render();
      }
      return;
    }
    if (action === "resume-unfollow") {
      state.active.paused = false;
      state.paused = false;
      ui.render();
      return;
    }
    if (action === "cancel-unfollow") {
      state.active.cancelled = true;
      state.active.wake?.();
      return;
    }
    if (action === "manual-handle") {
      if (setHandle(payload)) startScan(false);
      return;
    }
    if (action === "retry-scan") {
      startScan(Boolean(state.checkpoint && state.users.length));
      return;
    }
    if (action === "back") {
      state.mode = state.users.length ? "results" : "idle";
      state.error = "";
      ui.render();
      return;
    }
    if (action === "open-following") {
      const handle = state.viewer.handle;
      if (!handle) return;
      ensureFollowingPage(handle).then((ok) => {
        if (!ok) {
          ui.toast(
            t()("navFailed", {
              url: `https://x.com/${handle}/following`,
            })
          );
        }
      });
      return;
    }
    if (action === "close") {
      state.cleanup?.();
    }
  }

  function onVisibility() {
    if (
      typeof document !== "undefined" &&
      document.hidden &&
      state.active.running
    ) {
      state.active.paused = true;
      state.paused = true;
      ui.toast(t()("keepTabVisible"));
      ui.render();
    }
  }

  const cleanup = () => {
    if (state.disposed) return;
    state.disposed = true;
    state.active.cancelled = true;
    state.active.wake?.();
    state.active.abort?.abort();
    clearTimeout(pauseTimer);
    document.removeEventListener("visibilitychange", onVisibility);
    uninstallCapture();
    ui.destroy();
    if (globalThis.__uxCleanup === cleanup) {
      delete globalThis.__uxCleanup;
    }
    if (ACTIVE === state) ACTIVE = null;
  };

  document.addEventListener("visibilitychange", onVisibility);
  globalThis.__uxCleanup = cleanup;
  ACTIVE = state;
  state.cleanup = cleanup;
  return state;
}

export function getActiveState() {
  return ACTIVE;
}
