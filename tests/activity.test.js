import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  activityEntryFor,
  buildActivityRequest,
  buildDefaultActivityTemplate,
  buildLookupRequest,
  classifyActivity,
  isActivityFresh,
  parseLookupUsers,
  parseTwitterDate,
  parseUserTweetsPage,
} from "../src/activity.js";
import { ACTIVITY_QUERY_ID } from "../src/config.js";

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("Fri Oct 30 12:00:00 +0000 2026");

const tweet = (id, authorId, createdAt, legacy = {}) => ({
  __typename: "Tweet",
  rest_id: id,
  core: { user_results: { result: { rest_id: authorId } } },
  legacy: { created_at: createdAt, ...legacy },
});

const tweetEntry = (entryId, result) => ({
  entryId,
  content: { itemContent: { tweet_results: { result } } },
});

const timelinePage = (instructions) => ({
  data: {
    user: {
      result: {
        __typename: "User",
        rest_id: "1",
        timeline_v2: { timeline: { instructions } },
      },
    },
  },
});

const entriesInstruction = (entries) => [
  { type: "TimelineAddEntries", entries },
];

const authorPage = (authorId) =>
  timelinePage(
    entriesInstruction([
      tweetEntry(
        "tweet-1",
        tweet("100", String(authorId), "Thu Oct 29 10:00:00 +0000 2026")
      ),
    ])
  );

test("parseTwitterDate accepts the X date format", () => {
  assert.equal(
    parseTwitterDate("Thu Oct 29 10:00:00 +0000 2026"),
    1793268000000
  );
  assert.equal(parseTwitterDate("not a date"), null);
  assert.equal(parseTwitterDate(""), null);
});

test("parseTwitterDate accepts numeric seconds and milliseconds", () => {
  assert.equal(parseTwitterDate(1793268000), 1793268000000);
  assert.equal(parseTwitterDate("1793268000"), 1793268000000);
  assert.equal(parseTwitterDate(1793268000000), 1793268000000);
});

test("classifyActivity uses a strict window boundary", () => {
  assert.equal(classifyActivity({ state: "known", lastTweetAt: 0 }, 30, NOW), "inactive");
  assert.equal(
    classifyActivity({ state: "known", lastTweetAt: NOW - 30 * DAY }, 30, NOW),
    "inactive"
  );
  assert.equal(
    classifyActivity({ state: "known", lastTweetAt: NOW - 29 * DAY }, 30, NOW),
    "active"
  );
  assert.equal(classifyActivity({ state: "unknown" }, 30, NOW), "unknown");
  assert.equal(classifyActivity(null, 30, NOW), "unknown");
});

test("classifyActivity treats missing timestamps as unknown", () => {
  assert.equal(classifyActivity({ state: "known", lastTweetAt: null }, 30, NOW), "unknown");
  assert.equal(
    classifyActivity({ state: "known", lastTweetAt: undefined }, 30, NOW),
    "unknown"
  );
  assert.equal(classifyActivity({ state: "known", lastTweetAt: "" }, 30, NOW), "unknown");
});

test("isActivityFresh expires after 24 hours", () => {
  assert.equal(isActivityFresh({ checkedAt: NOW - 23 * 60 * 60 * 1000 }, NOW), true);
  assert.equal(isActivityFresh({ checkedAt: NOW - 25 * 60 * 60 * 1000 }, NOW), false);
  assert.equal(isActivityFresh(null, NOW), false);
});

test("activityEntryFor prefers id and falls back to handle", () => {
  const entries = {
    "1": { id: "1", handle: "alice", state: "known", lastTweetAt: 5 },
    bob: { handle: "bob", state: "known", lastTweetAt: 0 },
  };
  assert.equal(activityEntryFor(entries, { id: "1", handle: "alice" }).lastTweetAt, 5);
  assert.equal(activityEntryFor(entries, { handle: "BOB" }).lastTweetAt, 0);
  assert.equal(activityEntryFor(entries, { handle: "nobody" }), null);
});

test("activityEntryFor ignores inherited properties", () => {
  assert.equal(activityEntryFor({}, { id: "constructor" }), null);
  assert.equal(activityEntryFor({}, { handle: "toString" }), null);
});

test("parseLookupUsers normalizes known, never, and fallback records", () => {
  const parsed = parseLookupUsers(fixture("lookup.json"));
  assert.equal(parsed.byId.get("1").state, "known");
  assert.equal(parsed.byId.get("1").lastTweetAt, 1793268000000);
  assert.equal(parsed.byId.get("2").state, "known");
  assert.equal(parsed.byId.get("2").lastTweetAt, 0);
  assert.equal(parsed.byId.get("3").state, "fallback");
  assert.equal(parsed.byHandle.get("carol").state, "fallback");
});

test("parseLookupUsers treats nullable counts as fallback", () => {
  for (const statusesCount of [null, undefined, ""]) {
    const parsed = parseLookupUsers([
      { id_str: "9", screen_name: "dave", statuses_count: statusesCount },
    ]);
    assert.equal(parsed.byId.get("9").state, "fallback");
    assert.equal(parsed.byId.get("9").lastTweetAt, null);
  }
});

test("parseLookupUsers accepts the users wrapper", () => {
  const parsed = parseLookupUsers({ users: fixture("lookup.json") });
  assert.equal(parsed.items.length, 3);
});

test("parseLookupUsers prefers a valid status over a zero count", () => {
  const parsed = parseLookupUsers([
    {
      id_str: "10",
      screen_name: "erin",
      statuses_count: 0,
      status: { created_at: "Thu Oct 29 10:00:00 +0000 2026" },
    },
  ]);
  assert.equal(parsed.byId.get("10").state, "known");
  assert.equal(parsed.byId.get("10").lastTweetAt, 1793268000000);
});

test("parseUserTweetsPage finds the newest relevant post", () => {
  const parsed = parseUserTweetsPage(fixture("user-tweets.json"), "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 1793350800000);
});

test("parseUserTweetsPage returns zero for an empty timeline", () => {
  const parsed = parseUserTweetsPage(fixture("user-tweets-empty.json"), "2");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 0);
});

test("parseUserTweetsPage reads pinned entries", () => {
  const json = timelinePage([
    {
      type: "TimelinePinEntry",
      entry: tweetEntry(
        "profile-grid-0-tweet-300",
        tweet("300", "1", "Tue Oct 27 08:00:00 +0000 2026")
      ),
    },
  ]);
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 1793088000000);
});

test("parseUserTweetsPage reads module items", () => {
  const json = timelinePage([
    {
      type: "TimelineAddToModule",
      moduleItems: [
        {
          entryId: "module-0",
          item: {
            itemContent: {
              tweet_results: {
                result: tweet("301", "1", "Tue Oct 27 08:00:00 +0000 2026"),
              },
            },
          },
        },
      ],
    },
  ]);
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 1793088000000);
});

test("parseUserTweetsPage unwraps TweetWithVisibilityResults", () => {
  const json = timelinePage(
    entriesInstruction([
      tweetEntry("tweet-1", {
        __typename: "TweetWithVisibilityResults",
        tweet: tweet("302", "1", "Tue Oct 27 08:00:00 +0000 2026"),
      }),
    ])
  );
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 1793088000000);
});

test("parseUserTweetsPage rejects non-cursor entries without tweets", () => {
  const json = timelinePage(
    entriesInstruction([
      {
        entryId: "who-to-follow-0",
        content: { itemContent: { __typename: "TimelineUser" } },
      },
    ])
  );
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.reason, "parse");
});

test("parseUserTweetsPage treats cursor-only pages as empty", () => {
  const json = timelinePage(
    entriesInstruction([
      {
        entryId: "cursor-bottom-1",
        content: {
          entryType: "TimelineTimelineCursor",
          cursorType: "Bottom",
          value: "abc",
        },
      },
    ])
  );
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 0);
});

test("parseUserTweetsPage ignores foreign-author non-retweets", () => {
  const json = timelinePage(
    entriesInstruction([
      tweetEntry(
        "tweet-1",
        tweet("200", "999", "Thu Oct 30 11:00:00 +0000 2026")
      ),
      tweetEntry(
        "tweet-2",
        tweet("201", "1", "Wed Oct 28 10:00:00 +0000 2026")
      ),
    ])
  );
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 1793181600000);
});

test("parseUserTweetsPage ignores foreign-author retweets", () => {
  const json = timelinePage(
    entriesInstruction([
      tweetEntry(
        "tweet-1",
        tweet("200", "999", "Thu Oct 30 11:00:00 +0000 2026", {
          retweeted_status_result: { result: { rest_id: "50" } },
        })
      ),
      tweetEntry(
        "tweet-2",
        tweet("201", "1", "Wed Oct 28 10:00:00 +0000 2026")
      ),
    ])
  );
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 1793181600000);
});

test("parseUserTweetsPage marks unavailable users unknown", () => {
  const parsed = parseUserTweetsPage(
    { data: { user: { result: { __typename: "UserUnavailable", reason: "Suspended" } } } },
    "3"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.reason, "unavailable");
});

test("parseUserTweetsPage keeps protected-account errors non-fatal", () => {
  const parsed = parseUserTweetsPage(
    { errors: [{ message: "You're not authorized to view this user's Tweets." }] },
    "1"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.reason, "unavailable");
  assert.equal(parsed.fatalKind, undefined);
});

test("parseUserTweetsPage classifies authentication failures", () => {
  const parsed = parseUserTweetsPage(
    { errors: [{ message: "Could not authenticate you." }] },
    "1"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.fatalKind, "auth");
});

test("parseUserTweetsPage surfaces GraphQL rate limits", () => {
  const parsed = parseUserTweetsPage(
    { errors: [{ message: "Rate limit exceeded" }] },
    "1"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.fatalKind, "rate");
});

test("parseUserTweetsPage preserves unknown GraphQL errors", () => {
  const parsed = parseUserTweetsPage(
    { errors: [{ message: "Something went wrong" }] },
    "1"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.reason, "Something went wrong");
  assert.equal(parsed.fatalKind, undefined);
});

test("parseUserTweetsPage flags template errors", () => {
  const parsed = parseUserTweetsPage(
    { errors: [{ message: "Unknown queryId" }] },
    "1"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.reason, "Unknown queryId");
  assert.equal(parsed.fatalKind, "template");
});

test("parseUserTweetsPage parses data alongside non-fatal errors", () => {
  const json = fixture("user-tweets.json");
  json.errors = [{ message: "Something went wrong" }];
  const parsed = parseUserTweetsPage(json, "1");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 1793350800000);
});

test("parseUserTweetsPage does not over-match generic retry or spam text", () => {
  const retry = parseUserTweetsPage(
    { errors: [{ message: "Please try again later" }] },
    "1"
  );
  assert.equal(retry.fatalKind, undefined);
  const spam = parseUserTweetsPage(
    { errors: [{ message: "Spam is not allowed" }] },
    "1"
  );
  assert.equal(spam.fatalKind, undefined);
});

test("buildLookupRequest batches by user id", () => {
  const request = buildLookupRequest({
    userIds: ["1", "2"],
    csrf: "token",
    origin: "https://x.com",
  });
  const url = new URL(request.url);
  assert.equal(url.pathname, "/i/api/1.1/users/lookup.json");
  assert.equal(url.searchParams.get("user_id"), "1,2");
  assert.equal(url.searchParams.get("include_entities"), "true");
  assert.equal(request.init.headers["x-csrf-token"], "token");
  assert.equal(request.init.credentials, "include");
});

test("buildLookupRequest batches by screen name", () => {
  const request = buildLookupRequest({
    screenNames: ["alice", "bob"],
    origin: "https://x.com",
  });
  const url = new URL(request.url);
  assert.equal(url.searchParams.get("screen_name"), "alice,bob");
});

test("buildActivityRequest fills GET variables", () => {
  const template = buildDefaultActivityTemplate();
  const request = buildActivityRequest(template, {
    userId: "42",
    csrf: "token",
    origin: "https://x.com",
  });
  const url = new URL(request.url);
  const variables = JSON.parse(url.searchParams.get("variables"));
  assert.equal(url.pathname, `/i/api/graphql/${ACTIVITY_QUERY_ID}/UserTweetsAndReplies`);
  assert.equal(variables.userId, "42");
  assert.equal(variables.count, 20);
  assert.equal(variables.includePromotedContent, false);
  assert.equal(request.init.headers["x-csrf-token"], "token");
});

test("buildActivityRequest preserves a POST template", () => {
  const template = {
    url: "https://x.com/i/api/graphql/q/UserTweetsAndReplies",
    method: "POST",
    headers: {},
    body: JSON.stringify({
      variables: { userId: "old", count: 20 },
      queryId: "q",
      features: { f: true },
    }),
    variables: { userId: "old", count: 20 },
    features: { f: true },
    fieldToggles: null,
    queryId: "q",
    operationName: "UserTweetsAndReplies",
  };
  const request = buildActivityRequest(template, { userId: "7", csrf: "t" });
  const body = JSON.parse(request.init.body);
  assert.equal(request.init.method, "POST");
  assert.equal(body.variables.userId, "7");
  assert.equal(body.queryId, "q");
  assert.equal(body.features.f, true);
});

test("buildLookupRequest requires a selector", () => {
  assert.throws(
    () => buildLookupRequest({}),
    (error) =>
      error.kind === "format" &&
      /user_id or screen_name/.test(error.message)
  );
});

test("buildLookupRequest rejects mixed selector types", () => {
  assert.throws(
    () => buildLookupRequest({ userIds: ["1"], screenNames: ["alice"] }),
    (error) =>
      error.kind === "format" && /one selector type/.test(error.message)
  );
});

test("buildLookupRequest normalizes screen names", () => {
  const request = buildLookupRequest({
    screenNames: ["@alice", " bob ", ""],
    origin: "https://x.com",
  });
  const url = new URL(request.url);
  assert.equal(url.searchParams.get("screen_name"), "alice,bob");
  assert.equal(url.searchParams.get("user_id"), null);
});

test("buildActivityRequest drops a stale cursor from GET variables", () => {
  const template = buildDefaultActivityTemplate();
  template.variables.cursor = "stale";
  const request = buildActivityRequest(template, { userId: "9" });
  const url = new URL(request.url);
  const variables = JSON.parse(url.searchParams.get("variables"));
  assert.equal(Object.hasOwn(variables, "cursor"), false);
});

test("buildActivityRequest overrides count and forwards the transaction id", () => {
  const template = {
    ...buildDefaultActivityTemplate(),
    headers: { "x-client-transaction-id": "txn-123" },
  };
  const request = buildActivityRequest(template, {
    userId: "9",
    count: 7,
    csrf: "t",
  });
  const url = new URL(request.url);
  const variables = JSON.parse(url.searchParams.get("variables"));
  assert.equal(variables.count, 7);
  assert.equal(request.init.headers["x-client-transaction-id"], "txn-123");
});

test("buildActivityRequest sets JSON content type for POST templates", () => {
  const template = {
    url: "https://x.com/i/api/graphql/q/UserTweetsAndReplies",
    method: "POST",
    headers: { "x-client-transaction-id": "txn-456" },
    body: JSON.stringify({
      variables: { userId: "old", count: 20 },
      queryId: "q",
      features: { f: true },
    }),
    variables: { userId: "old", count: 20 },
    features: { f: true },
    fieldToggles: null,
    queryId: "q",
    operationName: "UserTweetsAndReplies",
  };
  const request = buildActivityRequest(template, { userId: "7", csrf: "t" });
  assert.equal(request.init.method, "POST");
  assert.equal(request.init.headers["content-type"], "application/json");
  assert.equal(request.init.headers["x-client-transaction-id"], "txn-456");
});

import { runActivityScan } from "../src/activity.js";

function makeUser(id, handle, followsViewer = false) {
  return { id: String(id), handle, name: handle, followsViewer };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function lookupPayload(ids) {
  return ids.map((id) => ({
    id_str: id,
    screen_name: `u${id}`,
    statuses_count: id === "3" ? 0 : 4,
    status:
      id === "2"
        ? { created_at: "Wed Jan 01 10:00:00 +0000 2025" }
        : id === "3"
          ? undefined
          : { created_at: "Thu Oct 29 10:00:00 +0000 2026" },
  }));
}

test("runActivityScan checks 10 at a time and classifies results", async () => {
  const calls = [];
  const users = Array.from({ length: 25 }, (_, index) =>
    makeUser(index + 1, `u${index + 1}`)
  );
  const fetchImpl = async (url) => {
    const parsed = new URL(url);
    const ids = (parsed.searchParams.get("user_id") || "").split(",").filter(Boolean);
    calls.push(ids);
    return jsonResponse(lookupPayload(ids));
  };
  const results = [];
  const output = await runActivityScan({
    users,
    fetchImpl,
    sleepFn: async () => {},
    timings: {
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    },
    now: NOW,
    onResult: (user, entry) => results.push({ user, entry }),
  });
  assert.deepEqual(
    calls.map((batch) => batch.length),
    [10, 10, 5]
  );
  assert.equal(output.checked, 25);
  assert.equal(results.length, 25);
  assert.equal(results[0].entry.source, "lookup");
  assert.equal(output.inactive, 2);
});

test("runActivityScan falls back to GraphQL when lookup is unsupported", async () => {
  const users = [makeUser(1, "alice")];
  const fetchImpl = async (url) => {
    if (String(url).includes("users/lookup")) {
      return jsonResponse({ errors: [{ message: "not found" }] }, 404);
    }
    return jsonResponse(fixture("user-tweets.json"));
  };
  const progress = [];
  const output = await runActivityScan({
    users,
    fetchImpl,
    template: buildDefaultActivityTemplate(),
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onProgress: (event) => progress.push(event),
  });
  assert.equal(output.source, "graphql");
  assert.equal(output.checked, 1);
  assert.equal(output.inactive, 0);
  assert.ok(progress.some((event) => event.kind === "fallback"));
});

test("runActivityScan stops on rate limits and keeps partial results", async () => {
  const users = Array.from({ length: 20 }, (_, index) =>
    makeUser(index + 1, `u${index + 1}`)
  );
  let calls = 0;
  const fetchImpl = async (url) => {
    calls += 1;
    if (calls > 1) return jsonResponse({ errors: [{ message: "Rate limit" }] }, 429);
    const ids = (new URL(url).searchParams.get("user_id") || "").split(",");
    return jsonResponse(lookupPayload(ids));
  };
  let checked = 0;
  await assert.rejects(
    runActivityScan({
      users,
      fetchImpl,
      sleepFn: async () => {},
      timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
      now: NOW,
      onResult: () => {
        checked += 1;
      },
    }),
    (error) => error.kind === "rate"
  );
  assert.equal(checked, 10);
});

test("runActivityScan skips fresh cache entries", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  const cache = {
    "1": { id: "1", handle: "alice", state: "known", lastTweetAt: NOW - 1000, checkedAt: NOW },
    "2": { id: "2", handle: "bob", state: "known", lastTweetAt: NOW - 1000, checkedAt: NOW },
  };
  let called = false;
  const output = await runActivityScan({
    users,
    cache,
    now: NOW,
    fetchImpl: async () => {
      called = true;
      return jsonResponse([]);
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
  });
  assert.equal(called, false);
  assert.equal(output.checked, 0);
});

test("runActivityScan can be cancelled", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  let cancelled = false;
  await assert.rejects(
    runActivityScan({
      users,
      lookup: false,
      template: buildDefaultActivityTemplate(),
      fetchImpl: async () => jsonResponse(fixture("user-tweets.json")),
      sleepFn: async () => {},
      timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
      now: NOW,
      shouldCancel: () => cancelled,
      onResult: () => {
        cancelled = true;
      },
    }),
    (error) => error.kind === "aborted"
  );
});

test("runActivityScan falls back when the lookup selector is invalid", async () => {
  const users = [{ handle: " ", name: "space", followsViewer: false }];
  const output = await runActivityScan({
    users,
    fetchImpl: async () => {
      throw new Error("should not fetch");
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
  });
  assert.equal(output.source, "graphql");
  assert.equal(output.checked, 1);
  assert.equal(output.unknown, 1);
});

test("runActivityScan marks remaining accounts unknown when the GraphQL template is broken", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  const progress = [];
  const output = await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () =>
      jsonResponse({ errors: [{ message: "Unknown queryId" }] }),
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onProgress: (event) => progress.push(event),
  });
  assert.equal(output.checked, 2);
  assert.equal(output.unknown, 2);
  assert.equal(output.inactive, 0);
  assert.ok(progress.some((event) => event.kind === "template-broken"));
});

test("runActivityScan paces before requests and skips the first delay", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  const sleeps = [];
  const output = await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => jsonResponse(fixture("user-tweets.json")),
    sleepFn: async (ms) => {
      sleeps.push(ms);
    },
    timings: {
      scanDelayMin: 100,
      scanDelayMax: 100,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    },
    now: NOW,
  });
  assert.deepEqual(sleeps, [100]);
  assert.equal(output.checked, 2);
});

test("runActivityScan observes a pause that starts during a delay", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  const events = [];
  let paused = false;
  const output = await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      events.push("fetch");
      return jsonResponse(fixture("user-tweets.json"));
    },
    sleepFn: async (ms) => {
      events.push(`sleep:${ms}`);
      if (ms === 100) paused = true;
      if (ms === 250) paused = false;
    },
    shouldPause: () => paused,
    timings: {
      scanDelayMin: 100,
      scanDelayMax: 100,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    },
    now: NOW,
  });
  assert.deepEqual(events, ["fetch", "sleep:100", "sleep:250", "fetch"]);
  assert.equal(output.checked, 2);
});

test("runActivityScan pauses once before the request after the page threshold", async () => {
  const users = Array.from({ length: 11 }, (_, index) =>
    makeUser(index + 1, `u${index + 1}`)
  );
  const events = [];
  await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      events.push("fetch");
      return jsonResponse(fixture("user-tweets.json"));
    },
    sleepFn: async (ms) => {
      events.push(`sleep:${ms}`);
    },
    timings: {
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 10,
      scanPauseMs: 500,
    },
    now: NOW,
  });
  assert.equal(events.filter((event) => event === "sleep:500").length, 1);
  assert.deepEqual(events.slice(9, 12), ["fetch", "sleep:500", "fetch"]);
});

test("runActivityScan resolves a handle-only fallback to an id for GraphQL", async () => {
  const user = { handle: "@alice", name: "alice", followsViewer: false };
  const calls = [];
  const results = [];
  const output = await runActivityScan({
    users: [user],
    fetchImpl: async (url) => {
      calls.push(String(url));
      if (String(url).includes("users/lookup")) {
        return jsonResponse([
          { id_str: "42", screen_name: "alice", statuses_count: 7 },
        ]);
      }
      return jsonResponse(authorPage(42));
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onResult: (scanned, entry) => results.push({ scanned, entry }),
  });
  assert.equal(user.id, "42");
  assert.equal(calls.length, 2);
  assert.equal(results.length, 1);
  assert.equal(results[0].entry.state, "known");
  assert.equal(results[0].entry.id, "42");
  assert.equal(results[0].entry.source, "graphql");
  const graphqlUrl = new URL(calls[1]);
  const variables = JSON.parse(graphqlUrl.searchParams.get("variables"));
  assert.equal(variables.userId, "42");
  assert.equal(output.checked, 1);
});

test("runActivityScan keeps scanning after a per-user GraphQL 404", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  let calls = 0;
  const progress = [];
  const results = [];
  const output = await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ errors: [{ message: "Could not find user" }] }, 404);
      }
      return jsonResponse(authorPage(2));
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onProgress: (event) => progress.push(event),
    onResult: (user, entry) => results.push(entry),
  });
  assert.equal(calls, 2);
  assert.equal(results[0].state, "unknown");
  assert.equal(results[0].reason, "unavailable");
  assert.equal(results[1].state, "known");
  assert.equal(progress.some((event) => event.kind === "template-broken"), false);
  assert.equal(output.stopped, "done");
  assert.equal(output.checked, 2);
});

test("runActivityScan reports a template break as a template stop", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob"), makeUser(3, "carol")];
  let calls = 0;
  const progress = [];
  const results = [];
  const output = await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse({ errors: [{ message: "Unknown queryId" }] });
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onProgress: (event) => progress.push(event),
    onResult: (user, entry) => results.push(entry),
  });
  assert.equal(calls, 1);
  assert.equal(progress.filter((event) => event.kind === "template-broken").length, 1);
  assert.equal(output.stopped, "template");
  assert.equal(output.checked, 3);
  assert.equal(output.unknown, 3);
  assert.ok(results.every((entry) => entry.reason === "template"));
});

test("runActivityScan rechecks fresh cache entries marked template", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  const cache = {
    "1": { id: "1", handle: "alice", state: "unknown", reason: "template", checkedAt: NOW },
    "2": { id: "2", handle: "bob", state: "known", lastTweetAt: NOW - 1000, checkedAt: NOW },
  };
  let calls = 0;
  const output = await runActivityScan({
    users,
    cache,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(fixture("user-tweets.json"));
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
  });
  assert.equal(calls, 1);
  assert.equal(output.checked, 1);
});

test("runActivityScan rechecks fresh unknown entries but skips known ones", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  const cache = {
    "1": { id: "1", handle: "alice", state: "unknown", reason: "unavailable", checkedAt: NOW },
    "2": { id: "2", handle: "bob", state: "known", lastTweetAt: NOW - 1000, checkedAt: NOW },
  };
  let calls = 0;
  const output = await runActivityScan({
    users,
    cache,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      calls += 1;
      return jsonResponse(fixture("user-tweets.json"));
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
  });
  assert.equal(calls, 1);
  assert.equal(output.checked, 1);
});

test("runActivityScan deduplicates users before checking", async () => {
  const users = [makeUser(1, "alice"), makeUser(1, "alice"), makeUser(1, "alice")];
  const calls = [];
  const results = [];
  const output = await runActivityScan({
    users,
    fetchImpl: async (url) => {
      calls.push(String(url));
      const ids = (new URL(url).searchParams.get("user_id") || "")
        .split(",")
        .filter(Boolean);
      return jsonResponse(lookupPayload(ids));
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onResult: (user, entry) => results.push(entry),
  });
  assert.equal(calls.length, 1);
  assert.equal(new URL(calls[0]).searchParams.get("user_id"), "1");
  assert.equal(output.checked, 1);
  assert.equal(results.length, 1);
});

test("runActivityScan keeps scanning after a suspended-user 403", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  let calls = 0;
  const results = [];
  const output = await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse(
          { errors: [{ message: "User has been suspended" }] },
          403
        );
      }
      return jsonResponse(authorPage(2));
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onResult: (user, entry) => results.push(entry),
  });
  assert.equal(calls, 2);
  assert.equal(results[0].state, "unknown");
  assert.equal(results[0].reason, "unavailable");
  assert.equal(results[1].state, "known");
  assert.equal(output.checked, 2);
  assert.equal(output.stopped, "done");
});

test("runActivityScan keeps scanning after a per-user 401", async () => {
  const users = [makeUser(1, "alice"), makeUser(2, "bob")];
  let calls = 0;
  const results = [];
  const output = await runActivityScan({
    users,
    lookup: false,
    template: buildDefaultActivityTemplate(),
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse(
          {
            errors: [
              { message: "You are not authorized to view this user" },
            ],
          },
          401
        );
      }
      return jsonResponse(authorPage(2));
    },
    sleepFn: async () => {},
    timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
    now: NOW,
    onResult: (user, entry) => results.push(entry),
  });
  assert.equal(calls, 2);
  assert.equal(results[0].state, "unknown");
  assert.equal(results[0].reason, "unavailable");
  assert.equal(results[1].state, "known");
  assert.equal(output.checked, 2);
  assert.equal(output.stopped, "done");
});

test("runActivityScan still rejects genuine authentication failures", async () => {
  await assert.rejects(
    runActivityScan({
      users: [makeUser(1, "alice")],
      lookup: false,
      template: buildDefaultActivityTemplate(),
      fetchImpl: async () =>
        jsonResponse(
          { errors: [{ message: "Could not authenticate you" }] },
          401
        ),
      sleepFn: async () => {},
      timings: { scanDelayMin: 0, scanDelayMax: 0, scanPauseEveryPages: 0, scanPauseMs: 0 },
      now: NOW,
    }),
    (error) => error.kind === "auth"
  );
});

test("runActivityScan paces between lookup batches without a final delay", async () => {
  const users = Array.from({ length: 25 }, (_, index) =>
    makeUser(index + 1, `u${index + 1}`)
  );
  const sleeps = [];
  await runActivityScan({
    users,
    fetchImpl: async (url) => {
      const ids = (new URL(url).searchParams.get("user_id") || "")
        .split(",")
        .filter(Boolean);
      return jsonResponse(lookupPayload(ids));
    },
    sleepFn: async (ms) => {
      sleeps.push(ms);
    },
    timings: {
      scanDelayMin: 100,
      scanDelayMax: 100,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    },
    now: NOW,
  });
  assert.deepEqual(sleeps, [100, 100]);
});
