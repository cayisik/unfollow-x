import {
  ACTIVITY_BATCH_SIZE,
  ACTIVITY_DEFAULT_DAYS,
  ACTIVITY_FEATURES,
  ACTIVITY_MAX_DAYS,
  ACTIVITY_MIN_DAYS,
  ACTIVITY_QUERY_ID,
  ACTIVITY_TTL,
  BEARER,
} from "./config.js";
import { fetchJson } from "./api.js";
import { clamp, safeJsonParse, sleep } from "./utils.js";

const DAY = 24 * 60 * 60 * 1000;

function makeError(kind, message, extra = {}) {
  const error = new Error(message || kind);
  error.kind = kind;
  Object.assign(error, extra);
  return error;
}

export function parseTwitterDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const number = Number(text);
    if (!Number.isFinite(number) || number <= 0) return null;
    return number > 1e12 ? number : number * 1000;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function classifyActivity(entry, days = ACTIVITY_DEFAULT_DAYS, now = Date.now()) {
  if (!entry || entry.state !== "known") return "unknown";
  const raw = entry.lastTweetAt;
  if (raw === null || raw === undefined || raw === "") return "unknown";
  const stamp = Number(raw);
  if (!Number.isFinite(stamp) || stamp < 0) return "unknown";
  if (stamp === 0) return "inactive";
  const windowDays = clamp(
    Number(days) || ACTIVITY_DEFAULT_DAYS,
    ACTIVITY_MIN_DAYS,
    ACTIVITY_MAX_DAYS
  );
  return stamp <= now - windowDays * DAY ? "inactive" : "active";
}

export function isActivityFresh(entry, now = Date.now()) {
  const checkedAt = Number(entry?.checkedAt);
  return (
    Number.isFinite(checkedAt) &&
    checkedAt <= now + 60_000 &&
    now - checkedAt < ACTIVITY_TTL
  );
}

export function activityEntryFor(entries, user) {
  const store = entries && typeof entries === "object" ? entries : {};
  const id = String(user?.id || "");
  const handle = String(user?.handle || "").toLowerCase();
  if (id && Object.hasOwn(store, id)) return store[id];
  if (handle && Object.hasOwn(store, handle)) return store[handle];
  return null;
}

function normalizeLookupItem(raw) {
  const id = String(raw?.id_str || raw?.id || "").trim();
  const handle = String(raw?.screen_name || raw?.handle || "")
    .replace(/^@/, "")
    .trim();
  if (!id && !handle) return null;
  const rawCount = raw?.statuses_count;
  const parsedCount =
    rawCount === null || rawCount === undefined || rawCount === ""
      ? null
      : Number(rawCount);
  const count = Number.isFinite(parsedCount) ? parsedCount : null;
  const createdAt = raw?.status?.created_at;
  let state = "fallback";
  let lastTweetAt = null;
  if (createdAt !== undefined && createdAt !== null && createdAt !== "") {
    const parsed = parseTwitterDate(createdAt);
    if (parsed !== null) {
      state = "known";
      lastTweetAt = parsed;
    }
  } else if (count === 0) {
    state = "known";
    lastTweetAt = 0;
  }
  return { id, handle, state, lastTweetAt, statusesCount: count, reason: "" };
}

export function parseLookupUsers(json) {
  const list = Array.isArray(json)
    ? json
    : Array.isArray(json?.users)
      ? json.users
      : [];
  const byId = new Map();
  const byHandle = new Map();
  const items = new Map();
  for (const raw of list) {
    const item = normalizeLookupItem(raw);
    if (!item) continue;
    const key = item.id || item.handle.toLowerCase();
    items.set(key, item);
    if (item.id) byId.set(item.id, item);
    if (item.handle) byHandle.set(item.handle.toLowerCase(), item);
  }
  return { items: [...items.values()], byId, byHandle };
}

function findInstructions(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 20) return null;
  if (Array.isArray(node.instructions)) return node.instructions;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findInstructions(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const value of Object.values(node)) {
    const found = findInstructions(value, depth + 1);
    if (found) return found;
  }
  return null;
}

function collectEntries(node, out, depth = 0) {
  if (!node || typeof node !== "object" || depth > 30) return;
  if (node.entry && typeof node.entry === "object") out.push(node.entry);
  if (Array.isArray(node.entries)) out.push(...node.entries);
  if (Array.isArray(node.items)) out.push(...node.items);
  if (Array.isArray(node.moduleItems)) out.push(...node.moduleItems);
  for (const value of Object.values(node)) collectEntries(value, out, depth + 1);
}

function isCursorEntry(entry) {
  const content = entry?.content || entry?.item?.itemContent || entry?.itemContent || {};
  const contentType = content?.__typename || content?.entryType || "";
  return (
    Boolean(content?.cursorType) ||
    contentType === "TimelineTimelineCursor" ||
    content?.itemContent?.__typename === "TimelineTimelineCursor" ||
    String(entry?.entryId || "")
      .toLowerCase()
      .includes("cursor")
  );
}

function tweetResultOf(entry) {
  const content = entry?.content || entry?.item?.itemContent || entry?.itemContent || {};
  return (
    content?.itemContent?.tweet_results?.result ||
    content?.tweet_results?.result ||
    entry?.item?.itemContent?.tweet_results?.result ||
    null
  );
}

function tweetTimestamp(result, userId) {
  const tweet =
    result?.__typename === "TweetWithVisibilityResults" ? result.tweet : result;
  if (!tweet || tweet.__typename === "TweetUnavailable") {
    return { relevant: false, at: null };
  }
  const legacy = tweet.legacy || {};
  const authorId = String(tweet.core?.user_results?.result?.rest_id || "");
  const isRetweet = Boolean(legacy.retweeted_status_result);
  const relevant = isRetweet || !userId || authorId === String(userId);
  if (!relevant) return { relevant: false, at: null };
  return { relevant: true, at: parseTwitterDate(legacy.created_at) };
}

export function parseUserTweetsPage(json, userId = "") {
  const message = String(json?.errors?.[0]?.message || "");
  if (/rate limit|too many requests/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "rate" };
  }
  if (/could not find user|user not found|suspended|not authorized to view/i.test(message)) {
    return { state: "unknown", reason: "unavailable" };
  }
  if (/could not authenticate|unauthorized|require_login|authentication/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "auth" };
  }
  if (/blocked|forbidden|challenge/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "blocked" };
  }

  const root = json?.data?.user?.result || json?.data?.user;
  if (!root) {
    if (message) {
      if (
        /query|queryid|variable|invalid|bad request|unsupported|operation/i.test(
          message
        )
      ) {
        return { state: "unknown", reason: message, fatalKind: "template" };
      }
      return { state: "unknown", reason: message };
    }
    return { state: "unknown", reason: "not-found" };
  }
  if (root.__typename === "UserUnavailable") {
    return { state: "unknown", reason: "unavailable" };
  }

  const instructions = findInstructions(root);
  if (!instructions) return { state: "unknown", reason: "parse" };

  const entries = [];
  collectEntries(instructions, entries);
  let recognized = 0;
  let relevant = 0;
  let lastTweetAt = 0;
  let nonCursor = 0;
  for (const entry of entries) {
    if (isCursorEntry(entry)) continue;
    nonCursor += 1;
    const result = tweetResultOf(entry);
    if (!result) continue;
    recognized += 1;
    const info = tweetTimestamp(result, userId);
    if (!info.relevant) continue;
    relevant += 1;
    if (info.at !== null && info.at > lastTweetAt) lastTweetAt = info.at;
  }
  if (recognized === 0 && nonCursor > 0) {
    return { state: "unknown", reason: "parse" };
  }
  if (recognized > 0 && relevant === 0) {
    return { state: "unknown", reason: "parse" };
  }
  if (relevant > 0 && lastTweetAt === 0) {
    return { state: "unknown", reason: "parse" };
  }
  return { state: "known", lastTweetAt, reason: "" };
}

function originOf(origin) {
  return (
    origin ||
    (typeof location !== "undefined" && location.origin) ||
    "https://x.com"
  );
}

function authHeaders(csrf, isJson, transactionId) {
  const headers = {
    authorization: `Bearer ${BEARER}`,
    "x-csrf-token": csrf || "",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
  };
  if (isJson) headers["content-type"] = "application/json";
  if (transactionId) headers["x-client-transaction-id"] = transactionId;
  return headers;
}

function normalizeSelector(values, handles = false) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => (value === null || value === undefined ? "" : String(value)))
    .map((value) => value.trim())
    .map((value) => (handles ? value.replace(/^@/, "") : value))
    .filter(Boolean);
}

export function buildLookupRequest({
  userIds = [],
  screenNames = [],
  csrf = "",
  origin = "",
} = {}) {
  const ids = normalizeSelector(userIds);
  const names = normalizeSelector(screenNames, true);
  if (!ids.length && !names.length) {
    throw makeError("format", "lookup requires user_id or screen_name");
  }
  if (ids.length && names.length) {
    throw makeError("format", "lookup accepts one selector type");
  }
  const url = new URL("/i/api/1.1/users/lookup.json", originOf(origin));
  if (ids.length) url.searchParams.set("user_id", ids.join(","));
  if (names.length) url.searchParams.set("screen_name", names.join(","));
  url.searchParams.set("include_entities", "true");
  return {
    url: url.toString(),
    init: {
      method: "GET",
      headers: authHeaders(csrf, false),
      credentials: "include",
    },
  };
}

export function buildActivityRequest(
  template,
  { userId = "", count = 20, csrf = "", origin = "" } = {}
) {
  if (!template) throw makeError("format", "No activity template");
  const method =
    String(template.method || "GET").toUpperCase() === "POST" ? "POST" : "GET";
  const variables = { ...(template.variables || {}) };
  variables.userId = String(userId || "");
  variables.count = Number(count) || 20;
  variables.includePromotedContent = false;
  variables.withCommunity = true;
  variables.withVoice = true;
  variables.withV2Timeline = true;
  delete variables.cursor;

  const transactionId =
    template.headers?.["x-client-transaction-id"] || "";
  const headers = authHeaders(csrf, method === "POST", transactionId);

  if (method === "GET") {
    const url = new URL(template.url, originOf(origin));
    url.searchParams.set("variables", JSON.stringify(variables));
    if (template.features && typeof template.features === "object") {
      url.searchParams.set("features", JSON.stringify(template.features));
    }
    if (template.fieldToggles && typeof template.fieldToggles === "object") {
      url.searchParams.set(
        "fieldToggles",
        JSON.stringify(template.fieldToggles)
      );
    }
    return {
      url: url.toString(),
      init: { method: "GET", headers, credentials: "include" },
    };
  }

  const base = safeJsonParse(template.body, {}) || {};
  const body = {
    ...base,
    variables,
    queryId: base.queryId || template.queryId || "",
  };
  if (template.features && body.features === undefined) {
    body.features = template.features;
  }
  if (template.fieldToggles && body.fieldToggles === undefined) {
    body.fieldToggles = template.fieldToggles;
  }
  return {
    url: new URL(template.url, originOf(origin)).toString(),
    init: {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    },
  };
}

export function buildDefaultActivityTemplate() {
  const variables = {
    userId: "",
    count: 20,
    includePromotedContent: false,
    withCommunity: true,
    withVoice: true,
    withV2Timeline: true,
  };
  return {
    url: `https://x.com/i/api/graphql/${ACTIVITY_QUERY_ID}/UserTweetsAndReplies`,
    method: "GET",
    headers: {},
    body: "",
    variables,
    features: ACTIVITY_FEATURES,
    fieldToggles: { withArticlePlainText: false },
    queryId: ACTIVITY_QUERY_ID,
    operationName: "UserTweetsAndReplies",
    capturedAt: 0,
    responseSample: null,
  };
}

function abortError() {
  return makeError("aborted", "Aborted");
}

function isLookupUnsupported(error) {
  const status = Number(error?.status);
  if (error?.kind === "blocked" && status === 403) return true;
  if (
    error?.kind === "format" &&
    !status &&
    /lookup/i.test(error?.message || "")
  ) {
    return true;
  }
  return error?.kind === "format" && [400, 403, 404, 405, 410].includes(status);
}

export async function runActivityScan(options = {}) {
  const {
    users = [],
    cache = {},
    days = ACTIVITY_DEFAULT_DAYS,
    csrf = "",
    origin = "",
    template = null,
    fetchImpl = globalThis.fetch,
    sleepFn = sleep,
    random = Math.random,
    timings = {},
    onResult = () => {},
    onProgress = () => {},
    shouldPause,
    shouldCancel,
    signal,
    lookup = true,
    force = false,
  } = options;

  const clock =
    typeof options.now === "function"
      ? options.now
      : () =>
          Number.isFinite(Number(options.now))
            ? Number(options.now)
            : Date.now();

  const delayMin = Math.max(0, Number(timings.scanDelayMin) || 0);
  const delayMax = Math.max(delayMin, Number(timings.scanDelayMax) || 0);
  const pauseEvery = Math.max(0, Number(timings.scanPauseEveryPages) || 0);
  const pauseMs = Math.max(0, Number(timings.scanPauseMs) || 0);

  const candidates = (Array.isArray(users) ? users : []).filter((user) => {
    if (!user || !user.handle) return false;
    if (force) return true;
    return !isActivityFresh(activityEntryFor(cache, user), clock());
  });
  const total = candidates.length;

  let checked = 0;
  let inactive = 0;
  let unknown = 0;
  let requests = 0;
  let lookupMode = Boolean(lookup);
  let currentSource = lookupMode ? "lookup" : "graphql";
  let graphqlBroken = false;
  let defaultTemplate = template || null;

  const check = () => {
    if (signal?.aborted || shouldCancel?.()) throw abortError();
  };

  const waitWhilePaused = async () => {
    while (shouldPause?.()) {
      check();
      onProgress({ kind: "paused", checked, total, source: currentSource });
      await sleepFn(250);
    }
    check();
  };

  const pace = async () => {
    requests += 1;
    const wait =
      delayMax <= delayMin
        ? delayMin
        : delayMin + random() * (delayMax - delayMin);
    if (wait > 0) {
      onProgress({ kind: "delay", ms: wait, checked, total, source: currentSource });
      await sleepFn(wait);
    }
    if (pauseEvery > 0 && requests % pauseEvery === 0 && pauseMs > 0) {
      onProgress({ kind: "pause", ms: pauseMs, checked, total, source: currentSource });
      await sleepFn(pauseMs);
    }
    check();
  };

  const processEntry = (user, entry) => {
    let state = entry.state;
    let lastTweetAt = null;
    if (state === "known") {
      const raw = entry.lastTweetAt;
      if (raw === null || raw === undefined || raw === "") {
        state = "unknown";
      } else {
        const value = Number(raw);
        if (Number.isFinite(value) && value >= 0) lastTweetAt = value;
        else state = "unknown";
      }
    }
    const normalized = {
      id: String(entry.id || user.id || ""),
      handle: user.handle,
      state,
      lastTweetAt: state === "known" ? lastTweetAt : null,
      reason:
        entry.reason ||
        (state === "unknown" && entry.state === "known" ? "parse" : ""),
      checkedAt: clock(),
      source: entry.source || currentSource,
    };
    checked += 1;
    if (normalized.state === "unknown") unknown += 1;
    else if (classifyActivity(normalized, days, clock()) === "inactive") {
      inactive += 1;
    }
    onResult(user, normalized);
    onProgress({
      kind: "result",
      user,
      entry: normalized,
      checked,
      total,
      inactive,
      unknown,
      source: normalized.source,
    });
    if (checked % 5 === 0) {
      onProgress({
        kind: "checkpoint",
        checked,
        total,
        source: normalized.source,
      });
    }
  };

  const lookupBatch = async (batch) => {
    const ids = batch.filter((user) => user.id).map((user) => String(user.id));
    const names = batch.filter((user) => !user.id).map((user) => user.handle);
    let json;
    try {
      const request = buildLookupRequest({
        userIds: ids,
        screenNames: names,
        csrf,
        origin,
      });
      json = await fetchJson(request.url, request.init, {
        fetchImpl,
        signal,
        sleepFn,
      });
    } catch (error) {
      if (isLookupUnsupported(error)) {
        throw makeError("lookup-unsupported", "lookup unsupported", {
          cause: error,
          status: error.status,
        });
      }
      throw error;
    }
    const parsed = parseLookupUsers(json);
    const fallback = [];
    let matched = 0;
    for (const user of batch) {
      const item =
        (user.id && parsed.byId.get(String(user.id))) ||
        parsed.byHandle.get(String(user.handle).toLowerCase());
      if (!item) {
        fallback.push(user);
        continue;
      }
      matched += 1;
      if (item.state === "known") {
        processEntry(user, { ...item, source: "lookup" });
      } else {
        fallback.push(user);
      }
    }
    await pace();
    if (batch.length > 0 && matched === 0) {
      throw makeError("lookup-unsupported", "lookup returned no users");
    }
    return fallback;
  };

  const graphqlUser = async (user) => {
    if (!user.id) {
      processEntry(user, { state: "unknown", reason: "no-id", source: "graphql" });
      return;
    }
    if (graphqlBroken) {
      processEntry(user, {
        state: "unknown",
        reason: "template",
        source: "graphql",
      });
      return;
    }
    if (!defaultTemplate) defaultTemplate = buildDefaultActivityTemplate();
    const request = buildActivityRequest(defaultTemplate, {
      userId: user.id,
      count: 20,
      csrf,
      origin,
    });
    let json;
    try {
      json = await fetchJson(request.url, request.init, {
        fetchImpl,
        signal,
        sleepFn,
      });
    } catch (error) {
      if (
        error.kind === "format" &&
        [400, 404, 405, 410].includes(Number(error.status))
      ) {
        graphqlBroken = true;
        processEntry(user, {
          state: "unknown",
          reason: "template",
          source: "graphql",
        });
        onProgress({
          kind: "template-broken",
          checked,
          total,
          source: currentSource,
        });
        return;
      }
      throw error;
    }
    const parsed = parseUserTweetsPage(json, user.id);
    if (parsed.fatalKind === "template") {
      graphqlBroken = true;
      processEntry(user, {
        state: "unknown",
        reason: "template",
        source: "graphql",
      });
      onProgress({
        kind: "template-broken",
        checked,
        total,
        source: currentSource,
      });
      return;
    }
    if (parsed.fatalKind) {
      throw makeError(parsed.fatalKind, parsed.reason || parsed.fatalKind, {
        status: 200,
        body: json,
        retryAfter: 0,
      });
    }
    processEntry(user, { ...parsed, source: "graphql" });
    await pace();
  };

  onProgress({ kind: "start", total, source: currentSource });
  if (!total) {
    onProgress({
      kind: "done",
      checked: 0,
      inactive: 0,
      unknown: 0,
      total: 0,
      source: currentSource,
      stopped: "done",
    });
    return {
      checked,
      inactive,
      unknown,
      total,
      source: currentSource,
      stopped: "done",
    };
  }

  const idQueue = candidates.filter((user) => user.id);
  const handleQueue = candidates.filter((user) => !user.id);
  let idIndex = 0;
  let handleIndex = 0;
  const hasRemaining = () =>
    idIndex < idQueue.length || handleIndex < handleQueue.length;
  const takeBatch = () => {
    if (idIndex < idQueue.length) {
      const batch = idQueue.slice(idIndex, idIndex + ACTIVITY_BATCH_SIZE);
      idIndex += batch.length;
      return batch;
    }
    const batch = handleQueue.slice(handleIndex, handleIndex + ACTIVITY_BATCH_SIZE);
    handleIndex += batch.length;
    return batch;
  };
  const takeOne = () => {
    if (idIndex < idQueue.length) return idQueue[idIndex++];
    return handleQueue[handleIndex++];
  };

  while (hasRemaining()) {
    await waitWhilePaused();
    if (lookupMode) {
      const batch = takeBatch();
      let fallback;
      try {
        fallback = await lookupBatch(batch);
      } catch (error) {
        if (error.kind === "lookup-unsupported") {
          lookupMode = false;
          currentSource = "graphql";
          onProgress({
            kind: "fallback",
            to: "graphql",
            reason: error.message,
            checked,
            total,
          });
          for (const user of batch) {
            await waitWhilePaused();
            await graphqlUser(user);
          }
          continue;
        }
        throw error;
      }
      for (const user of fallback) {
        await waitWhilePaused();
        await graphqlUser(user);
      }
    } else {
      const user = takeOne();
      await waitWhilePaused();
      await graphqlUser(user);
    }
  }

  onProgress({
    kind: "done",
    checked,
    inactive,
    unknown,
    total,
    source: currentSource,
    stopped: "done",
  });
  return {
    checked,
    inactive,
    unknown,
    total,
    source: currentSource,
    stopped: "done",
  };
}
