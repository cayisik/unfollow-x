import test from "node:test";
import assert from "node:assert/strict";
import {
  unfollowViaMutation,
  unfollowViaRest,
  evaluateRest,
  runUnfollowQueue,
} from "../src/unfollow.js";

const ctx = (fetchImpl, extra = {}) => ({
  csrf: "csrf",
  bearer: "bearer",
  handle: "me",
  fetchImpl,
  sleep: async () => {},
  now: () => 0,
  random: () => 0.5,
  ...extra,
});

test("mutation succeeds only on UnfollowSuccessResult", async () => {
  const ok = await unfollowViaMutation(
    { id: "1", handle: "a" },
    ctx(async () =>
      new Response(
        JSON.stringify({
          data: { unfollow_user: { __typename: "UnfollowSuccessResult" } },
        }),
        { status: 200 }
      )
    )
  );
  assert.equal(ok.ok, true);
  const bad = await unfollowViaMutation(
    { id: "1", handle: "a" },
    ctx(async () =>
      new Response(
        JSON.stringify({
          data: { unfollow_user: { __typename: "UnfollowFailureResult" } },
        }),
        { status: 200 }
      )
    )
  );
  assert.equal(bad.ok, false);
  assert.equal(bad.downgrade, true);
});

test("REST destroy accepts 200 with following false", async () => {
  const r = await unfollowViaRest(
    { id: "1", handle: "a" },
    ctx(async () =>
      new Response(JSON.stringify({ id_str: "1", following: false }), {
        status: 200,
      })
    )
  );
  assert.equal(r.ok, true);
  assert.equal(evaluateRest(200, { following: true }).ok, false);
  assert.equal(evaluateRest(400, {}).downgrade, true);
});

test("queue stops on rate limit and reports counts", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 2) {
      return new Response("{}", {
        status: 429,
        headers: { "x-rate-limit-reset": "9999999999" },
      });
    }
    return new Response(
      JSON.stringify({
        data: { unfollow_user: { __typename: "UnfollowSuccessResult" } },
      }),
      { status: 200 }
    );
  };
  const out = await runUnfollowQueue({
    targets: [
      { id: "1", handle: "a" },
      { id: "2", handle: "b" },
      { id: "3", handle: "c" },
    ],
    ctx: ctx(fetchImpl),
    max: 3,
  });
  assert.equal(out.ok, 1);
  assert.equal(out.stopped, "rate");
  assert.equal(calls, 2);
  assert.equal(out.remaining, 1);
});

test("queue downgrades mutation to REST and retries the same user", async () => {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    if (calls === 1) {
      return new Response(JSON.stringify({ errors: [{ message: "not found" }] }), {
        status: 404,
      });
    }
    return new Response(JSON.stringify({ id_str: "1", following: false }), {
      status: 200,
    });
  };
  const out = await runUnfollowQueue({
    targets: [{ id: "1", handle: "a" }],
    ctx: ctx(fetchImpl),
    max: 1,
  });
  assert.equal(out.ok, 1);
  assert.equal(out.transport, "rest");
  assert.equal(calls, 2);
});

test("queue uses REST directly when a user has no numeric id", async () => {
  const urls = [];
  const fetchImpl = async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ following: false }), { status: 200 });
  };
  const out = await runUnfollowQueue({
    targets: [{ id: "", handle: "a" }],
    ctx: ctx(fetchImpl),
    max: 1,
  });
  assert.equal(out.ok, 1);
  assert.equal(out.transport, "rest");
  assert.match(urls[0], /friendships\/destroy\.json/);
});

test("queue downgrades to UI and respects the cap", async () => {
  let uiCalls = 0;
  const fetchImpl = async () =>
    new Response(JSON.stringify({ errors: [{ message: "nope" }] }), {
      status: 404,
    });
  const out = await runUnfollowQueue({
    targets: [
      { id: "1", handle: "a" },
      { id: "2", handle: "b" },
      { id: "3", handle: "c" },
    ],
    ctx: ctx(fetchImpl, {
      uiUnfollow: async () => {
        uiCalls += 1;
        return { ok: true };
      },
    }),
    max: 2,
  });
  assert.equal(out.ok, 2);
  assert.equal(out.transport, "ui");
  assert.equal(uiCalls, 2);
  assert.equal(out.processed, 2);
});
