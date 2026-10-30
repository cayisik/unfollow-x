import test from "node:test";
import assert from "node:assert/strict";
import {
  installCapture,
  uninstallCapture,
  getCapturedFollowing,
  getCapturedActivity,
  resetCapture,
  parseTemplate,
  parseActivityTemplate,
} from "../src/capture.js";

async function waitFor(predicate, timeoutMs = 2000, pollMs = 5) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started >= timeoutMs) {
      throw new Error("timed out waiting for capture state");
    }
    await new Promise((resolve) => setTimeout(resolve, pollMs));
  }
}

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

test("uninstall restores fetch and clears both captured templates", async () => {
  resetCapture();
  const original = globalThis.fetch;
  const fakeFetch = async () => new Response("{}", { status: 200 });
  const followingUrl =
    "https://x.com/i/api/graphql/abc/Following?variables=%7B%22userId%22%3A%221%22%7D&features=%7B%7D";
  const activityUrl =
    "https://x.com/i/api/graphql/q/UserTweetsAndReplies?variables=%7B%22userId%22%3A%2242%22%7D";
  try {
    globalThis.fetch = fakeFetch;
    installCapture({ fetchImpl: fakeFetch, xhrImpl: null });
    assert.notEqual(globalThis.fetch, fakeFetch);
    await globalThis.fetch(followingUrl);
    await globalThis.fetch(activityUrl);
    assert.ok(getCapturedFollowing());
    assert.ok(getCapturedActivity());

    uninstallCapture();
    assert.equal(globalThis.fetch, fakeFetch);
    assert.equal(getCapturedFollowing(), null);
    assert.equal(getCapturedActivity(), null);

    installCapture({ fetchImpl: fakeFetch, xhrImpl: null });
    assert.notEqual(globalThis.fetch, fakeFetch);
    await globalThis.fetch(followingUrl);
    await globalThis.fetch(activityUrl);
    assert.ok(getCapturedFollowing());
    assert.ok(getCapturedActivity());

    resetCapture();
    assert.equal(getCapturedFollowing(), null);
    assert.equal(getCapturedActivity(), null);
  } finally {
    uninstallCapture();
    globalThis.fetch = original;
  }
});

test("parses a UserTweetsAndReplies request", () => {
  const template = parseActivityTemplate({
    url: "https://x.com/i/api/graphql/q/UserTweetsAndReplies?variables=%7B%22userId%22%3A%2242%22%7D&features=%7B%7D",
    method: "GET",
  });
  assert.equal(template.operationName, "UserTweetsAndReplies");
  assert.equal(template.queryId, "q");
  assert.equal(template.variables.userId, "42");
});

test("Following parser still ignores activity requests", () => {
  assert.equal(
    parseTemplate({
      url: "https://x.com/i/api/graphql/q/UserTweetsAndReplies",
      method: "GET",
    }),
    null
  );
});

test("captures UserTweetsAndReplies without touching Following", async () => {
  resetCapture();
  const fakeFetch = async () =>
    new Response(JSON.stringify({ ok: true }), { status: 200 });
  const original = globalThis.fetch;
  try {
    globalThis.fetch = fakeFetch;
    installCapture({ fetchImpl: fakeFetch, xhrImpl: null });
    await globalThis.fetch(
      "https://x.com/i/api/graphql/q/UserTweetsAndReplies?variables=%7B%22userId%22%3A%2242%22%7D"
    );
    assert.ok(getCapturedActivity());
    assert.equal(getCapturedFollowing(), null);
  } finally {
    uninstallCapture();
    globalThis.fetch = original;
  }
});

test("routes fetch response samples to independent capture slots", async () => {
  resetCapture();
  const fakeFetch = async (url) =>
    String(url).includes("UserTweetsAndReplies")
      ? new Response(JSON.stringify({ kind: "activity" }), { status: 200 })
      : new Response(JSON.stringify({ kind: "following" }), { status: 200 });
  const original = globalThis.fetch;
  try {
    globalThis.fetch = fakeFetch;
    installCapture({ fetchImpl: fakeFetch, xhrImpl: null });
    await globalThis.fetch(
      "https://x.com/i/api/graphql/abc/Following?variables=%7B%22userId%22%3A%221%22%7D&features=%7B%7D"
    );
    await globalThis.fetch(
      "https://x.com/i/api/graphql/q/UserTweetsAndReplies?variables=%7B%22userId%22%3A%2242%22%7D"
    );

    assert.ok(getCapturedFollowing());
    assert.ok(getCapturedActivity());
    await waitFor(
      () =>
        getCapturedFollowing()?.responseSample &&
        getCapturedActivity()?.responseSample
    );

    assert.equal(getCapturedFollowing().operationName, "Following");
    assert.deepEqual(getCapturedFollowing().responseSample, {
      kind: "following",
    });
    assert.equal(getCapturedActivity().operationName, "UserTweetsAndReplies");
    assert.deepEqual(getCapturedActivity().responseSample, { kind: "activity" });
  } finally {
    uninstallCapture();
    globalThis.fetch = original;
  }
});

test("routes XHR response samples to independent capture slots", () => {
  class FakeXhr {
    constructor() {
      this.listeners = {};
      this.responseText = "";
    }
    open(method, url) {
      this.method = method;
      this.url = url;
    }
    addEventListener(type, listener) {
      (this.listeners[type] ||= []).push(listener);
    }
    send(body) {
      this.body = body;
    }
    emit(type) {
      for (const listener of this.listeners[type] || []) {
        listener.call(this);
      }
    }
  }

  resetCapture();
  installCapture({ fetchImpl: null, xhrImpl: FakeXhr });
  try {
    const activityXhr = new FakeXhr();
    activityXhr.open(
      "GET",
      "https://x.com/i/api/graphql/q/UserTweetsAndReplies?variables=%7B%22userId%22%3A%2242%22%7D"
    );
    activityXhr.send();
    activityXhr.responseText = JSON.stringify({ kind: "activity" });
    activityXhr.emit("load");

    assert.equal(getCapturedFollowing(), null);
    assert.equal(getCapturedActivity().operationName, "UserTweetsAndReplies");
    assert.deepEqual(getCapturedActivity().responseSample, {
      kind: "activity",
    });

    const followingXhr = new FakeXhr();
    followingXhr.open(
      "GET",
      "https://x.com/i/api/graphql/abc/Following?variables=%7B%22userId%22%3A%221%22%7D&features=%7B%7D"
    );
    followingXhr.send();
    followingXhr.responseText = JSON.stringify({ kind: "following" });
    followingXhr.emit("load");

    assert.equal(getCapturedFollowing().operationName, "Following");
    assert.deepEqual(getCapturedFollowing().responseSample, {
      kind: "following",
    });
    assert.equal(getCapturedActivity().operationName, "UserTweetsAndReplies");
    assert.deepEqual(getCapturedActivity().responseSample, {
      kind: "activity",
    });
  } finally {
    uninstallCapture();
  }
});
