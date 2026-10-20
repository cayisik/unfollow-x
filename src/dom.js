import { sleep, dedupeUsers } from "./utils.js";

export const RESERVED = new Set([
  "home",
  "explore",
  "notifications",
  "messages",
  "i",
  "settings",
  "compose",
  "search",
  "bookmarks",
  "jobs",
  "communities",
  "premium",
  "verified",
  "tos",
  "privacy",
  "about",
  "login",
  "logout",
  "signup",
  "following",
  "followers",
  "lists",
  "topics",
  "grok",
  "account",
  "more",
  "intent",
  "share",
  "hashtag",
  "connect_people",
  "who_to_follow",
  "personalization",
  "your_twitter_data",
  "display",
  "language",
  "accessibility",
  "download",
  "safety",
  "help",
  "rules",
  "ads",
  "business",
  "developers",
  "directory",
  "moments",
  "spaces",
  "audio",
  "superfollows",
  "payment",
]);

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pathOf(href) {
  const raw = String(href || "").trim();
  if (!raw) return "";
  try {
    if (/^https?:/i.test(raw)) return new URL(raw).pathname;
    return raw.split(/[?#]/)[0];
  } catch {
    return "";
  }
}

function handleFromHref(href) {
  return pathOf(href).replace(/^\/+/, "").replace(/\/+$/, "");
}

export function isProfileHref(href) {
  const path = pathOf(href).replace(/\/+$/, "");
  const match = path.match(/^\/([A-Za-z0-9_]{1,15})$/);
  if (!match) return false;
  return !RESERVED.has(match[1].toLowerCase());
}

export function rowContainer(link) {
  if (!link) return null;
  const known = link.closest?.(
    '[data-testid="UserCell"], [data-testid="cellInnerDiv"], [role="listitem"], li'
  );
  if (known && known.querySelector?.('button,[role="button"]')) return known;
  let node = link;
  for (let i = 0; i < 10; i += 1) {
    node = node.parentElement;
    if (!node || node === node.ownerDocument?.body) break;
    if (
      node.querySelector?.('button,[role="button"]') &&
      node.querySelector?.("img")
    ) {
      return node;
    }
  }
  return link.parentElement || null;
}

function cleanName(raw, handle) {
  let text = String(raw || "").replace(/\s+/g, " ").trim();
  text = text.replace(
    new RegExp(`@${escapeRegExp(handle)}\\b`, "ig"),
    " "
  );
  text = text.replace(
    /\b(follows you|following|follow|seni takip ediyor|takip ediliyor|takibi bırak|takip et)\b/gi,
    " "
  );
  return text.replace(/\s+/g, " ").trim();
}

export function parseUserRow(row) {
  if (!row?.querySelectorAll) return null;
  const links = [...row.querySelectorAll("a[href]")].filter((link) =>
    isProfileHref(link.getAttribute("href"))
  );
  if (!links.length) return null;
  const handle = handleFromHref(links[0].getAttribute("href"));
  if (!handle) return null;

  const nameText = links
    .map((link) => link.textContent || "")
    .filter((text) => text.trim())
    .join(" ");
  let name = cleanName(nameText, handle);
  if (!name) {
    const alt = [...row.querySelectorAll("img[alt]")]
      .map((img) => img.getAttribute("alt") || "")
      .find((text) => text.trim());
    if (alt) name = cleanName(alt, handle);
  }
  if (!name) name = handle;

  const avatar =
    row.querySelector('img[src*="profile_images"]')?.getAttribute("src") ||
    row.querySelector("img[src]")?.getAttribute("src") ||
    "";

  const verified = Boolean(
    row.querySelector(
      '[data-testid="icon-verified"], [data-testid="verificationBadge"], svg[data-testid*="verified"], [aria-label*="Verified" i], [aria-label*="Doğrulanmış" i]'
    )
  );
  const protectedUser = Boolean(
    row.querySelector(
      '[data-testid="icon-lock"], [aria-label*="Protected" i], [aria-label*="Korumalı" i]'
    )
  );

  const text = String(row.textContent || "").replace(/\s+/g, " ").toLowerCase();
  const explicitFollows = Boolean(
    row.querySelector(
      '[data-testid="userFollowIndicator"], [data-testid*="follow-indicator"], [aria-label*="Follows you" i], [aria-label*="Seni takip ediyor" i]'
    )
  );
  const followsText =
    /\bfollows you\b/.test(text) || /seni takip ediyor/.test(text);
  const knownEnglish =
    /\bfollowing\b|\bfollow\b/.test(text) ||
    String(row.ownerDocument?.documentElement?.lang || "")
      .toLowerCase()
      .startsWith("en");
  const knownTurkish =
    /takip ediliyor|takibi bırak|takip et\b/.test(text) ||
    String(row.ownerDocument?.documentElement?.lang || "")
      .toLowerCase()
      .startsWith("tr");
  const followsViewer =
    explicitFollows || followsText
      ? true
      : knownEnglish || knownTurkish
        ? false
        : null;

  return {
    id: String(
      row.getAttribute("data-user-id") ||
        row.querySelector("[data-user-id]")?.getAttribute("data-user-id") ||
        ""
    ),
    handle,
    name,
    avatar,
    verified,
    protected: protectedUser,
    followsViewer,
  };
}

export function collectVisibleUsers(root = globalThis.document) {
  const users = [];
  if (!root?.querySelectorAll) return users;
  const seenRows = new Set();
  for (const link of root.querySelectorAll("a[href]")) {
    if (!isProfileHref(link.getAttribute("href"))) continue;
    const row = rowContainer(link);
    if (!row || seenRows.has(row)) continue;
    if (!row.querySelector('button,[role="button"]')) continue;
    seenRows.add(row);
    const user = parseUserRow(row);
    if (user) users.push(user);
  }
  return dedupeUsers(users);
}

export function findRowByHandle(root, handle) {
  const target = String(handle || "").replace(/^@/, "").toLowerCase();
  if (!target || !root?.querySelectorAll) return null;
  for (const link of root.querySelectorAll("a[href]")) {
    if (!isProfileHref(link.getAttribute("href"))) continue;
    if (handleFromHref(link.getAttribute("href")).toLowerCase() === target) {
      return rowContainer(link);
    }
  }
  return null;
}

export function findUnfollowButton(row) {
  if (!row?.querySelectorAll) return null;
  const buttons = [...row.querySelectorAll('button,[role="button"]')];
  return (
    buttons.find((element) => {
      const testId = String(
        element.getAttribute("data-testid") || ""
      ).toLowerCase();
      const label = String(element.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
      const aria = String(
        element.getAttribute("aria-label") || ""
      ).toLowerCase();
      if (testId.includes("unfollow")) return true;
      if (/^(following|unfollow|takip ediliyor|takibi bırak)$/.test(label)) {
        return true;
      }
      return /unfollow|takipten çık|takibi bırak/.test(aria);
    }) || null
  );
}

export function findConfirmButton(root = globalThis.document) {
  if (!root?.querySelector) return null;
  const dialog = root.querySelector(
    '[role="dialog"], [data-testid="confirmationSheet"], [data-testid="confirmationSheetDialog"]'
  );
  const scope = dialog || root;
  const byTestId = scope.querySelector(
    '[data-testid="confirmationSheetConfirm"], [data-testid$="-confirm"]'
  );
  if (byTestId) return byTestId;
  return (
    [...scope.querySelectorAll('button,[role="button"]')].find((element) =>
      /^(unfollow|takipten çık|takibi bırak|confirm|onayla)$/i.test(
        String(element.textContent || "").replace(/\s+/g, " ").trim()
      )
    ) || null
  );
}

export async function clickUnfollow(
  row,
  root = globalThis.document,
  { sleepFn = sleep } = {}
) {
  const action = findUnfollowButton(row);
  if (!action) return { ok: false, reason: "button" };
  try {
    action.click();
  } catch {
    return { ok: false, reason: "click" };
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await sleepFn(150);
    const confirm = findConfirmButton(root);
    if (confirm) {
      try {
        confirm.click();
      } catch {
        return { ok: false, reason: "confirm-click" };
      }
      await sleepFn(1000);
      return { ok: true, confirmed: true };
    }
    const next = findUnfollowButton(row);
    const label = String(next?.textContent || "").trim().toLowerCase();
    if (!next || /^(follow|takip et)$/.test(label)) {
      return { ok: true, confirmed: false };
    }
  }
  return { ok: false, reason: "confirm" };
}

export async function scanDom({
  root = globalThis.document,
  onPage = () => {},
  signal,
  sleepFn = sleep,
  maxRounds = 8,
  scrollStep = 900,
  stepMs = 800,
  win = globalThis.window,
  maxUsers = 10000,
} = {}) {
  let users = [];
  let rounds = 0;
  let idleRounds = 0;

  while (rounds < 200 && users.length < maxUsers) {
    if (signal?.aborted) {
      const error = new Error("Aborted");
      error.kind = "aborted";
      throw error;
    }
    const batch = collectVisibleUsers(root);
    const knownHandles = new Set(
      users.map((user) => user.handle.toLowerCase())
    );
    const knownIds = new Set(users.map((user) => user.id).filter(Boolean));
    const fresh = batch.filter(
      (user) =>
        !knownHandles.has(user.handle.toLowerCase()) &&
        !(user.id && knownIds.has(user.id))
    );
    users = dedupeUsers([...users, ...batch]);
    rounds += 1;
    if (fresh.length) {
      idleRounds = 0;
      onPage({
        users: fresh,
        allUsers: users,
        total: null,
        nextCursor: null,
        page: rounds,
        source: "dom",
        unverified: users.some((user) => user.followsViewer === null),
      });
    } else {
      idleRounds += 1;
    }
    if (idleRounds >= maxRounds) break;
    try {
      win?.scrollBy?.(0, scrollStep);
    } catch {
      // jsdom and some embedded webviews do not implement scrolling.
    }
    await sleepFn(stepMs);
  }

  return {
    users,
    unverified: users.some((user) => user.followsViewer === null),
    rounds,
  };
}
