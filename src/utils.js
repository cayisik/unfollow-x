import { COOLDOWN_MS } from "./config.js";

const HTML_ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

export const escapeAttr = escapeHTML;

export function getCookie(name) {
  if (typeof document === "undefined" || !document.cookie) return "";
  const target = String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${target}=([^;]*)`)
  );
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

export function parseTwid(raw) {
  if (!raw) return "";
  let value = String(raw);
  try {
    value = decodeURIComponent(value);
  } catch {
    // Keep the raw value; it may already be decoded.
  }
  const match = value.match(/(?:^|&)u=(\d+)/);
  return match ? match[1] : "";
}

export function formatCount(value, language = "en") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return new Intl.NumberFormat(language === "tr" ? "tr-TR" : "en-US").format(
    number
  );
}

export function parseRetryAfter(value) {
  if (value === undefined || value === null || value === "") return 0;
  const text = String(value).trim();
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return Math.max(0, Number(text) * 1000);
  }
  const date = Date.parse(text);
  if (Number.isFinite(date)) return Math.max(0, date - Date.now());
  return 0;
}

export function parseResetHeader(value) {
  if (value === undefined || value === null || value === "") return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return 0;
  // X sends Unix seconds; accept milliseconds if a caller passes them.
  return number > 1e12 ? number : number * 1000;
}

export function retryDecision(status, json) {
  const code = Number(status) || 0;
  const message = String(
    json?.errors?.[0]?.message || json?.error || json?.message || ""
  );
  if (
    code === 429 ||
    /rate limit|too many requests|try again later/i.test(message)
  ) {
    return { kind: "rate", retry: false, cooldownMs: COOLDOWN_MS.rate };
  }
  if (
    code === 401 ||
    /could not authenticate|require_login|unauthorized|not authorized/i.test(
      message
    )
  ) {
    return { kind: "auth", retry: false, cooldownMs: 0 };
  }
  if (
    code === 403 ||
    /blocked|challenge|spam|feedback|access denied|forbidden/i.test(message)
  ) {
    return { kind: "blocked", retry: false, cooldownMs: COOLDOWN_MS.blocked };
  }
  if (code >= 500) {
    return { kind: "network", retry: true, cooldownMs: 5000 };
  }
  if (code >= 200 && code < 300) {
    return { kind: "ok", retry: false, cooldownMs: 0 };
  }
  return { kind: "format", retry: false, cooldownMs: 0 };
}

function firstBoolean(...values) {
  for (const value of values) {
    if (typeof value === "boolean") return value;
  }
  return null;
}

export function normalizeUser(raw) {
  if (!raw || typeof raw !== "object") return null;
  const legacy = raw.legacy || {};
  const core = raw.core || {};
  const avatarObj = raw.avatar || {};
  const handle = String(
    legacy.screen_name ||
      core.screen_name ||
      raw.screen_name ||
      raw.handle ||
      ""
  )
    .replace(/^@/, "")
    .trim();
  if (!handle) return null;
  const id = String(
    raw.rest_id || raw.id_str || raw.id || raw.userId || ""
  ).trim();
  const name = String(
    legacy.name || core.name || raw.name || handle
  ).trim();
  return {
    id,
    handle,
    name,
    avatar: String(
      legacy.profile_image_url_https ||
        avatarObj.image_url ||
        raw.profile_image_url_https ||
        raw.avatar ||
        ""
    ),
    verified: Boolean(
      raw.is_blue_verified ||
        legacy.verified ||
        raw.verification?.verified ||
        raw.verified
    ),
    protected: Boolean(
      legacy.protected ?? raw.privacy?.protected ?? raw.protected
    ),
    followsViewer: firstBoolean(
      raw.relationship_perspectives?.followed_by,
      legacy.followed_by,
      raw.followed_by
    ),
  };
}

export function dedupeUsers(list) {
  const out = [];
  const seenIds = new Set();
  const seenHandles = new Set();
  for (const user of Array.isArray(list) ? list : []) {
    if (!user || !user.handle) continue;
    const id = String(user.id || "");
    const handle = String(user.handle).toLowerCase();
    if ((id && seenIds.has(id)) || seenHandles.has(handle)) continue;
    if (id) seenIds.add(id);
    seenHandles.add(handle);
    out.push(user);
  }
  return out;
}

export function isDefaultAvatar(user) {
  const url = String(user?.avatar || user?.profile_pic_url || "");
  if (!url) return true;
  return /default_profile|default-avatar|anonymousUser|sticky\/default_profile_images|\/egg\./i.test(
    url
  );
}

export function randomBetween(min, max) {
  const lo = Number(min) || 0;
  const hi = Number(max) || 0;
  if (hi <= lo) return lo;
  return lo + Math.random() * (hi - lo);
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

export function clamp(value, min, max) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? number : min;
  return Math.min(max, Math.max(min, safe));
}

export function safeJsonParse(text, fallback = null) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

export function timeAgo(timestamp, language = "en") {
  const then = Number(timestamp);
  if (!Number.isFinite(then) || then <= 0) return "";
  const diff = then - Date.now();
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(language === "tr" ? "tr" : "en", {
    numeric: "auto",
  });
  if (abs < 60_000) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < 3_600_000) return rtf.format(Math.round(diff / 60_000), "minute");
  if (abs < 86_400_000) return rtf.format(Math.round(diff / 3_600_000), "hour");
  return rtf.format(Math.round(diff / 86_400_000), "day");
}

export function formatDuration(ms) {
  const total = Math.max(0, Math.ceil(Number(ms) / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function formatClock(timestamp) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function isEditableTarget(target) {
  if (!target) return false;
  const tag = String(target.tagName || "").toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    Boolean(target.isContentEditable)
  );
}

export function truncate(value, max = 80) {
  const text = String(value ?? "");
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
