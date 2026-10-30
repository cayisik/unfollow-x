// Resolves X's live GraphQL endpoints and the x-client-transaction-id header.
//
// X rotates GraphQL query IDs every few weeks and, since 2025, returns 404 for
// internal API calls that do not carry a valid x-client-transaction-id header.
// Both values are derived from the responsive-web shell served at /i/jf/,
// which stays available to logged-in sessions.

import { ACTIVITY_FEATURES } from "./config.js";

const HOME_PATH = "/i/jf/";
const ON_DEMAND_HOST = "https://abs.twimg.com";
const CACHE_TTL = 20 * 60 * 1000;
const FAILURE_TTL = 60 * 1000;
const DEFAULT_KEYWORD = "obfiowerehiring";
const ADDITIONAL_RANDOM_NUMBER = 3;
const HASH_EPOCH = 1682924400000;

function absolute(url, origin) {
  try {
    return new URL(url, origin).toString();
  } catch {
    return "";
  }
}

function firstMatch(value, pattern) {
  const match = String(value || "").match(pattern);
  return match ? match[1] : "";
}

export function parseHomeShell(html) {
  if (typeof html !== "string" || !html) return null;
  const key = firstMatch(
    html,
    /<meta[^>]*name=["']twitter-site-verification["'][^>]*content=["']([^"']+)["']/i
  );
  const frames = [
    ...html.matchAll(
      /<(?:svg|div)[^>]*id=["']loading-x-anim-\d+["'][\s\S]*?<\/(?:svg|div)>/gi
    ),
  ].map((block) => {
    const paths = [
      ...block[0].matchAll(/<path[^>]*\bd=["']([^"']+)["']/gi),
    ].map((match) => match[1]);
    return paths.sort((a, b) => b.length - a.length)[0] || "";
  });
  const chunkId = firstMatch(html, /(\d{3,6})\s*:\s*["']ondemand\.s["']/);
  let ondemandUrl = "";
  if (chunkId) {
    const hash = firstMatch(
      html,
      new RegExp(`${chunkId}\\s*:\\s*["']([a-zA-Z0-9_-]{12,})["']`)
    );
    if (hash) ondemandUrl = `${ON_DEMAND_HOST}/responsive-web/client-web/ondemand.s.${hash}a.js`;
  }
  if (!key || frames.length < 4 || !ondemandUrl) return null;
  return { key, frames, ondemandUrl };
}

export function parseOndemandIndices(source) {
  if (typeof source !== "string" || !source) return [];
  return [...source.matchAll(/\(\w\[(\d{1,2})\],\s*16\)/g)].map((match) =>
    parseInt(match[1], 10)
  );
}

export function parseOperationDefinition(source, operationName) {
  if (typeof source !== "string" || !source || !operationName) return null;
  const marker = new RegExp(
    `operationName:"${operationName}"[^]{0,60}?operationType:"query"`
  );
  const match = marker.exec(source);
  if (!match) return null;
  const index = match.index;
  const before = source.slice(Math.max(0, index - 300), index);
  const ids = [...before.matchAll(/queryId:"([^"]+)"/g)];
  let queryId = ids.length ? ids[ids.length - 1][1] : "";
  if (!queryId) {
    queryId = firstMatch(source.slice(index, index + 400), /queryId:"([^"]+)"/);
  }
  if (!queryId) return null;
  const slice = source.slice(index, index + 20000);
  const array = (name) => {
    const body = firstMatch(slice, new RegExp(`${name}:\\[([^\\]]*)\\]`));
    return [...body.matchAll(/"([^"]+)"/g)].map((item) => item[1]);
  };
  return {
    queryId,
    featureSwitches: array("featureSwitches"),
    fieldToggles: array("fieldToggles"),
  };
}

export function buildFeatureValues(names) {
  const values = {};
  for (const name of names || []) {
    values[name] = typeof ACTIVITY_FEATURES[name] === "boolean"
      ? ACTIVITY_FEATURES[name]
      : false;
  }
  return values;
}

export function buildFieldToggles(names) {
  const values = {};
  for (const name of names || []) values[name] = false;
  return values;
}

export function decodeBase64(value) {
  if (typeof atob === "function") {
    const binary = atob(value);
    return Array.from(binary, (char) => char.charCodeAt(0));
  }
  return Array.from(Buffer.from(value, "base64"));
}

export function encodeBase64(bytes) {
  if (typeof btoa === "function") {
    let binary = "";
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
  }
  return Buffer.from(bytes).toString("base64");
}

function interpolateNumber(from, to, fraction) {
  return from * (1 - fraction) + to * fraction;
}

function floatToHex(value) {
  const result = [];
  let quotient = Math.trunc(value);
  let fraction = value - quotient;
  while (quotient > 0) {
    const next = Math.trunc(quotient / 16);
    const remainder = quotient - next * 16;
    result.unshift(remainder > 9 ? String.fromCharCode(remainder + 55) : String(remainder));
    quotient = next;
  }
  if (fraction === 0) return result.join("");
  result.push(".");
  let guard = 0;
  while (fraction > 0 && guard < 24) {
    guard += 1;
    fraction *= 16;
    const integer = Math.trunc(fraction);
    fraction -= integer;
    result.push(integer > 9 ? String.fromCharCode(integer + 55) : String(integer));
  }
  return result.join("");
}

function isOdd(value) {
  return value % 2 ? -1 : 0;
}

class Cubic {
  constructor(curves) {
    this.curves = curves;
  }

  static calculate(a, b, m) {
    return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m;
  }

  getValue(time) {
    const curves = this.curves;
    let startGradient = 0;
    let endGradient = 0;
    let start = 0;
    let mid = 0;
    let end = 1;
    if (time <= 0) {
      if (curves[0] > 0) startGradient = curves[1] / curves[0];
      else if (curves[1] === 0 && curves[2] > 0) startGradient = curves[3] / curves[2];
      return startGradient * time;
    }
    if (time >= 1) {
      if (curves[2] < 1) endGradient = (curves[3] - 1) / (curves[2] - 1);
      else if (curves[2] === 1 && curves[0] < 1) endGradient = (curves[1] - 1) / (curves[0] - 1);
      return 1 + endGradient * (time - 1);
    }
    while (start < end) {
      mid = (start + end) / 2;
      const estimate = Cubic.calculate(curves[0], curves[2], mid);
      if (Math.abs(time - estimate) < 0.00001) {
        return Cubic.calculate(curves[1], curves[3], mid);
      }
      if (estimate < time) start = mid;
      else end = mid;
    }
    return Cubic.calculate(curves[1], curves[3], mid);
  }
}

function solve(value, min, max, rounding) {
  const result = (value * (max - min)) / 255 + min;
  return rounding ? Math.floor(result) : Math.round(result * 100) / 100;
}

function animationFrames(frames, keyBytes) {
  const path = frames[keyBytes[5] % 4];
  return path
    .slice(9)
    .split("C")
    .map((piece) =>
      piece.replace(/[^\d]+/g, " ").trim().split(/\s+/).filter(Boolean).map(Number)
    );
}

export function computeAnimationKey({ key, frames, indices }) {
  if (!key || !Array.isArray(frames) || frames.length < 4 || !indices?.length) {
    throw new Error("incomplete transaction inputs");
  }
  const keyBytes = decodeBase64(key);
  const rowIndex = indices[0];
  const byteIndices = indices.slice(1);
  const rows = animationFrames(frames, keyBytes);
  const row = rows[(keyBytes[rowIndex] % 16) % rows.length];
  if (!row) throw new Error("missing animation frame");
  let frameTime = byteIndices.reduce((total, index) => total * (keyBytes[index] % 16), 1);
  frameTime = Math.round(frameTime / 10) * 10;
  const target = frameTime / 4096;

  const fromColor = row.slice(0, 3).concat(1).map(Number);
  const toColor = row.slice(3, 6).concat(1).map(Number);
  const toRotation = solve(row[6], 60, 360, true);
  const curves = row.slice(7).map((value, index) => solve(value, isOdd(index), 1, false));
  const progress = new Cubic(curves).getValue(target);
  const color = fromColor.map((value, index) =>
    Math.max(0, Math.min(255, interpolateNumber(value, toColor[index], progress)))
  );
  const rotation = interpolateNumber(0, toRotation, progress);
  const radians = (rotation * Math.PI) / 180;
  const matrix = [Math.cos(radians), -Math.sin(radians), Math.sin(radians), Math.cos(radians)];

  const parts = color.slice(0, 3).map((value) => Math.round(value).toString(16));
  for (const value of matrix) {
    const hex = floatToHex(Math.round(Math.abs(value) * 100) / 100);
    parts.push(hex.startsWith(".") ? `0${hex}`.toLowerCase() : hex || "0");
  }
  parts.push("0", "0");
  return parts.join("").replace(/[.-]/g, "");
}

async function sha256(text) {
  if (!globalThis.crypto?.subtle) throw new Error("crypto.subtle unavailable");
  const data = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest));
}

export async function generateTransactionId({
  key,
  animationKey,
  method = "GET",
  path = "/",
  time = Date.now(),
  random = Math.random,
}) {
  const keyBytes = decodeBase64(key);
  const seconds = Math.floor((Number(time) - HASH_EPOCH) / 1000);
  const timeBytes = [
    seconds & 0xff,
    (seconds >> 8) & 0xff,
    (seconds >> 16) & 0xff,
    (seconds >> 24) & 0xff,
  ];
  const hash = await sha256(
    `${method}!${path}!${seconds}${DEFAULT_KEYWORD}${animationKey}`
  );
  const noise = Math.floor(random() * 256);
  const payload = [
    noise,
    ...keyBytes.map((byte) => byte ^ noise),
    ...timeBytes.map((byte) => byte ^ noise),
    ...hash.slice(0, 16).map((byte) => byte ^ noise),
    ADDITIONAL_RANDOM_NUMBER ^ noise,
  ];
  return encodeBase64(payload).replace(/=+$/, "");
}

export function findMainScriptUrl(html, origin) {
  const source = firstMatch(
    html,
    /<script[^>]+src=["']([^"']*responsive-web\/client-web\/main\.[^"']+\.js)["']/i
  );
  return source ? absolute(source, origin) : "";
}

export function createRuntimeClient({
  fetchImpl = globalThis.fetch,
  origin = "",
  now = () => Date.now(),
  cacheTtl = CACHE_TTL,
} = {}) {
  const base =
    origin || (typeof location !== "undefined" ? location.origin : "https://x.com");
  let shell = null;
  let mainScript = null;
  let failedAt = 0;

  async function fetchText(url) {
    if (typeof fetchImpl !== "function") throw new Error("fetch is unavailable");
    const init = { credentials: "same-origin" };
    if (typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function") {
      init.signal = AbortSignal.timeout(20000);
    }
    const response = await fetchImpl(url, init);
    if (!response || !response.ok) {
      throw new Error(`HTTP ${response?.status ?? "?"} for ${url}`);
    }
    return await response.text();
  }

  async function loadShell(force = false) {
    if (!force && shell && now() - shell.at < cacheTtl) return shell;
    const html = await fetchText(absolute(HOME_PATH, base));
    const parsed = parseHomeShell(html);
    if (!parsed) throw new Error("unrecognized X page shell");
    shell = { at: now(), html, parsed, animationKey: "" };
    return shell;
  }

  async function animationKey() {
    const current = await loadShell();
    if (current.animationKey) return current;
    const source = await fetchText(current.parsed.ondemandUrl);
    const indices = parseOndemandIndices(source);
    if (!indices.length) throw new Error("transaction indices not found");
    current.animationKey = computeAnimationKey({
      key: current.parsed.key,
      frames: current.parsed.frames,
      indices,
    });
    return current;
  }

  async function getOperation(operationName) {
    const current = await loadShell();
    if (!mainScript || now() - mainScript.at >= cacheTtl) {
      const url = findMainScriptUrl(current.html, base);
      if (!url) throw new Error("main script not found");
      mainScript = { at: now(), text: await fetchText(url) };
    }
    const definition = parseOperationDefinition(mainScript.text, operationName);
    if (!definition) throw new Error(`operation ${operationName} not found`);
    return {
      queryId: definition.queryId,
      features: buildFeatureValues(definition.featureSwitches),
      fieldToggles: buildFieldToggles(definition.fieldToggles),
    };
  }

  async function getTransactionId(method, path) {
    if (now() - failedAt < FAILURE_TTL) return "";
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const current = await animationKey();
        return await generateTransactionId({
          key: current.parsed.key,
          animationKey: current.animationKey,
          method,
          path,
          time: now(),
        });
      } catch (error) {
        shell = null;
        failedAt = now();
        if (attempt === 1) return "";
      }
    }
    return "";
  }

  function reset() {
    shell = null;
    mainScript = null;
    failedAt = 0;
  }

  return { getOperation, getTransactionId, reset };
}
