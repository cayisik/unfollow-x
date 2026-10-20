import {
  BEARER,
  UNFOLLOW_MUTATION_ID,
  UNFOLLOW_PATHS,
  DEFAULT_TIMINGS,
  TRANSPORTS,
} from "./config.js";
import {
  safeJsonParse,
  retryDecision,
  parseRetryAfter,
  parseResetHeader,
  sleep,
  randomBetween,
} from "./utils.js";
import { findRowByHandle, clickUnfollow } from "./dom.js";

function originOf(ctx) {
  return (
    ctx.origin ||
    (typeof location !== "undefined" && location.origin) ||
    "https://x.com"
  );
}

function authHeaders(ctx, contentType) {
  const headers = {
    authorization: `Bearer ${ctx.bearer || BEARER}`,
    "x-csrf-token": ctx.csrf || "",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
    "content-type": contentType,
  };
  if (ctx.transactionId) {
    headers["x-client-transaction-id"] = ctx.transactionId;
  }
  return headers;
}

async function requestJson(url, init, ctx) {
  const fetchImpl = ctx.fetchImpl || globalThis.fetch;
  try {
    const response = await fetchImpl(url, {
      ...init,
      credentials: "include",
    });
    const text = await response.text();
    const json = text ? safeJsonParse(text, {}) : {};
    return { response, json };
  } catch (error) {
    return { error };
  }
}

function statusStop(response, json) {
  const status = Number(response.status);
  const decision = retryDecision(status, json);
  const resetAt = parseResetHeader(
    response.headers?.get?.("x-rate-limit-reset")
  );
  const headerDelay = parseRetryAfter(response.headers?.get?.("retry-after"));
  const retryAfter =
    (resetAt ? Math.max(0, resetAt - Date.now()) : 0) ||
    headerDelay ||
    decision.cooldownMs;
  if (
    decision.kind === "rate" ||
    decision.kind === "auth" ||
    decision.kind === "blocked"
  ) {
    return {
      ok: false,
      stop: decision.kind,
      status,
      retryAfter,
      resetAt: resetAt || Date.now() + retryAfter,
    };
  }
  if (status >= 500) {
    return {
      ok: false,
      stop: "network",
      status,
      retryAfter: 5000,
      resetAt: Date.now() + 5000,
    };
  }
  return null;
}

export function evaluateMutation(json) {
  const typename = json?.data?.unfollow_user?.__typename;
  if (typename === "UnfollowSuccessResult") return { ok: true };
  return {
    ok: false,
    reason: json?.errors?.[0]?.message || typename || "mutation",
    downgrade: true,
  };
}

export function evaluateRest(status, json) {
  const code = Number(status);
  if (code >= 200 && code < 300) {
    if (json?.following === false) return { ok: true };
    if (json?.following === true) {
      return { ok: false, reason: "still-following" };
    }
    if (json?.id_str || json?.id || json?.screen_name) return { ok: true };
    return { ok: false, reason: "unknown", downgrade: true };
  }
  if (code === 400 || code === 404) {
    return { ok: false, downgrade: true, status: code };
  }
  if (code === 429) return { ok: false, stop: "rate", status: code };
  if (code === 401) return { ok: false, stop: "auth", status: code };
  if (code === 403) return { ok: false, stop: "blocked", status: code };
  if (code >= 500) return { ok: false, stop: "network", status: code };
  return { ok: false, reason: `http-${code}`, status: code };
}

export async function unfollowViaMutation(user, ctx = {}) {
  if (!user?.id) {
    return { ok: false, downgrade: true, reason: "no-id" };
  }
  const url = new URL(UNFOLLOW_PATHS.mutation, originOf(ctx)).toString();
  const result = await requestJson(
    url,
    {
      method: "POST",
      headers: authHeaders(ctx, "application/json"),
      body: JSON.stringify({
        variables: { targetUserId: String(user.id) },
        queryId: UNFOLLOW_MUTATION_ID,
      }),
    },
    ctx
  );
  if (result.error) {
    return {
      ok: false,
      stop: "network",
      reason: result.error?.message || "network",
    };
  }
  const { response, json } = result;
  if (response.status === 400 || response.status === 404) {
    return { ok: false, downgrade: true, status: response.status };
  }
  const stop = statusStop(response, json);
  if (stop) return stop;
  if (response.status >= 200 && response.status < 300) {
    return evaluateMutation(json);
  }
  return { ok: false, reason: `http-${response.status}`, status: response.status };
}

export async function unfollowViaRest(user, ctx = {}) {
  if (!user?.id && !user?.handle) {
    return { ok: false, reason: "no-handle" };
  }
  const params = new URLSearchParams();
  if (user.id) params.set("user_id", String(user.id));
  else params.set("screen_name", String(user.handle));
  const url = new URL(UNFOLLOW_PATHS.rest, originOf(ctx)).toString();
  const result = await requestJson(
    url,
    {
      method: "POST",
      headers: authHeaders(
        ctx,
        "application/x-www-form-urlencoded;charset=UTF-8"
      ),
      body: params.toString(),
    },
    ctx
  );
  if (result.error) {
    return {
      ok: false,
      stop: "network",
      reason: result.error?.message || "network",
    };
  }
  const { response, json } = result;
  if (response.status === 400 || response.status === 404) {
    return { ok: false, downgrade: true, status: response.status };
  }
  const stop = statusStop(response, json);
  if (stop) return stop;
  return evaluateRest(response.status, json);
}

export async function unfollowViaUi(user, ctx = {}) {
  if (typeof ctx.uiUnfollow === "function") {
    return ctx.uiUnfollow(user, ctx);
  }
  const root = ctx.root || globalThis.document;
  const row = ctx.findRow
    ? ctx.findRow(user)
    : findRowByHandle(root, user.handle);
  if (!row) return { ok: false, reason: "row" };
  return clickUnfollow(row, root, { sleepFn: ctx.sleep || sleep });
}

export async function runUnfollowQueue({
  targets = [],
  ctx = {},
  max,
  onProgress = () => {},
  shouldPause,
  shouldCancel,
  transport,
} = {}) {
  const timings = { ...DEFAULT_TIMINGS, ...(ctx.timings || {}) };
  const limit =
    max === undefined
      ? Number(timings.maxUnfollows) || DEFAULT_TIMINGS.maxUnfollows
      : Number(max);
  const queue = targets.slice(0, Math.max(0, Math.min(limit, targets.length)));
  const sleepFn = ctx.sleep || sleep;
  const random = ctx.random || Math.random;
  let currentTransport = transport || TRANSPORTS.mutation;
  let ok = 0;
  let fail = 0;
  let processed = 0;
  let stopped = null;
  let stopInfo = null;
  const results = [];

  const notify = (event) =>
    onProgress({
      ...event,
      counts: { ok, fail },
      transport: currentTransport,
    });

  for (let index = 0; index < queue.length; index += 1) {
    if (shouldCancel?.()) {
      stopped = "cancel";
      break;
    }
    while (shouldPause?.()) {
      if (shouldCancel?.()) {
        stopped = "cancel";
        break;
      }
      notify({ kind: "paused", index, total: queue.length });
      await sleepFn(250);
    }
    if (stopped) break;

    const user = queue[index];
    let outcome = null;

    for (let guard = 0; guard < 3; guard += 1) {
      if (!user?.handle && !user?.id) {
        outcome = { ok: false, reason: "no-handle" };
        break;
      }
      let result;
      if (currentTransport === TRANSPORTS.mutation) {
        if (!user.id) {
          currentTransport = TRANSPORTS.rest;
          notify({ kind: "downgrade", to: "rest", user, reason: "no-id" });
          continue;
        }
        result = await unfollowViaMutation(user, ctx);
      } else if (currentTransport === TRANSPORTS.rest) {
        result = await unfollowViaRest(user, ctx);
      } else {
        result = await unfollowViaUi(user, ctx);
      }

      if (result.ok) {
        outcome = result;
        break;
      }
      if (result.stop) {
        outcome = result;
        stopped = result.stop;
        stopInfo = result;
        break;
      }
      if (result.downgrade) {
        if (currentTransport === TRANSPORTS.mutation) {
          currentTransport = TRANSPORTS.rest;
          notify({
            kind: "downgrade",
            to: "rest",
            user,
            reason: result.reason,
          });
          continue;
        }
        if (currentTransport === TRANSPORTS.rest) {
          currentTransport = TRANSPORTS.ui;
          notify({
            kind: "downgrade",
            to: "ui",
            user,
            reason: result.reason,
          });
          continue;
        }
      }
      outcome = result;
      break;
    }

    processed += 1;
    if (outcome?.ok) {
      ok += 1;
      results.push({ user, ok: true, transport: currentTransport });
      notify({
        kind: "result",
        user,
        ok: true,
        index,
        total: queue.length,
      });
    } else {
      fail += 1;
      results.push({
        user,
        ok: false,
        reason: outcome?.reason,
        transport: currentTransport,
      });
      notify({
        kind: "result",
        user,
        ok: false,
        reason: outcome?.reason,
        index,
        total: queue.length,
      });
    }

    if (stopped) break;

    if (index < queue.length - 1) {
      const wait = randomBetween(
        timings.unfollowDelayMin,
        timings.unfollowDelayMax
      );
      notify({ kind: "delay", ms: wait, index, total: queue.length });
      await sleepFn(wait);
      if (
        Number(timings.unfollowPauseEvery) > 0 &&
        ok > 0 &&
        ok % Number(timings.unfollowPauseEvery) === 0
      ) {
        notify({
          kind: "long-pause",
          ms: timings.unfollowPauseMs,
          index,
          total: queue.length,
        });
        await sleepFn(timings.unfollowPauseMs);
      }
    }
  }

  const output = {
    ok,
    fail,
    processed,
    remaining: Math.max(0, queue.length - processed),
    stopped,
    stopInfo,
    transport: currentTransport,
    results,
  };
  notify({ kind: "done", ...output });
  return output;
}
