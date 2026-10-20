import { safeJsonParse } from "./utils.js";

let captured = null;
const FLAG = "__uxCaptureInstalled";

function absoluteUrl(url) {
  try {
    return new URL(String(url), "https://x.com").toString();
  } catch {
    return "";
  }
}

function normalizeHeaders(headers) {
  const out = {};
  if (!headers) return out;
  try {
    if (typeof headers.forEach === "function" && !Array.isArray(headers)) {
      headers.forEach((value, key) => {
        out[String(key).toLowerCase()] = String(value);
      });
    } else if (Array.isArray(headers)) {
      for (const [key, value] of headers) {
        out[String(key).toLowerCase()] = String(value);
      }
    } else {
      for (const [key, value] of Object.entries(headers)) {
        out[String(key).toLowerCase()] = String(value);
      }
    }
  } catch {
    return {};
  }
  return out;
}

function pickHeaders(headers) {
  const normalized = normalizeHeaders(headers);
  const out = {};
  if (normalized["x-client-transaction-id"]) {
    out["x-client-transaction-id"] = normalized["x-client-transaction-id"];
  }
  return out;
}

function parseBody(body) {
  if (!body) return null;
  if (typeof body === "object" && !(body instanceof URLSearchParams)) return body;
  if (typeof body !== "string") return null;
  return safeJsonParse(body, null);
}

export function parseTemplate({ url, method = "GET", headers, body } = {}) {
  const absolute = absoluteUrl(url);
  if (!absolute) return null;
  let parsed;
  try {
    parsed = new URL(absolute);
  } catch {
    return null;
  }
  const match = parsed.pathname.match(
    /^\/i\/api\/graphql\/([^/]+)\/([^/]+)\/?$/
  );
  if (!match) return null;
  const operationName = decodeURIComponent(match[2]);
  if (operationName !== "Following" && operationName !== "followingQuery") {
    return null;
  }
  const queryId = decodeURIComponent(match[1]);
  const upperMethod = String(method || "GET").toUpperCase();
  const bodyJson = parseBody(body);

  let variables = {};
  let features = null;
  let fieldToggles = null;

  if (upperMethod === "GET") {
    variables =
      safeJsonParse(parsed.searchParams.get("variables"), {}) || {};
    features = safeJsonParse(parsed.searchParams.get("features"), null);
    fieldToggles = safeJsonParse(
      parsed.searchParams.get("fieldToggles"),
      null
    );
  } else {
    variables = bodyJson?.variables || {};
    features = bodyJson?.features ?? null;
    fieldToggles = bodyJson?.fieldToggles ?? null;
  }

  if (!variables || typeof variables !== "object") variables = {};

  return {
    url: absolute,
    method: upperMethod,
    headers: pickHeaders(headers),
    body: typeof body === "string" ? body : bodyJson ? JSON.stringify(bodyJson) : "",
    variables,
    features,
    fieldToggles,
    queryId,
    operationName,
    capturedAt: Date.now(),
    responseSample: null,
  };
}

function requestParts(input, init) {
  if (input && typeof input === "object" && "url" in input) {
    return {
      url: input.url,
      method: init?.method || input.method || "GET",
      headers: init?.headers || input.headers,
      body: init?.body,
    };
  }
  return {
    url: input,
    method: init?.method || "GET",
    headers: init?.headers,
    body: init?.body,
  };
}

function attachSample(response, template) {
  if (!response || typeof response.clone !== "function") return;
  try {
    const clone = response.clone();
    if (typeof clone.json !== "function") return;
    clone
      .json()
      .then((json) => {
        if (captured && captured.capturedAt === template.capturedAt) {
          captured.responseSample = json;
        }
      })
      .catch(() => {});
  } catch {
    // A consumed or opaque response cannot be cloned.
  }
}

export function installCapture({
  fetchImpl = globalThis.fetch,
  xhrImpl = globalThis.XMLHttpRequest,
  windowImpl = globalThis.window,
} = {}) {
  const result = { fetch: null, xhr: false };

  if (typeof fetchImpl === "function" && !fetchImpl[FLAG]) {
    const wrapped = function uxCaptureFetch(input, init) {
      const parts = requestParts(input, init);
      const template = parseTemplate(parts);
      const promise = fetchImpl.apply(this, arguments);
      if (template) {
        captured = template;
        Promise.resolve(promise)
          .then((response) => attachSample(response, template))
          .catch(() => {});
      }
      return promise;
    };
    wrapped[FLAG] = true;
    wrapped.__uxOriginalFetch = fetchImpl;
    try {
      globalThis.fetch = wrapped;
    } catch {
      // Some hosts expose a read-only fetch; the caller can use the return value.
    }
    result.fetch = wrapped;
  }

  if (xhrImpl && xhrImpl.prototype && !xhrImpl.prototype[FLAG]) {
    const proto = xhrImpl.prototype;
    const originalOpen = proto.open;
    const originalSend = proto.send;
    proto.__uxOriginalOpen = originalOpen;
    proto.__uxOriginalSend = originalSend;
    proto.open = function uxOpen(method, url, ...rest) {
      this.__uxRequest = { method, url };
      return originalOpen.call(this, method, url, ...rest);
    };
    proto.send = function uxSend(body) {
      const meta = this.__uxRequest;
      if (meta) {
        const template = parseTemplate({
          url: meta.url,
          method: meta.method,
          headers: null,
          body,
        });
        if (template) {
          captured = template;
          this.addEventListener?.("load", () => {
            try {
              const json = safeJsonParse(this.responseText, null);
              if (json && captured && captured.capturedAt === template.capturedAt) {
                captured.responseSample = json;
              }
            } catch {
              // Ignore non-JSON responses.
            }
          });
        }
      }
      return originalSend.call(this, body);
    };
    proto[FLAG] = true;
    result.xhr = true;
  }

  return result;
}

export function uninstallCapture() {
  try {
    if (globalThis.fetch && globalThis.fetch[FLAG]) {
      const original = globalThis.fetch.__uxOriginalFetch;
      if (typeof original === "function") globalThis.fetch = original;
    }
  } catch {
    // Ignore a read-only fetch.
  }

  try {
    const proto = globalThis.XMLHttpRequest?.prototype;
    if (proto && proto[FLAG]) {
      if (typeof proto.__uxOriginalOpen === "function") {
        proto.open = proto.__uxOriginalOpen;
      }
      if (typeof proto.__uxOriginalSend === "function") {
        proto.send = proto.__uxOriginalSend;
      }
      delete proto[FLAG];
      delete proto.__uxOriginalOpen;
      delete proto.__uxOriginalSend;
    }
  } catch {
    // Ignore a read-only XMLHttpRequest prototype.
  }

  captured = null;
}

export function getCapturedFollowing() {
  return captured;
}

export function resetCapture() {
  captured = null;
}

export function waitForCapture(timeoutMs = 15000, pollMs = 250) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (captured) return resolve(captured);
      if (Date.now() - started >= timeoutMs) return resolve(null);
      setTimeout(tick, pollMs);
    };
    tick();
  });
}
