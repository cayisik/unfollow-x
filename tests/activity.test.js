import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  activityEntryFor,
  classifyActivity,
  isActivityFresh,
  parseLookupUsers,
  parseTwitterDate,
  parseUserTweetsPage,
} from "../src/activity.js";

const fixture = (name) =>
  JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), "utf8"));

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse("Fri Oct 30 12:00:00 +0000 2026");

test("parseTwitterDate accepts the X date format", () => {
  assert.equal(
    parseTwitterDate("Thu Oct 29 10:00:00 +0000 2026"),
    Date.parse("Thu Oct 29 10:00:00 +0000 2026")
  );
  assert.equal(parseTwitterDate("not a date"), null);
  assert.equal(parseTwitterDate(""), null);
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

test("parseLookupUsers normalizes known, never, and fallback records", () => {
  const parsed = parseLookupUsers(fixture("lookup.json"));
  assert.equal(parsed.byId.get("1").state, "known");
  assert.equal(
    parsed.byId.get("1").lastTweetAt,
    Date.parse("Thu Oct 29 10:00:00 +0000 2026")
  );
  assert.equal(parsed.byId.get("2").state, "known");
  assert.equal(parsed.byId.get("2").lastTweetAt, 0);
  assert.equal(parsed.byId.get("3").state, "fallback");
  assert.equal(parsed.byHandle.get("carol").state, "fallback");
});

test("parseLookupUsers accepts the users wrapper", () => {
  const parsed = parseLookupUsers({ users: fixture("lookup.json") });
  assert.equal(parsed.items.length, 3);
});

test("parseUserTweetsPage finds the newest relevant post", () => {
  const parsed = parseUserTweetsPage(fixture("user-tweets.json"), "1");
  assert.equal(parsed.state, "known");
  assert.equal(
    parsed.lastTweetAt,
    Date.parse("Thu Oct 30 09:00:00 +0000 2026")
  );
});

test("parseUserTweetsPage returns zero for an empty timeline", () => {
  const parsed = parseUserTweetsPage(fixture("user-tweets-empty.json"), "2");
  assert.equal(parsed.state, "known");
  assert.equal(parsed.lastTweetAt, 0);
});

test("parseUserTweetsPage marks unavailable users unknown", () => {
  const parsed = parseUserTweetsPage(
    { data: { user: { result: { __typename: "UserUnavailable", reason: "Suspended" } } } },
    "3"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.reason, "unavailable");
});

test("parseUserTweetsPage surfaces GraphQL rate limits", () => {
  const parsed = parseUserTweetsPage(
    { errors: [{ message: "Rate limit exceeded" }] },
    "1"
  );
  assert.equal(parsed.state, "unknown");
  assert.equal(parsed.fatalKind, "rate");
});
