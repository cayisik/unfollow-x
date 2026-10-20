import test from "node:test";
import assert from "node:assert/strict";
import {
  installCapture,
  uninstallCapture,
  getCapturedFollowing,
  resetCapture,
  parseTemplate,
} from "../src/capture.js";

test("captures a GET Following request", async () => {
  resetCapture();
  const calls = [];
  const fakeFetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  };
  const original = globalThis.fetch;
  globalThis.fetch = fakeFetch;
  const installed = installCapture({ fetchImpl: fakeFetch, xhrImpl: null });
  const url =
    "https://x.com/i/api/graphql/abc/Following?variables=%7B%22userId%22%3A%221%22%7D&features=%7B%7D";
  await globalThis.fetch(url, { method: "GET" });
  const t = getCapturedFollowing();
  assert.equal(t.operationName, "Following");
  assert.equal(t.method, "GET");
  assert.equal(t.variables.userId, "1");
  assert.equal(t.queryId, "abc");
  assert.equal(calls.length, 1);
  globalThis.fetch = original;
  assert.ok(installed);
});

test("captures a POST followingQuery body", () => {
  resetCapture();
  const t = parseTemplate({
    url: "https://x.com/i/api/graphql/q/followingQuery",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ variables: { screenName: "me", count: 20 }, queryId: "q" }),
  });
  assert.equal(t.operationName, "followingQuery");
  assert.equal(t.variables.screenName, "me");
  assert.equal(t.queryId, "q");
});

test("ignores unrelated endpoints", () => {
  resetCapture();
  assert.equal(
    parseTemplate({ url: "https://x.com/i/api/1.1/foo.json", method: "GET" }),
    null
  );
});

test("uninstall restores fetch and clears the captured template", async () => {
  resetCapture();
  const original = globalThis.fetch;
  const fakeFetch = async () => new Response("{}", { status: 200 });
  try {
    globalThis.fetch = fakeFetch;
    installCapture({ fetchImpl: fakeFetch, xhrImpl: null });
    assert.notEqual(globalThis.fetch, fakeFetch);
    await globalThis.fetch(
      "https://x.com/i/api/graphql/abc/Following?variables=%7B%22userId%22%3A%221%22%7D&features=%7B%7D"
    );
    assert.ok(getCapturedFollowing());

    uninstallCapture();
    assert.equal(globalThis.fetch, fakeFetch);
    assert.equal(getCapturedFollowing(), null);

    installCapture({ fetchImpl: fakeFetch, xhrImpl: null });
    assert.notEqual(globalThis.fetch, fakeFetch);
  } finally {
    uninstallCapture();
    globalThis.fetch = original;
  }
});
