import test from "node:test";
import assert from "node:assert/strict";
import { runActivityScan } from "../src/activity.js";
import {
  buildFeatureValues,
  computeAnimationKey,
  createRuntimeClient,
  generateTransactionId,
  parseHomeShell,
  parseOndemandIndices,
  parseOperationDefinition,
} from "../src/runtime.js";

const KEY = Buffer.from(
  Array.from({ length: 48 }, (_, index) => (index * 7 + 11) % 256)
).toString("base64");

const ANIMATION_PATH =
  "M 10,30 C 140,151 123,188 44,229 h 223 s 230,198 225,7 C 45,14 53,236 160,84 h 250 s 49,113 236,193 C 76,141 104,207 243,20 h 218 s 81,214 52,162 C 82,110 51,112 151,189 h 205 s 186,104 72,35 C 99,230 102,246 129,129 h 91 s 144,39 146,9 C 240,141 80,108 251,72 h 156 s 242,79 150,6 C 127,118 40,133 116,119 h 194 s 238,27 179,21 C 196,220 159,151 1,128 h 197 s 236,144 97,233 C 187,215 246,107 225,19 h 27 s 222,64 201,232 C 88,114 229,234 121,242 h 94 s 172,90 181,90 C 56,152 168,27 185,99 h 229 s 30,67 199,214 C 186,80 204,249 45,220 h 160 s 145,248 52,251 C 105,41 145,36 123,30 h 237 s 174,108 209,51 C 44,71 80,158 169,184";

const LOGO_PATH = "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17z";

function homeShell() {
  const frames = [0, 1, 2, 3]
    .map(
      (index) =>
        `<svg viewBox="0 0 24 24" id="loading-x-anim-${index}"><g><path d="${LOGO_PATH}"></path><path d="${ANIMATION_PATH}"></path></g></svg>`
    )
    .join("");
  return (
    `<meta name="twitter-site-verification" content="${KEY}"/>` +
    frames +
    `<script>var a={59924:"ondemand.s"},b={59924:"0beeef119c51fade"};</script>` +
    `<script defer src="https://abs.twimg.com/responsive-web/client-web/main.b7d082c8ad0126eba.js"></script>`
  );
}

const ONDEMAND = "function a(n){return (n[17],16)+(n[26],16)+(n[30],16)+(n[27],16)}";

const MAIN = `e.exports={queryId:"live-id",operationName:"UserTweetsAndReplies",operationType:"query",
metadata:{featureSwitches:["rweb_video_screen_enabled","responsive_web_edit_tweet_api_enabled"],
fieldToggles:["withArticlePlainText","withAuxiliaryUserLabels"]}}`;

test("parseHomeShell extracts the key, animation frames, and ondemand url", () => {
  const parsed = parseHomeShell(homeShell());
  assert.equal(parsed.key, KEY);
  assert.equal(parsed.frames.length, 4);
  assert.ok(parsed.frames.every((frame) => frame.startsWith("M 10,30")));
  assert.equal(
    parsed.ondemandUrl,
    "https://abs.twimg.com/responsive-web/client-web/ondemand.s.0beeef119c51fadea.js"
  );
  assert.equal(parseHomeShell("<html></html>"), null);
});

test("parseOndemandIndices reads the byte indices", () => {
  assert.deepEqual(parseOndemandIndices(ONDEMAND), [17, 26, 30, 27]);
  assert.deepEqual(parseOndemandIndices("nothing here"), []);
});

test("parseOperationDefinition resolves the live query id and switches", () => {
  const definition = parseOperationDefinition(MAIN, "UserTweetsAndReplies");
  assert.equal(definition.queryId, "live-id");
  assert.deepEqual(definition.featureSwitches, [
    "rweb_video_screen_enabled",
    "responsive_web_edit_tweet_api_enabled",
  ]);
  assert.deepEqual(definition.fieldToggles, [
    "withArticlePlainText",
    "withAuxiliaryUserLabels",
  ]);
  assert.equal(parseOperationDefinition(MAIN, "Following"), null);
});

test("parseOperationDefinition tolerates a different key order", () => {
  const shuffled =
    `operationName:"Following",operationType:"query",queryId:"next-id",` +
    `metadata:{featureSwitches:["a"],fieldToggles:[]}}`;
  const definition = parseOperationDefinition(shuffled, "Following");
  assert.equal(definition.queryId, "next-id");
  assert.deepEqual(definition.featureSwitches, ["a"]);
  assert.deepEqual(definition.fieldToggles, []);
});

test("buildFeatureValues keeps known defaults and fills new switches", () => {
  const values = buildFeatureValues([
    "responsive_web_edit_tweet_api_enabled",
    "brand_new_switch_enabled",
  ]);
  assert.equal(values.responsive_web_edit_tweet_api_enabled, true);
  assert.equal(values.brand_new_switch_enabled, false);
});

test("computeAnimationKey is stable for the same shell", () => {
  const parsed = parseHomeShell(homeShell());
  const indices = parseOndemandIndices(ONDEMAND);
  const first = computeAnimationKey({
    key: parsed.key,
    frames: parsed.frames,
    indices,
  });
  const second = computeAnimationKey({
    key: parsed.key,
    frames: parsed.frames,
    indices,
  });
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f]{40,}$/);
});

test("generateTransactionId encodes the key, timestamp, and hash marker", async () => {
  const keyBytes = Array.from(Buffer.from(KEY, "base64"));
  const time = 1_700_000_000_000;
  const id = await generateTransactionId({
    key: KEY,
    animationKey: "abcdef0123456789",
    method: "GET",
    path: "/i/api/graphql/x/UserTweetsAndReplies",
    time,
    random: () => 0.5,
  });
  assert.match(id, /^[A-Za-z0-9+/]+$/);
  const bytes = Array.from(Buffer.from(id, "base64"));
  const noise = bytes[0];
  assert.equal(noise, 128);
  assert.deepEqual(
    bytes.slice(1, 49).map((byte) => byte ^ noise),
    keyBytes
  );
  const seconds = Math.floor((time - 1682924400000) / 1000);
  assert.deepEqual(bytes.slice(49, 53).map((byte) => byte ^ noise), [
    seconds & 0xff,
    (seconds >> 8) & 0xff,
    (seconds >> 16) & 0xff,
    (seconds >> 24) & 0xff,
  ]);
  assert.equal(bytes[bytes.length - 1] ^ noise, 3);
});

test("createRuntimeClient resolves operations and transaction ids", async () => {
  const calls = [];
  const responses = new Map([
    ["https://x.com/i/jf/", homeShell()],
    [
      "https://abs.twimg.com/responsive-web/client-web/ondemand.s.0beeef119c51fadea.js",
      ONDEMAND,
    ],
    [
      "https://abs.twimg.com/responsive-web/client-web/main.b7d082c8ad0126eba.js",
      MAIN,
    ],
  ]);
  const client = createRuntimeClient({
    origin: "https://x.com",
    now: () => 1_700_000_000_000,
    fetchImpl: async (url) => {
      calls.push(url);
      const text = responses.get(url);
      if (text === undefined) {
        return { ok: false, status: 404, text: async () => "" };
      }
      return { ok: true, status: 200, text: async () => text };
    },
  });

  const operation = await client.getOperation("UserTweetsAndReplies");
  assert.equal(operation.queryId, "live-id");
  assert.equal(operation.features.rweb_video_screen_enabled, true);
  assert.equal(operation.fieldToggles.withArticlePlainText, false);

  const first = await client.getTransactionId("GET", "/a");
  const second = await client.getTransactionId("GET", "/a");
  assert.equal(first.length, 94);
  assert.equal(second.length, 94);
  assert.equal(new Set(calls).size, 3);
});

test("createRuntimeClient reports unresolved operations", async () => {
  const client = createRuntimeClient({
    origin: "https://x.com",
    fetchImpl: async (url) => {
      if (url.endsWith("/i/jf/")) {
        return { ok: true, text: async () => homeShell() };
      }
      if (url.endsWith("main.b7d082c8ad0126eba.js")) {
        return { ok: true, text: async () => MAIN };
      }
      return { ok: true, text: async () => ONDEMAND };
    },
  });
  await assert.rejects(client.getOperation("Following"));
});

test("runtime client feeds the activity scan a live template and transaction id", async () => {
  const now = () => Date.parse("Fri Oct 30 12:00:00 +0000 2026");
  const fetchImpl = async (url) => {
    const value = String(url);
    if (value.endsWith("/i/jf/")) {
      return { ok: true, status: 200, text: async () => homeShell() };
    }
    if (value.includes("ondemand.s.")) {
      return { ok: true, status: 200, text: async () => ONDEMAND };
    }
    if (value.includes("main.b7d082c8ad0126eba.js")) {
      return { ok: true, status: 200, text: async () => MAIN };
    }
    throw new Error(`unexpected fetch ${value}`);
  };
  const client = createRuntimeClient({ origin: "https://x.com", now, fetchImpl });
  const operation = await client.getOperation("UserTweetsAndReplies");
  const headers = [];
  const page = {
    data: {
      user: {
        result: {
          __typename: "User",
          timeline: {
            timeline: {
              instructions: [
                {
                  entries: [
                    {
                      entryId: "tweet-1",
                      content: {
                        itemContent: {
                          tweet_results: {
                            result: {
                              __typename: "Tweet",
                              rest_id: "1",
                              core: { user_results: { result: { rest_id: "1" } } },
                              legacy: { created_at: "Wed Oct 28 12:00:00 +0000 2026" },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
  };
  const output = await runActivityScan({
    users: [{ id: "1", handle: "alice", followsViewer: false }],
    lookup: false,
    templates: [
      {
        url: `https://x.com/i/api/graphql/${operation.queryId}/UserTweetsAndReplies`,
        method: "GET",
        headers: {},
        body: "",
        variables: {},
        features: operation.features,
        fieldToggles: operation.fieldToggles,
        queryId: operation.queryId,
        operationName: "UserTweetsAndReplies",
      },
    ],
    csrf: "token",
    origin: "https://x.com",
    fetchImpl: async (url, init) => {
      headers.push(init.headers);
      return {
        ok: true,
        status: 200,
        headers: { get: () => null },
        text: async () => JSON.stringify(page),
      };
    },
    transactionProvider: (method, path) =>
      client.getTransactionId(method, path),
    sleepFn: async () => {},
    timings: {
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    },
    now,
  });
  assert.equal(output.checked, 1);
  assert.equal(output.unknown, 0);
  assert.equal(output.inactive, 0);
  assert.equal(headers.length, 1);
  assert.equal(headers[0]["x-client-transaction-id"].length, 94);
});
