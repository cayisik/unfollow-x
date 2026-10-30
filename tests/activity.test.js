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
