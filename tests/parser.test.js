import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  parseFollowingPage,
  buildFollowingRequest,
  buildDefaultTemplates,
  scanFollowing,
} from "../src/api.js";

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

test("parses the legacy response", () => {
  const p = parseFollowingPage(fixture("following-old.json"));
  assert.equal(p.users.length, 1);
  assert.equal(p.users[0].handle, "alice");
  assert.equal(p.users[0].followsViewer, false);
  assert.equal(p.nextCursor, "CURSOR-1");
  assert.equal(p.total, 2);
  assert.equal(p.sawFollowedBy, true);
});

test("parses the 2026 response", () => {
  const p = parseFollowingPage(fixture("following-new.json"));
  assert.equal(p.users.length, 1);
  assert.equal(p.users[0].handle, "alice");
  assert.equal(p.nextCursor, "CURSOR-1");
  assert.equal(p.total, 2);
  assert.equal(p.sawFollowedBy, true);
});

test("empty response is safe", () => {
  const p = parseFollowingPage(fixture("following-empty.json"));
  assert.deepEqual(p.users, []);
  assert.equal(p.nextCursor, null);
  assert.equal(p.total, null);
});

test("builds a GET url with overridden cursor and count", () => {
  const template = {
    url:
      "https://x.com/i/api/graphql/abc/Following?variables=%7B%22userId%22%3A%221%22%2C%22count%22%3A20%7D&features=%7B%22f%22%3Atrue%7D",
    method: "GET",
    headers: {},
    operationName: "Following",
    queryId: "abc",
    variables: { userId: "1", count: 20 },
  };
  const req = buildFollowingRequest(template, {
    handle: "me",
    userId: "1",
    cursor: "C2",
    count: 50,
    csrf: "token",
  });
  const u = new URL(req.url);
  assert.equal(u.pathname, "/i/api/graphql/abc/Following");
  assert.equal(JSON.parse(u.searchParams.get("variables")).count, 50);
  assert.equal(JSON.parse(u.searchParams.get("variables")).cursor, "C2");
  assert.equal(u.searchParams.get("features"), '{"f":true}');
  assert.equal(req.init.credentials, "include");
});

test("builds a POST body for followingQuery", () => {
  const template = {
    url: "https://x.com/i/api/graphql/q/followingQuery",
    method: "POST",
    headers: {},
    operationName: "followingQuery",
    queryId: "q",
    variables: { screenName: "me", count: 20 },
  };
  const req = buildFollowingRequest(template, {
    handle: "me",
    cursor: "",
    count: 50,
  });
  const body = JSON.parse(req.init.body);
  assert.equal(body.variables.screenName, "me");
  assert.equal(body.variables.count, 50);
  assert.equal(body.queryId, "q");
  assert.equal(body.variables.cursor, undefined);
});

test("fallback templates use the known ids", () => {
  const templates = buildDefaultTemplates({ handle: "me", userId: "42" });
  assert.equal(templates.length, 2);
  assert.equal(templates[0].operationName, "Following");
  assert.equal(templates[0].variables.userId, "42");
  assert.equal(templates[1].operationName, "followingQuery");
  assert.equal(templates[1].variables.screenName, "me");
});

function page(handle, cursor) {
  return {
    data: {
      user_result_by_screen_name: {
        result: {
          relationship_counts: { following: 2 },
          following_timeline: {
            timeline: {
              instructions: [
                {
                  type: "TimelineAddEntries",
                  entries: [
                    {
                      entryId: `user-${handle}`,
                      content: {
                        itemContent: {
                          user_results: {
                            result: {
                              rest_id: handle,
                              core: { screen_name: handle, name: handle },
                              relationship_perspectives: { followed_by: false },
                            },
                          },
                        },
                      },
                    },
                    ...(cursor
                      ? [
                          {
                            entryId: "cursor-bottom",
                            content: { cursorType: "Bottom", value: cursor },
                          },
                        ]
                      : []),
                  ],
                },
              ],
            },
          },
        },
      },
    },
  };
}

test("scan paginates and retries with the captured count", async () => {
  const calls = [];
  const template = {
    url: "https://x.com/i/api/graphql/q/followingQuery",
    method: "POST",
    headers: {},
    variables: { count: 20, screenName: "me" },
    queryId: "q",
    operationName: "followingQuery",
    body: JSON.stringify({
      variables: { count: 20, screenName: "me" },
      queryId: "q",
    }),
  };
  const fetchImpl = async (_url, init) => {
    const body = JSON.parse(init.body);
    calls.push(body.variables);
    if (calls.length === 1) {
      return new Response(JSON.stringify({ errors: [{ message: "bad" }] }), {
        status: 400,
      });
    }
    if (calls.length === 2) {
      return new Response(JSON.stringify(page("alice", "C1")), { status: 200 });
    }
    return new Response(JSON.stringify(page("bob", null)), { status: 200 });
  };
  const result = await scanFollowing({
    template,
    handle: "me",
    csrf: "csrf",
    fetchImpl,
    sleepFn: async () => {},
    timings: {
      usersPerRequest: 50,
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 0,
    },
  });
  assert.equal(calls[0].count, 50);
  assert.equal(calls[1].count, 20);
  assert.equal(calls[2].cursor, "C1");
  assert.equal(result.users.length, 2);
  assert.equal(result.pages, 2);
  assert.equal(result.sawFollowedBy, true);
  assert.equal(result.unverified, false);
});

test("a null seed total stays unknown instead of becoming zero", async () => {
  const template = {
    url: "https://x.com/i/api/graphql/q/followingQuery",
    method: "POST",
    headers: {},
    variables: { count: 20, screenName: "me" },
    queryId: "q",
    operationName: "followingQuery",
    body: JSON.stringify({
      variables: { count: 20, screenName: "me" },
      queryId: "q",
    }),
  };
  const payload = page("alice", null);
  delete payload.data.user_result_by_screen_name.result.relationship_counts;
  const result = await scanFollowing({
    template,
    handle: "me",
    csrf: "csrf",
    seedTotal: null,
    fetchImpl: async () =>
      new Response(JSON.stringify(payload), { status: 200 }),
    sleepFn: async () => {},
    timings: {
      usersPerRequest: 50,
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 0,
    },
  });
  assert.equal(result.total, null);
  assert.equal(result.users.length, 1);
  assert.equal(result.stopReason, "cursor");
});
