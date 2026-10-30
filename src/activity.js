import {
  ACTIVITY_BATCH_SIZE,
  ACTIVITY_DEFAULT_DAYS,
  ACTIVITY_FEATURES,
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
  const stamp = Number(entry.lastTweetAt);
  if (!Number.isFinite(stamp) || stamp < 0) return "unknown";
  if (stamp === 0) return "inactive";
  const windowDays = clamp(Number(days) || ACTIVITY_DEFAULT_DAYS, 1, 365);
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
  const id = String(user?.id || "");
  const handle = String(user?.handle || "").toLowerCase();
  return (id && entries?.[id]) || (handle && entries?.[handle]) || null;
}

function normalizeLookupItem(raw) {
  const id = String(raw?.id_str || raw?.id || "").trim();
  const handle = String(raw?.screen_name || raw?.handle || "")
    .replace(/^@/, "")
    .trim();
  if (!id && !handle) return null;
  const statusesCount = Number(raw?.statuses_count);
  const count = Number.isFinite(statusesCount) ? statusesCount : null;
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
  if (Array.isArray(node.entries)) out.push(...node.entries);
  if (Array.isArray(node.items)) out.push(...node.items);
  for (const value of Object.values(node)) collectEntries(value, out, depth + 1);
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
  if (/rate limit|too many requests|try again later/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "rate" };
  }
  if (/could not authenticate|unauthorized|not authorized|require_login/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "auth" };
  }
  if (/blocked|forbidden|challenge|spam/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "blocked" };
  }
  if (/could not find user|user not found|suspended|not authorized to view/i.test(message)) {
    return { state: "unknown", reason: "unavailable" };
  }

  const root = json?.data?.user?.result || json?.data?.user;
  if (!root) return { state: "unknown", reason: "not-found" };
  if (root.__typename === "UserUnavailable") {
    return { state: "unknown", reason: "unavailable" };
  }

  const instructions = findInstructions(root);
  if (!instructions) return { state: "unknown", reason: "parse" };

  const entries = [];
  collectEntries(instructions, entries);
  let relevant = 0;
  let lastTweetAt = 0;
  for (const entry of entries) {
    const result = tweetResultOf(entry);
    if (!result) continue;
    const info = tweetTimestamp(result, userId);
    if (!info.relevant) continue;
    relevant += 1;
    if (info.at !== null && info.at > lastTweetAt) lastTweetAt = info.at;
  }
  if (relevant > 0 && lastTweetAt === 0) {
    return { state: "unknown", reason: "parse" };
  }
  return { state: "known", lastTweetAt, reason: "" };
}
