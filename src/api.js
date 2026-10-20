import {
  BEARER,
  LEGACY_FOLLOWING_ID,
  NEW_FOLLOWING_ID,
  LEGACY_FOLLOWING_FEATURES,
  DEFAULT_TIMINGS,
  SCAN_LIMITS,
} from "./config.js";
import {
  normalizeUser,
  dedupeUsers,
  safeJsonParse,
  retryDecision,
  parseRetryAfter,
  parseResetHeader,
  sleep,
} from "./utils.js";

function makeError(kind, message, extra = {}) {
  const error = new Error(message || kind);
  error.kind = kind;
  Object.assign(error, extra);
  return error;
}

function walk(node, visit, depth = 0) {
  if (!node || typeof node !== "object" || depth > 30) return;
  visit(node);
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit, depth + 1);
    return;
  }
  for (const value of Object.values(node)) walk(value, visit, depth + 1);
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

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

export function parseFollowingPage(json) {
  const roots = [
    json?.data?.user_result_by_screen_name?.result,
    json?.data?.user?.result,
    json?.data?.user,
    json?.data,
  ];
  let instructions = null;
  for (const root of roots) {
    instructions = findInstructions(root);
    if (instructions) break;
  }

  const users = [];
  let nextCursor = null;

  if (instructions) {
    walk(instructions, (node) => {
      const result = node.user_results?.result;
      if (result) {
        const user = normalizeUser(result);
        if (user) users.push(user);
      }
      if (
        node.content?.cursorType === "Bottom" &&
        typeof node.content.value === "string"
      ) {
        nextCursor = node.content.value;
      }
      if (
        typeof node.entryId === "string" &&
        node.entryId.includes("cursor-bottom") &&
        typeof node.content?.value === "string"
      ) {
        nextCursor = node.content.value;
      }
    });
  }

  const deduped = dedupeUsers(users);
  const totalUser =
    json?.data?.user_result_by_screen_name?.result ||
    json?.data?.user?.result ||
    json?.data?.user;
  const total = firstNumber(
    totalUser?.legacy?.friends_count,
    totalUser?.relationship_counts?.following
  );

  return {
    users: deduped,
    nextCursor: nextCursor || null,
    total,
    sawFollowedBy: deduped.some(
      (user) => typeof user.followsViewer === "boolean"
    ),
    missingFollowedBy: deduped.some((user) => user.followsViewer === null),
  };
}

function authHeaders(csrf, transactionId, isJson) {
  const headers = {
    authorization: `Bearer ${BEARER}`,
    "x-csrf-token": csrf || "",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
  };
  if (transactionId) headers["x-client-transaction-id"] = transactionId;
  if (isJson) headers["content-type"] = "application/json";
  return headers;
}

export function buildFollowingRequest(template, options = {}) {
  if (!template) throw makeError("format", "No request template");
  const {
    handle = "",
    userId = "",
    cursor = "",
    count = 50,
    csrf = "",
  } = options;
  const method = String(template.method || "GET").toUpperCase() === "POST"
    ? "POST"
    : "GET";
  const variables = { ...(template.variables || {}) };
  variables.count = Number(count) || 50;
  if (cursor) variables.cursor = cursor;
  else delete variables.cursor;
  if ("screenName" in variables && handle) variables.screenName = handle;
  if ("userId" in variables && userId) variables.userId = userId;
  if (
    template.operationName === "followingQuery" &&
    !("screenName" in variables) &&
    handle
  ) {
    variables.screenName = handle;
  }
  if (
    template.operationName === "Following" &&
    !("userId" in variables) &&
    userId
  ) {
    variables.userId = userId;
  }

  const transactionId =
    options.transactionId ||
    template.headers?.["x-client-transaction-id"] ||
    "";

  if (method === "GET") {
    const url = new URL(template.url, "https://x.com");
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
      init: {
        method: "GET",
        headers: authHeaders(csrf, transactionId, false),
        credentials: "include",
      },
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
    url: new URL(template.url, "https://x.com").toString(),
    init: {
      method: "POST",
      headers: authHeaders(csrf, transactionId, true),
      body: JSON.stringify(body),
      credentials: "include",
    },
  };
}

export function buildDefaultTemplates({ handle = "", userId = "" } = {}) {
  const legacyVariables = {
    userId: String(userId || ""),
    count: 20,
    includePromotedContent: false,
  };
  const legacyUrl = `https://x.com/i/api/graphql/${LEGACY_FOLLOWING_ID}/Following?variables=${encodeURIComponent(
    JSON.stringify(legacyVariables)
  )}&features=${encodeURIComponent(JSON.stringify(LEGACY_FOLLOWING_FEATURES))}`;
  const legacy = {
    url: legacyUrl,
    method: "GET",
    headers: {},
    body: "",
    variables: legacyVariables,
    features: LEGACY_FOLLOWING_FEATURES,
    fieldToggles: null,
    queryId: LEGACY_FOLLOWING_ID,
    operationName: "Following",
    capturedAt: 0,
    responseSample: null,
  };

  const modernVariables = {
    count: 20,
    cursor: "",
    screenName: handle,
    withSafetyModeUserFields: true,
  };
  const modern = {
    url: `https://x.com/i/api/graphql/${NEW_FOLLOWING_ID}/followingQuery`,
    method: "POST",
    headers: {},
    body: JSON.stringify({
      variables: modernVariables,
      queryId: NEW_FOLLOWING_ID,
    }),
    variables: modernVariables,
    features: null,
    fieldToggles: null,
    queryId: NEW_FOLLOWING_ID,
    operationName: "followingQuery",
    capturedAt: 0,
    responseSample: null,
  };

  return [legacy, modern];
}

function responseMessage(response, json) {
  return (
    json?.errors?.[0]?.message ||
    json?.error ||
    json?.message ||
    response?.statusText ||
    `HTTP ${response?.status ?? "?"}`
  );
}

export async function fetchJson(url, init, options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    retries = 3,
    sleepFn = sleep,
    onWait,
    signal,
  } = options;
  if (typeof fetchImpl !== "function") {
    throw makeError("network", "fetch is unavailable");
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    if (signal?.aborted) throw makeError("aborted", "Aborted");
    let response;
    try {
      response = await fetchImpl(url, { ...init, signal });
    } catch (cause) {
      if (signal?.aborted) throw makeError("aborted", "Aborted");
      if (attempt < retries) {
        const wait = 5000 * 2 ** attempt;
        onWait?.({ kind: "retry", wait, attempt, cause });
        await sleepFn(wait);
        continue;
      }
      throw makeError("network", cause?.message || "Network error", { cause });
    }

    let json = {};
    try {
      const text = await response.text();
      json = text ? safeJsonParse(text, {}) : {};
    } catch {
      json = {};
    }

    if (response.ok) return json;

    const decision = retryDecision(response.status, json);
    const resetAt = parseResetHeader(
      response.headers?.get?.("x-rate-limit-reset")
    );
    const headerDelay = parseRetryAfter(
      response.headers?.get?.("retry-after")
    );
    const retryAfter =
      (resetAt ? Math.max(0, resetAt - Date.now()) : 0) ||
      headerDelay ||
      decision.cooldownMs;
    const error = makeError(decision.kind, responseMessage(response, json), {
      status: response.status,
      body: json,
      retryAfter,
      resetAt: resetAt || Date.now() + retryAfter,
    });

    if (decision.retry && attempt < retries) {
      const wait = 5000 * 2 ** attempt;
      onWait?.({ kind: "retry", wait, attempt, error });
      await sleepFn(wait);
      continue;
    }
    throw error;
  }

  throw makeError("network", "Network error");
}

function numberSetting(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

export async function scanFollowing(options = {}) {
  const {
    template,
    handle = "",
    userId = "",
    csrf = "",
    onPage = () => {},
    onStatus = () => {},
    signal,
    fetchImpl = globalThis.fetch,
    sleepFn = sleep,
    random = Math.random,
    maxPages = SCAN_LIMITS.maxPages,
    maxUsers = SCAN_LIMITS.maxUsers,
  } = options;
  if (!template) throw makeError("format", "No request template");

  const timings = { ...DEFAULT_TIMINGS, ...(options.timings || {}) };
  const delayMin = numberSetting(timings.scanDelayMin, 1500);
  const delayMax = numberSetting(timings.scanDelayMax, 2500);
  const pauseEvery = numberSetting(timings.scanPauseEveryPages, 10);
  const pauseMs = numberSetting(timings.scanPauseMs, 10000);
  let count = numberSetting(timings.usersPerRequest, 50);
  const fallbackCount = numberSetting(template.variables?.count, 20);

  let allUsers = [];
  let total = null;
  let sawFollowedBy = false;
  let missingFollowedBy = false;
  let cursor = "";
  let pages = 0;
  let zeroRuns = 0;
  let stopReason = "done";
  const usedCursors = new Set();
  const firstPage =
    template.responseSample && !template.variables?.cursor
      ? template.responseSample
      : null;

  while (pages < maxPages) {
    if (signal?.aborted) throw makeError("aborted", "Aborted");

    let parsed;
    if (pages === 0 && firstPage) {
      parsed = parseFollowingPage(firstPage);
    } else {
      const request = buildFollowingRequest(template, {
        handle,
        userId,
        cursor,
        count,
        csrf,
      });
      let json;
      try {
        json = await fetchJson(request.url, request.init, {
          fetchImpl,
          signal,
        });
      } catch (error) {
        if (
          error.kind === "format" &&
          error.status >= 400 &&
          count !== fallbackCount
        ) {
          count = fallbackCount;
          continue;
        }
        throw error;
      }
      parsed = parseFollowingPage(json);
      if (
        json?.errors?.length &&
        parsed.users.length === 0 &&
        !parsed.nextCursor
      ) {
        throw makeError(
          "format",
          json.errors[0]?.message || "GraphQL error",
          { status: 200, body: json }
        );
      }
    }

    pages += 1;
    const knownIds = new Set(
      allUsers.map((user) => user.id).filter(Boolean)
    );
    const knownHandles = new Set(
      allUsers.map((user) => user.handle.toLowerCase())
    );
    const fresh = parsed.users.filter(
      (user) =>
        !(user.id && knownIds.has(user.id)) &&
        !knownHandles.has(user.handle.toLowerCase())
    );
    allUsers = dedupeUsers([...allUsers, ...parsed.users]);
    if (parsed.total !== null) total = parsed.total;
    sawFollowedBy = sawFollowedBy || parsed.sawFollowedBy;
    missingFollowedBy = missingFollowedBy || parsed.missingFollowedBy;

    const unverified =
      allUsers.length > 0 && (!sawFollowedBy || missingFollowedBy);

    onPage({
      users: parsed.users,
      fresh,
      allUsers,
      page: pages,
      total,
      nextCursor: parsed.nextCursor,
      source: "api",
      unverified,
    });

    if (!parsed.nextCursor) {
      stopReason = "cursor";
      break;
    }
    if (usedCursors.has(parsed.nextCursor)) {
      stopReason = "repeated";
      break;
    }
    zeroRuns = fresh.length === 0 ? zeroRuns + 1 : 0;
    if (zeroRuns >= 2) {
      stopReason = "empty";
      break;
    }
    if (total !== null && allUsers.length >= total) {
      stopReason = "total";
      break;
    }
    if (allUsers.length >= maxUsers) {
      stopReason = "maxUsers";
      break;
    }
    if (pages >= maxPages) {
      stopReason = "maxPages";
      break;
    }

    cursor = parsed.nextCursor;
    usedCursors.add(cursor);
    const wait = delayMax <= delayMin
      ? delayMin
      : delayMin + random() * (delayMax - delayMin);
    onStatus({ kind: "delay", ms: wait, page: pages });
    await sleepFn(wait);
    if (pauseEvery > 0 && pages % pauseEvery === 0) {
      onStatus({ kind: "pause", ms: pauseMs, page: pages });
      await sleepFn(pauseMs);
    }
  }

  return {
    users: allUsers,
    total,
    pages,
    sawFollowedBy,
    missingFollowedBy,
    unverified: allUsers.length > 0 && (!sawFollowedBy || missingFollowedBy),
    stopReason,
  };
}
