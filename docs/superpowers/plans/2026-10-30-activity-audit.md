# Pasif Hesap Denetimi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Takip edilen hesaplar arasında son 30 günde gönderi/retweet/yanıt paylaşmamış hesapları ayrı bir "Pasif hesaplar" sekmesinde listelemek ve isteğe bağlı olarak uyarıyla takipten çıkarmak.

**Architecture:** Yeni `src/activity.js` modülü X'in `users/lookup` ucunu 10'lu bloklarla dener; eksik/erişilemeyen hesaplar için `UserTweetsAndReplies` GraphQL yedeğine düşer. Sonuçlar 24 saatlik yerel cache'te tutulur. `src/main.js` durum ve orkestrasyonu, `src/ui.js` sekmeler/pasif görünümü, `src/storage.js` cache'i, `src/capture.js` GraphQL şablonu yakalamayı yönetir.

**Tech Stack:** Vanilla ES modules, esbuild, node:test, jsdom, localStorage.

---

## Dosya yapısı

Yeni:

- `src/activity.js` — ayrıştırıcılar, sınıflandırma, istek üreticileri, `runActivityScan`.
- `tests/activity.test.js` — birim ve akış testleri.
- `tests/fixtures/lookup.json` — `users/lookup` yanıtı.
- `tests/fixtures/user-tweets.json` — `UserTweetsAndReplies` yanıtı.
- `tests/fixtures/user-tweets-empty.json` — boş timeline.

Değişecek:

- `src/config.js` — aktivite sabitleri, feature set'i, TR/EN metinleri, sürüm.
- `src/capture.js` — `UserTweetsAndReplies` yakalama; `Following` korunur.
- `src/storage.js` — aktivite cache'i ve yarım tarama kaydı.
- `src/main.js` — durum, `startActivityScan`, cache yazımı, sekme/takipten çıkarma entegrasyonu.
- `src/ui.js` — sekmeler, pasif görünüm, ilerleme, ayarlar, onay pencereleri.
- `tests/config.test.js`, `tests/storage.test.js`, `tests/capture.test.js`, `tests/ui.test.js`, `tests/main.test.js`.
- `README.md`, `README.tr.md`, `package.json`, `package-lock.json`, `unfollow-x.js`.

---

### Task 1: Aktivite sabitleri, sürüm ve dil metinleri

**Files:**
- Modify: `src/config.js`
- Modify: `tests/config.test.js`

- [ ] **Step 1: Write the failing test**

`tests/config.test.js` içindeki mevcut testi şu hale getir:

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_BATCH_SIZE,
  ACTIVITY_DEFAULT_DAYS,
  ACTIVITY_KEY,
  ACTIVITY_SCAN_KEY,
  ACTIVITY_TTL,
  I18N,
  makeT,
  DEFAULT_TIMINGS,
  VERSION,
} from "../src/config.js";

test("t interpolates and falls back to English", () => {
  const tr = makeT("tr");
  assert.equal(tr("scanBtn"), "Taramayı başlat");
  assert.equal(tr("foundCount", { count: 3 }), "3 takip etmeyen");
  const en = makeT("en");
  assert.equal(en("nope"), "nope");
  assert.equal(en("scanBtn"), "Scan now");
});

test("timings are sane", () => {
  assert.equal(VERSION, "0.3.0");
  assert.ok(DEFAULT_TIMINGS.unfollowDelayMin >= 8000);
  assert.ok(DEFAULT_TIMINGS.maxUnfollows <= 400);
  assert.ok(I18N.en && I18N.tr);
});

test("activity defaults are conservative and fixed", () => {
  assert.equal(ACTIVITY_BATCH_SIZE, 10);
  assert.equal(ACTIVITY_DEFAULT_DAYS, 30);
  assert.equal(ACTIVITY_TTL, 24 * 60 * 60 * 1000);
  assert.equal(ACTIVITY_KEY, "ux_activity_v1");
  assert.equal(ACTIVITY_SCAN_KEY, "ux_activity_scan_v1");
});

test("TR and EN expose the same keys", () => {
  assert.deepEqual(
    Object.keys(I18N.en).sort(),
    Object.keys(I18N.tr).sort()
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/config.test.js`
Expected: FAIL because `VERSION` is `0.2.0` and activity exports do not exist.

- [ ] **Step 3: Add constants and bump version**

`src/config.js` başındaki sürümü ve anahtarları güncelle:

```js
export const VERSION = "0.3.0";
```

`LAST_SCAN_KEY` satırının altına ekle:

```js
export const ACTIVITY_KEY = "ux_activity_v1";
export const ACTIVITY_SCAN_KEY = "ux_activity_scan_v1";
export const ACTIVITY_TTL = 24 * 60 * 60 * 1000;
export const ACTIVITY_BATCH_SIZE = 10;
export const ACTIVITY_DEFAULT_DAYS = 30;
export const ACTIVITY_MIN_DAYS = 1;
export const ACTIVITY_MAX_DAYS = 365;
export const ACTIVITY_QUERY_ID = "M9Tz6NGTHeRzqHOPdj9I7g";
export const ACTIVITY_FEATURES = {
  articles_preview_enabled: true,
  c9s_tweet_anatomy_moderator_badge_enabled: true,
  communities_web_enable_tweet_community_results_fetch: true,
  creator_subscriptions_quote_tweet_preview_enabled: false,
  creator_subscriptions_tweet_preview_api_enabled: true,
  freedom_of_speech_not_reach_fetch_enabled: true,
  graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
  longform_notetweets_consumption_enabled: true,
  longform_notetweets_inline_media_enabled: true,
  longform_notetweets_rich_text_read_enabled: true,
  responsive_web_edit_tweet_api_enabled: true,
  responsive_web_enhance_cards_enabled: false,
  responsive_web_graphql_exclude_directive_enabled: true,
  responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
  responsive_web_grok_community_note_auto_translation_is_enabled: false,
  responsive_web_graphql_timeline_navigation_enabled: true,
  responsive_web_grok_imagine_annotation_enabled: false,
  responsive_web_media_download_video_enabled: false,
  responsive_web_profile_redirect_enabled: true,
  responsive_web_twitter_article_tweet_consumption_enabled: true,
  rweb_tipjar_consumption_enabled: true,
  rweb_video_timestamps_enabled: true,
  standardized_nudges_misinfo: true,
  tweet_awards_web_tipping_enabled: false,
  tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
  tweet_with_visibility_results_prefer_gql_media_interstitial_enabled: false,
  tweetypie_unmention_optimization_enabled: true,
  verified_phone_label_enabled: false,
  view_counts_everywhere_api_enabled: true,
  responsive_web_grok_analyze_button_fetch_trends_enabled: false,
  premium_content_api_read_enabled: false,
  profile_label_improvements_pcf_label_in_post_enabled: false,
  responsive_web_grok_share_attachment_enabled: false,
  responsive_web_grok_analyze_post_followups_enabled: false,
  responsive_web_grok_image_annotation_enabled: false,
  responsive_web_grok_analysis_button_from_backend: false,
  responsive_web_jetfuel_frame: false,
  rweb_video_screen_enabled: true,
  responsive_web_grok_show_grok_translated_post: true,
};
```

- [ ] **Step 4: Add i18n strings**

`I18N.en` içinde `pausedHint` satırından sonra ekle:

```js
    tabNonFollowers: "Non-followers",
    tabInactive: "Inactive",
    activityKicker: "Activity audit",
    activityBody:
      "Find accounts you follow that have not posted, reposted, or replied in the last 30 days.",
    activityStart: "Start activity scan",
    activityScanning: "Checking activity…",
    activityHint: "Keep this tab visible. You can pause or cancel at any time.",
    activityProgress: "{checked} / {total} checked",
    activityCurrent: "Now: @{handle}",
    activityFound: "{count} inactive accounts",
    activityFoundOne: "1 inactive account",
    activityUnit: "inactive accounts",
    activityUnitOne: "inactive account",
    activityNone: "No inactive accounts in this window",
    activityLiveEmpty: "Found inactive accounts will appear here.",
    activityNever: "No posts yet",
    activityLastPost: "Last post: {time}",
    activityLastCheck: "Last check: {time}",
    activityUnknown: "Could not check",
    activityUnknownCount: "{count} accounts could not be checked",
    activityReasonNoId: "No user ID",
    activityReasonNotFound: "Not found",
    activityReasonTemplate: "Query failed",
    activityReasonProtected: "Protected",
    activityReasonRate: "Rate limited",
    activityReasonUnavailable: "Unavailable",
    activityFresh: "Activity data is up to date",
    activityNeedsScan: "Scan your following list first",
    activityPartial: "{count} accounts checked. Continue to finish.",
    activityClear: "Clear activity data",
    activityCleared: "Activity data cleared",
    activityClearTitle: "Clear activity data?",
    activityClearBody:
      "Last post times and check records will be removed from this device.",
    activityFallback:
      "Batch check unavailable; switching to profile checks",
    activityGraphqlHint:
      "Open any profile's Replies tab once, then retry",
    activityCacheWarning:
      "Could not save activity cache; progress will be lost on reload.",
    activityFollowsWarning:
      "{count} selected accounts follow you. Unfollow anyway?",
    activityUnfollowTitle: "Unfollow {count} inactive accounts?",
    activityUnfollowBody:
      "This cannot be undone. These accounts may follow you back.",
    activityDoneToast: "Activity scan complete: {count} inactive accounts.",
    activityDays: "Inactive threshold (days)",
    activitySourceBatch: "Batch",
    activitySourceProfile: "Profile",
    pillInactive: "{count} inactive",
    pillActivity: "Checking activity",
```

`I18N.tr` içinde `pausedHint` satırından sonra aynı anahtarları Türkçe ekle:

```js
    tabNonFollowers: "Takip etmeyenler",
    tabInactive: "Pasif hesaplar",
    activityKicker: "Aktivite denetimi",
    activityBody:
      "Takip ettiğin hesaplardan son 30 günde gönderi, retweet veya yanıt paylaşmayanları bul.",
    activityStart: "Aktivite taramasını başlat",
    activityScanning: "Aktivite kontrol ediliyor…",
    activityHint:
      "Bu sekmeyi görünür tut. İstediğin an duraklatıp iptal edebilirsin.",
    activityProgress: "{checked} / {total} kontrol edildi",
    activityCurrent: "Şu an: @{handle}",
    activityFound: "{count} pasif hesap",
    activityFoundOne: "1 pasif hesap",
    activityUnit: "pasif hesap",
    activityUnitOne: "pasif hesap",
    activityNone: "Bu aralıkta pasif hesap yok",
    activityLiveEmpty: "Bulunan pasif hesaplar burada görünecek.",
    activityNever: "Hiç gönderi yok",
    activityLastPost: "Son gönderi: {time}",
    activityLastCheck: "Son kontrol: {time}",
    activityUnknown: "Kontrol edilemedi",
    activityUnknownCount: "{count} hesap kontrol edilemedi",
    activityReasonNoId: "Kimlik yok",
    activityReasonNotFound: "Bulunamadı",
    activityReasonTemplate: "Sorgu başarısız",
    activityReasonProtected: "Korumalı",
    activityReasonRate: "Hız limiti",
    activityReasonUnavailable: "Erişilemedi",
    activityFresh: "Aktivite verileri güncel",
    activityNeedsScan: "Önce takip listeni tara",
    activityPartial: "{count} hesap kontrol edildi. Tamamlamak için devam et.",
    activityClear: "Aktivite verilerini temizle",
    activityCleared: "Aktivite verileri temizlendi",
    activityClearTitle: "Aktivite verileri silinsin mi?",
    activityClearBody:
      "Son gönderi zamanları ve kontrol kayıtları bu cihazdan silinir.",
    activityFallback:
      "Toplu kontrol kullanılamadı; hesap başına kontrole geçildi",
    activityGraphqlHint:
      "Bir profilin Yanıtlar sekmesini açıp tekrar dene",
    activityCacheWarning:
      "Aktivite cache'i kaydedilemedi; sayfa yenilenirse ilerleme kaybolur.",
    activityFollowsWarning:
      "Seçilen {count} hesap seni takip ediyor. Yine de takipten çıkılsın mı?",
    activityUnfollowTitle: "{count} pasif hesaptan çıkılsın mı?",
    activityUnfollowBody:
      "Bu işlem geri alınamaz. Bu hesaplar seni takip ediyor olabilir.",
    activityDoneToast: "Aktivite taraması bitti: {count} pasif hesap.",
    activityDays: "Pasif eşiği (gün)",
    activitySourceBatch: "Toplu",
    activitySourceProfile: "Profil",
    pillInactive: "{count} pasif",
    pillActivity: "Aktivite taranıyor",
```

- [ ] **Step 5: Run tests**

Run: `node --test tests/config.test.js`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/config.js tests/config.test.js
git commit -m "feat: add activity config and strings"
```

---

### Task 2: Aktivite ayrıştırıcıları ve sınıflandırma

**Files:**
- Create: `src/activity.js`
- Create: `tests/activity.test.js`
- Create: `tests/fixtures/lookup.json`
- Create: `tests/fixtures/user-tweets.json`
- Create: `tests/fixtures/user-tweets-empty.json`

- [ ] **Step 1: Create fixtures**

`tests/fixtures/lookup.json`:

```json
[
  {
    "id_str": "1",
    "screen_name": "alice",
    "statuses_count": 120,
    "status": {
      "created_at": "Thu Oct 29 10:00:00 +0000 2026"
    }
  },
  {
    "id_str": "2",
    "screen_name": "bob",
    "statuses_count": 0
  },
  {
    "id_str": "3",
    "screen_name": "carol",
    "statuses_count": 42
  }
]
```

`tests/fixtures/user-tweets.json`:

```json
{
  "data": {
    "user": {
      "result": {
        "__typename": "User",
        "rest_id": "1",
        "timeline_v2": {
          "timeline": {
            "instructions": [
              {
                "type": "TimelineAddEntries",
                "entries": [
                  {
                    "entryId": "tweet-1",
                    "content": {
                      "itemContent": {
                        "tweet_results": {
                          "result": {
                            "__typename": "Tweet",
                            "rest_id": "100",
                            "core": {
                              "user_results": {
                                "result": { "rest_id": "1" }
                              }
                            },
                            "legacy": {
                              "created_at": "Thu Oct 29 10:00:00 +0000 2026",
                              "in_reply_to_status_id_str": "90"
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    "entryId": "tweet-2",
                    "content": {
                      "itemContent": {
                        "tweet_results": {
                          "result": {
                            "__typename": "Tweet",
                            "rest_id": "101",
                            "core": {
                              "user_results": {
                                "result": { "rest_id": "1" }
                              }
                            },
                            "legacy": {
                              "created_at": "Wed Jan 01 10:00:00 +0000 2025"
                            }
                          }
                        }
                      }
                    }
                  },
                  {
                    "entryId": "tweet-3",
                    "content": {
                      "itemContent": {
                        "tweet_results": {
                          "result": {
                            "__typename": "Tweet",
                            "rest_id": "102",
                            "core": {
                              "user_results": {
                                "result": { "rest_id": "999" }
                              }
                            },
                            "legacy": {
                              "created_at": "Thu Oct 30 09:00:00 +0000 2026",
                              "retweeted_status_result": {
                                "result": { "rest_id": "50" }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                ]
              }
            ]
          }
        }
      }
    }
  }
}
```

`tests/fixtures/user-tweets-empty.json`:

```json
{
  "data": {
    "user": {
      "result": {
        "__typename": "User",
        "rest_id": "2",
        "timeline_v2": {
          "timeline": {
            "instructions": []
          }
        }
      }
    }
  }
}
```

- [ ] **Step 2: Write the failing tests**

`tests/activity.test.js`:

```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test tests/activity.test.js`
Expected: FAIL with `Cannot find module '../src/activity.js'`.

- [ ] **Step 4: Implement the helpers**

Create `src/activity.js` with the first block:

```js
import {
  ACTIVITY_BATCH_SIZE,
  ACTIVITY_DEFAULT_DAYS,
  ACTIVITY_FEATURES,
  ACTIVITY_QUERY_ID,
  ACTIVITY_TTL,
  BEARER,
} from "./config.js";
import { fetchJson } from "./api.js";
import { clamp, safeJsonParse, sleep } from "./utils.js";

const DAY = 24 * 60 * 60 * 1000;

function makeError(kind, message, extra = {}) {
  const error = new Error(message || kind);
  error.kind = kind;
  Object.assign(error, extra);
  return error;
}

export function parseTwitterDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const text = String(value).trim();
  if (/^\d+$/.test(text)) {
    const number = Number(text);
    if (!Number.isFinite(number) || number <= 0) return null;
    return number > 1e12 ? number : number * 1000;
  }
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? parsed : null;
}

export function classifyActivity(entry, days = ACTIVITY_DEFAULT_DAYS, now = Date.now()) {
  if (!entry || entry.state !== "known") return "unknown";
  const stamp = Number(entry.lastTweetAt);
  if (!Number.isFinite(stamp) || stamp < 0) return "unknown";
  if (stamp === 0) return "inactive";
  const windowDays = clamp(Number(days) || ACTIVITY_DEFAULT_DAYS, 1, 365);
  return stamp <= now - windowDays * DAY ? "inactive" : "active";
}

export function isActivityFresh(entry, now = Date.now()) {
  const checkedAt = Number(entry?.checkedAt);
  return (
    Number.isFinite(checkedAt) &&
    checkedAt <= now + 60_000 &&
    now - checkedAt < ACTIVITY_TTL
  );
}

export function activityEntryFor(entries, user) {
  const id = String(user?.id || "");
  const handle = String(user?.handle || "").toLowerCase();
  return (id && entries?.[id]) || (handle && entries?.[handle]) || null;
}

function normalizeLookupItem(raw) {
  const id = String(raw?.id_str || raw?.id || "").trim();
  const handle = String(raw?.screen_name || raw?.handle || "")
    .replace(/^@/, "")
    .trim();
  if (!id && !handle) return null;
  const statusesCount = Number(raw?.statuses_count);
  const count = Number.isFinite(statusesCount) ? statusesCount : null;
  const createdAt = raw?.status?.created_at;
  let state = "fallback";
  let lastTweetAt = null;
  if (createdAt !== undefined && createdAt !== null && createdAt !== "") {
    const parsed = parseTwitterDate(createdAt);
    if (parsed !== null) {
      state = "known";
      lastTweetAt = parsed;
    }
  } else if (count === 0) {
    state = "known";
    lastTweetAt = 0;
  }
  return { id, handle, state, lastTweetAt, statusesCount: count, reason: "" };
}

export function parseLookupUsers(json) {
  const list = Array.isArray(json)
    ? json
    : Array.isArray(json?.users)
      ? json.users
      : [];
  const byId = new Map();
  const byHandle = new Map();
  const items = new Map();
  for (const raw of list) {
    const item = normalizeLookupItem(raw);
    if (!item) continue;
    const key = item.id || item.handle.toLowerCase();
    items.set(key, item);
    if (item.id) byId.set(item.id, item);
    if (item.handle) byHandle.set(item.handle.toLowerCase(), item);
  }
  return { items: [...items.values()], byId, byHandle };
}

function findInstructions(node, depth = 0) {
  if (!node || typeof node !== "object" || depth > 20) return null;
  if (Array.isArray(node.instructions)) return node.instructions;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findInstructions(item, depth + 1);
      if (found) return found;
    }
    return null;
  }
  for (const value of Object.values(node)) {
    const found = findInstructions(value, depth + 1);
    if (found) return found;
  }
  return null;
}

function collectEntries(node, out, depth = 0) {
  if (!node || typeof node !== "object" || depth > 30) return;
  if (Array.isArray(node.entries)) out.push(...node.entries);
  if (Array.isArray(node.items)) out.push(...node.items);
  for (const value of Object.values(node)) collectEntries(value, out, depth + 1);
}

function tweetResultOf(entry) {
  const content = entry?.content || entry?.item?.itemContent || entry?.itemContent || {};
  return (
    content?.itemContent?.tweet_results?.result ||
    content?.tweet_results?.result ||
    entry?.item?.itemContent?.tweet_results?.result ||
    null
  );
}

function tweetTimestamp(result, userId) {
  const tweet =
    result?.__typename === "TweetWithVisibilityResults" ? result.tweet : result;
  if (!tweet || tweet.__typename === "TweetUnavailable") {
    return { relevant: false, at: null };
  }
  const legacy = tweet.legacy || {};
  const authorId = String(tweet.core?.user_results?.result?.rest_id || "");
  const isRetweet = Boolean(legacy.retweeted_status_result);
  const relevant = isRetweet || !userId || authorId === String(userId);
  if (!relevant) return { relevant: false, at: null };
  return { relevant: true, at: parseTwitterDate(legacy.created_at) };
}

export function parseUserTweetsPage(json, userId = "") {
  const message = String(json?.errors?.[0]?.message || "");
  if (/rate limit|too many requests|try again later/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "rate" };
  }
  if (/could not authenticate|unauthorized|not authorized|require_login/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "auth" };
  }
  if (/blocked|forbidden|challenge|spam/i.test(message)) {
    return { state: "unknown", reason: message, fatalKind: "blocked" };
  }
  if (/could not find user|user not found|suspended|not authorized to view/i.test(message)) {
    return { state: "unknown", reason: "unavailable" };
  }

  const root = json?.data?.user?.result || json?.data?.user;
  if (!root) return { state: "unknown", reason: "not-found" };
  if (root.__typename === "UserUnavailable") {
    return { state: "unknown", reason: "unavailable" };
  }

  const instructions = findInstructions(root);
  if (!instructions) return { state: "unknown", reason: "parse" };

  const entries = [];
  collectEntries(instructions, entries);
  let relevant = 0;
  let lastTweetAt = 0;
  for (const entry of entries) {
    const result = tweetResultOf(entry);
    if (!result) continue;
    const info = tweetTimestamp(result, userId);
    if (!info.relevant) continue;
    relevant += 1;
    if (info.at !== null && info.at > lastTweetAt) lastTweetAt = info.at;
  }
  if (relevant > 0 && lastTweetAt === 0) {
    return { state: "unknown", reason: "parse" };
  }
  return { state: "known", lastTweetAt, reason: "" };
}
```

- [ ] **Step 5: Run tests**

Run: `node --test tests/activity.test.js`
Expected: PASS (10 tests).

- [ ] **Step 6: Commit**

```bash
git add src/activity.js tests/activity.test.js tests/fixtures/lookup.json tests/fixtures/user-tweets.json tests/fixtures/user-tweets-empty.json
git commit -m "feat: parse lookup and tweet activity"
```

---

### Task 3: Aktivite istek üreticileri

**Files:**
- Modify: `src/activity.js`
- Modify: `tests/activity.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/activity.test.js` sonuna ekle:

```js
import {
  buildActivityRequest,
  buildDefaultActivityTemplate,
  buildLookupRequest,
} from "../src/activity.js";
import { ACTIVITY_QUERY_ID } from "../src/config.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/activity.test.js`
Expected: FAIL because the builders are not exported.

- [ ] **Step 3: Implement the builders**

`src/activity.js` sonuna ekle:

```js
function originOf(origin) {
  return (
    origin ||
    (typeof location !== "undefined" && location.origin) ||
    "https://x.com"
  );
}

function authHeaders(csrf, isJson, transactionId) {
  const headers = {
    authorization: `Bearer ${BEARER}`,
    "x-csrf-token": csrf || "",
    "x-twitter-auth-type": "OAuth2Session",
    "x-twitter-active-user": "yes",
    "x-twitter-client-language": "en",
  };
  if (isJson) headers["content-type"] = "application/json";
  if (transactionId) headers["x-client-transaction-id"] = transactionId;
  return headers;
}

export function buildLookupRequest({
  userIds = [],
  screenNames = [],
  csrf = "",
  origin = "",
} = {}) {
  const url = new URL("/i/api/1.1/users/lookup.json", originOf(origin));
  if (userIds.length) url.searchParams.set("user_id", userIds.join(","));
  if (screenNames.length) url.searchParams.set("screen_name", screenNames.join(","));
  url.searchParams.set("include_entities", "true");
  return {
    url: url.toString(),
    init: {
      method: "GET",
      headers: authHeaders(csrf, false),
      credentials: "include",
    },
  };
}

export function buildActivityRequest(
  template,
  { userId = "", count = 20, csrf = "", origin = "" } = {}
) {
  if (!template) throw makeError("format", "No activity template");
  const method =
    String(template.method || "GET").toUpperCase() === "POST" ? "POST" : "GET";
  const variables = { ...(template.variables || {}) };
  variables.userId = String(userId || "");
  variables.count = Number(count) || 20;
  variables.includePromotedContent = false;
  variables.withCommunity = true;
  variables.withVoice = true;
  variables.withV2Timeline = true;
  delete variables.cursor;

  const transactionId =
    template.headers?.["x-client-transaction-id"] || "";
  const headers = authHeaders(csrf, method === "POST", transactionId);

  if (method === "GET") {
    const url = new URL(template.url, originOf(origin));
    url.searchParams.set("variables", JSON.stringify(variables));
    if (template.features && typeof template.features === "object") {
      url.searchParams.set("features", JSON.stringify(template.features));
    }
    if (template.fieldToggles && typeof template.fieldToggles === "object") {
      url.searchParams.set(
        "fieldToggles",
        JSON.stringify(template.fieldToggles)
      );
    }
    return {
      url: url.toString(),
      init: { method: "GET", headers, credentials: "include" },
    };
  }

  const base = safeJsonParse(template.body, {}) || {};
  const body = {
    ...base,
    variables,
    queryId: base.queryId || template.queryId || "",
  };
  if (template.features && body.features === undefined) {
    body.features = template.features;
  }
  if (template.fieldToggles && body.fieldToggles === undefined) {
    body.fieldToggles = template.fieldToggles;
  }
  return {
    url: new URL(template.url, originOf(origin)).toString(),
    init: {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      credentials: "include",
    },
  };
}

export function buildDefaultActivityTemplate() {
  const variables = {
    userId: "",
    count: 20,
    includePromotedContent: false,
    withCommunity: true,
    withVoice: true,
    withV2Timeline: true,
  };
  return {
    url: `https://x.com/i/api/graphql/${ACTIVITY_QUERY_ID}/UserTweetsAndReplies`,
    method: "GET",
    headers: {},
    body: "",
    variables,
    features: ACTIVITY_FEATURES,
    fieldToggles: { withArticlePlainText: false },
    queryId: ACTIVITY_QUERY_ID,
    operationName: "UserTweetsAndReplies",
    capturedAt: 0,
    responseSample: null,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/activity.test.js`
Expected: PASS (14 tests).

- [ ] **Step 5: Commit**

```bash
git add src/activity.js tests/activity.test.js
git commit -m "feat: build activity requests"
```

---

### Task 4: `runActivityScan` akışı

**Files:**
- Modify: `src/activity.js`
- Modify: `tests/activity.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/activity.test.js` sonuna ekle:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/activity.test.js`
Expected: FAIL because `runActivityScan` is not exported.

- [ ] **Step 3: Implement `runActivityScan`**

`src/activity.js` sonuna ekle:

```js
function abortError() {
  return makeError("aborted", "Aborted");
}

function isLookupUnsupported(error) {
  const status = Number(error?.status);
  if (error?.kind === "blocked" && status === 403) return true;
  return error?.kind === "format" && [400, 403, 404, 405, 410].includes(status);
}

export async function runActivityScan(options = {}) {
  const {
    users = [],
    cache = {},
    days = ACTIVITY_DEFAULT_DAYS,
    csrf = "",
    origin = "",
    template = null,
    fetchImpl = globalThis.fetch,
    sleepFn = sleep,
    random = Math.random,
    timings = {},
    onResult = () => {},
    onProgress = () => {},
    shouldPause,
    shouldCancel,
    signal,
    lookup = true,
    force = false,
  } = options;

  const clock =
    typeof options.now === "function"
      ? options.now
      : () =>
          Number.isFinite(Number(options.now))
            ? Number(options.now)
            : Date.now();

  const delayMin = Math.max(0, Number(timings.scanDelayMin) || 0);
  const delayMax = Math.max(delayMin, Number(timings.scanDelayMax) || 0);
  const pauseEvery = Math.max(0, Number(timings.scanPauseEveryPages) || 0);
  const pauseMs = Math.max(0, Number(timings.scanPauseMs) || 0);

  const candidates = (Array.isArray(users) ? users : []).filter((user) => {
    if (!user || !user.handle) return false;
    if (force) return true;
    return !isActivityFresh(activityEntryFor(cache, user), clock());
  });
  const total = candidates.length;

  let checked = 0;
  let inactive = 0;
  let unknown = 0;
  let requests = 0;
  let lookupMode = Boolean(lookup);
  let currentSource = lookupMode ? "lookup" : "graphql";
  let graphqlBroken = false;
  let defaultTemplate = template || null;

  const check = () => {
    if (signal?.aborted || shouldCancel?.()) throw abortError();
  };

  const waitWhilePaused = async () => {
    while (shouldPause?.()) {
      check();
      onProgress({ kind: "paused", checked, total, source: currentSource });
      await sleepFn(250);
    }
    check();
  };

  const pace = async () => {
    requests += 1;
    const wait =
      delayMax <= delayMin
        ? delayMin
        : delayMin + random() * (delayMax - delayMin);
    if (wait > 0) {
      onProgress({ kind: "delay", ms: wait, checked, total, source: currentSource });
      await sleepFn(wait);
    }
    if (pauseEvery > 0 && requests % pauseEvery === 0 && pauseMs > 0) {
      onProgress({ kind: "pause", ms: pauseMs, checked, total, source: currentSource });
      await sleepFn(pauseMs);
    }
    check();
  };

  const processEntry = (user, entry) => {
    const normalized = {
      id: String(entry.id || user.id || ""),
      handle: user.handle,
      state: entry.state,
      lastTweetAt:
        entry.state === "known" ? Number(entry.lastTweetAt) || 0 : null,
      reason: entry.reason || "",
      checkedAt: clock(),
      source: entry.source || currentSource,
    };
    checked += 1;
    if (normalized.state === "unknown") unknown += 1;
    else if (classifyActivity(normalized, days, clock()) === "inactive") {
      inactive += 1;
    }
    onResult(user, normalized);
    onProgress({
      kind: "result",
      user,
      entry: normalized,
      checked,
      total,
      inactive,
      unknown,
      source: normalized.source,
    });
    if (checked % 5 === 0) {
      onProgress({
        kind: "checkpoint",
        checked,
        total,
        source: normalized.source,
      });
    }
  };

  const lookupBatch = async (batch) => {
    const ids = batch.filter((user) => user.id).map((user) => String(user.id));
    const names = batch.filter((user) => !user.id).map((user) => user.handle);
    const request = buildLookupRequest({
      userIds: ids,
      screenNames: names,
      csrf,
      origin,
    });
    let json;
    try {
      json = await fetchJson(request.url, request.init, {
        fetchImpl,
        signal,
        sleepFn,
      });
    } catch (error) {
      if (isLookupUnsupported(error)) {
        throw makeError("lookup-unsupported", "lookup unsupported", {
          cause: error,
          status: error.status,
        });
      }
      throw error;
    }
    const parsed = parseLookupUsers(json);
    const fallback = [];
    let matched = 0;
    for (const user of batch) {
      const item =
        (user.id && parsed.byId.get(String(user.id))) ||
        parsed.byHandle.get(String(user.handle).toLowerCase());
      if (!item) {
        fallback.push(user);
        continue;
      }
      matched += 1;
      if (item.state === "known") {
        processEntry(user, { ...item, source: "lookup" });
      } else {
        fallback.push(user);
      }
    }
    await pace();
    if (batch.length > 0 && matched === 0) {
      throw makeError("lookup-unsupported", "lookup returned no users");
    }
    return fallback;
  };

  const graphqlUser = async (user) => {
    if (!user.id) {
      processEntry(user, { state: "unknown", reason: "no-id", source: "graphql" });
      return;
    }
    if (graphqlBroken) {
      processEntry(user, {
        state: "unknown",
        reason: "template",
        source: "graphql",
      });
      return;
    }
    if (!defaultTemplate) defaultTemplate = buildDefaultActivityTemplate();
    const request = buildActivityRequest(defaultTemplate, {
      userId: user.id,
      count: 20,
      csrf,
      origin,
    });
    let json;
    try {
      json = await fetchJson(request.url, request.init, {
        fetchImpl,
        signal,
        sleepFn,
      });
    } catch (error) {
      if (
        error.kind === "format" &&
        [400, 404, 405, 410].includes(Number(error.status))
      ) {
        graphqlBroken = true;
        processEntry(user, {
          state: "unknown",
          reason: "template",
          source: "graphql",
        });
        onProgress({
          kind: "template-broken",
          checked,
          total,
          source: currentSource,
        });
        return;
      }
      throw error;
    }
    const parsed = parseUserTweetsPage(json, user.id);
    if (parsed.fatalKind) {
      throw makeError(parsed.fatalKind, parsed.reason || parsed.fatalKind, {
        status: 200,
        body: json,
        retryAfter: 0,
      });
    }
    processEntry(user, { ...parsed, source: "graphql" });
    await pace();
  };

  onProgress({ kind: "start", total, source: currentSource });
  if (!total) {
    onProgress({
      kind: "done",
      checked: 0,
      inactive: 0,
      unknown: 0,
      total: 0,
      source: currentSource,
      stopped: "done",
    });
    return {
      checked,
      inactive,
      unknown,
      total,
      source: currentSource,
      stopped: "done",
    };
  }

  const idQueue = candidates.filter((user) => user.id);
  const handleQueue = candidates.filter((user) => !user.id);
  let idIndex = 0;
  let handleIndex = 0;
  const hasRemaining = () =>
    idIndex < idQueue.length || handleIndex < handleQueue.length;
  const takeBatch = () => {
    if (idIndex < idQueue.length) {
      const batch = idQueue.slice(idIndex, idIndex + ACTIVITY_BATCH_SIZE);
      idIndex += batch.length;
      return batch;
    }
    const batch = handleQueue.slice(handleIndex, handleIndex + ACTIVITY_BATCH_SIZE);
    handleIndex += batch.length;
    return batch;
  };
  const takeOne = () => {
    if (idIndex < idQueue.length) return idQueue[idIndex++];
    return handleQueue[handleIndex++];
  };

  while (hasRemaining()) {
    await waitWhilePaused();
    if (lookupMode) {
      const batch = takeBatch();
      let fallback;
      try {
        fallback = await lookupBatch(batch);
      } catch (error) {
        if (error.kind === "lookup-unsupported") {
          lookupMode = false;
          currentSource = "graphql";
          onProgress({
            kind: "fallback",
            to: "graphql",
            reason: error.message,
            checked,
            total,
          });
          for (const user of batch) {
            await waitWhilePaused();
            await graphqlUser(user);
          }
          continue;
        }
        throw error;
      }
      for (const user of fallback) {
        await waitWhilePaused();
        await graphqlUser(user);
      }
    } else {
      const user = takeOne();
      await waitWhilePaused();
      await graphqlUser(user);
    }
  }

  onProgress({
    kind: "done",
    checked,
    inactive,
    unknown,
    total,
    source: currentSource,
    stopped: "done",
  });
  return {
    checked,
    inactive,
    unknown,
    total,
    source: currentSource,
    stopped: "done",
  };
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/activity.test.js`
Expected: PASS (19 tests).

- [ ] **Step 5: Commit**

```bash
git add src/activity.js tests/activity.test.js
git commit -m "feat: scan activity with lookup fallback"
```

---

### Task 5: Aktivite cache'i ve yarım tarama kaydı

**Files:**
- Modify: `src/storage.js`
- Modify: `tests/storage.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/storage.test.js` sonuna ekle:

```js
import {
  clearActivity,
  clearActivityScan,
  loadActivity,
  loadActivityScan,
  saveActivity,
  saveActivityScan,
} from "../src/storage.js";

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    clear: () => map.clear(),
  };
}

test("activity cache is viewer-bound and drops entries older than 24h", () => {
  const storage = memoryStorage();
  const now = Date.now();
  saveActivity(storage, "me", {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: now - 1000,
      checkedAt: now,
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: 0,
      checkedAt: now - 25 * 60 * 60 * 1000,
    },
  });
  assert.deepEqual(Object.keys(loadActivity(storage, "me")), ["1"]);
  assert.deepEqual(loadActivity(storage, "other"), {});
});

test("activity cache can be cleared", () => {
  const storage = memoryStorage();
  saveActivity(storage, "me", {
    "1": { id: "1", handle: "alice", state: "known", lastTweetAt: 0, checkedAt: Date.now() },
  });
  assert.equal(clearActivity(storage), true);
  assert.deepEqual(loadActivity(storage, "me"), {});
});

test("activity scan checkpoint is viewer-bound and fresh", () => {
  const storage = memoryStorage();
  const scan = {
    viewerHandle: "me",
    startedAt: Date.now(),
    checked: 10,
    total: 20,
    complete: false,
  };
  saveActivityScan(storage, scan);
  assert.equal(loadActivityScan(storage, "me").checked, 10);
  assert.equal(loadActivityScan(storage, "other"), null);
  assert.equal(clearActivityScan(storage), true);
  assert.equal(loadActivityScan(storage, "me"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/storage.test.js`
Expected: FAIL because the activity storage functions are not exported.

- [ ] **Step 3: Implement the storage functions**

`src/storage.js` imports'a ekle:

```js
import {
  STORAGE_KEY,
  CHECKPOINT_KEY,
  LAST_SCAN_KEY,
  ACTIVITY_KEY,
  ACTIVITY_SCAN_KEY,
  ACTIVITY_TTL,
  STATE_TTL,
} from "./config.js";
```

Dosyanın sonuna ekle:

```js
function isFreshActivity(entry, now = Date.now()) {
  const checkedAt = Number(entry?.checkedAt);
  return (
    Number.isFinite(checkedAt) &&
    checkedAt <= now + 60_000 &&
    now - checkedAt < ACTIVITY_TTL
  );
}

function freshActivityEntries(entries, now = Date.now()) {
  const fresh = {};
  for (const [key, entry] of Object.entries(entries || {})) {
    if (isFreshActivity(entry, now)) fresh[key] = entry;
  }
  return fresh;
}

export function loadActivity(storage = defaultStorage(), viewerHandle = "") {
  const parsed = readJson(storage, ACTIVITY_KEY);
  if (!parsed || !parsed.entries || typeof parsed.entries !== "object") {
    return {};
  }
  if (!sameViewer(viewerHandle, parsed.viewerHandle)) return {};
  return freshActivityEntries(parsed.entries);
}

export function saveActivity(
  storage = defaultStorage(),
  viewerHandle = "",
  entries = {}
) {
  if (!storage) return false;
  const now = Date.now();
  return writeJson(storage, ACTIVITY_KEY, {
    version: 1,
    viewerHandle,
    savedAt: now,
    entries: freshActivityEntries(entries, now),
  });
}

export function clearActivity(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(ACTIVITY_KEY);
    return true;
  } catch {
    return false;
  }
}

export function loadActivityScan(
  storage = defaultStorage(),
  viewerHandle = ""
) {
  const scan = readJson(storage, ACTIVITY_SCAN_KEY);
  if (!scan) return null;
  if (!isFresh(scan.savedAt)) return null;
  if (!sameViewer(viewerHandle, scan.viewerHandle)) return null;
  return scan;
}

export function saveActivityScan(storage = defaultStorage(), scan = {}) {
  if (!storage) return false;
  const next = { ...scan };
  if (!Number.isFinite(Number(next.savedAt))) next.savedAt = Date.now();
  return writeJson(storage, ACTIVITY_SCAN_KEY, next);
}

export function clearActivityScan(storage = defaultStorage()) {
  if (!storage) return false;
  try {
    storage.removeItem(ACTIVITY_SCAN_KEY);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/storage.test.js`
Expected: PASS (all storage tests, including the new 3).

- [ ] **Step 5: Commit**

```bash
git add src/storage.js tests/storage.test.js
git commit -m "feat: persist activity cache"
```

---

### Task 6: `UserTweetsAndReplies` isteğini yakalama

**Files:**
- Modify: `src/capture.js`
- Modify: `tests/capture.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/capture.test.js` sonuna ekle:

```js
import { getCapturedActivity, parseActivityTemplate } from "../src/capture.js";

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/capture.test.js`
Expected: FAIL because `getCapturedActivity`/`parseActivityTemplate` are not exported and `parseTemplate` rejects the activity URL.

- [ ] **Step 3: Refactor the parser and capture state**

`src/capture.js` başındaki `captured` değişkenini şununla değiştir:

```js
let capturedFollowing = null;
let capturedActivity = null;
const FOLLOWING_OPERATIONS = new Set(["Following", "followingQuery"]);
const ACTIVITY_OPERATIONS = new Set(["UserTweetsAndReplies"]);
```

`export function parseTemplate(...)` fonksiyonunu şu iki fonksiyonla değiştir:

```js
function parseGraphqlTemplate(input, allowedOperations) {
  const absolute = absoluteUrl(input?.url);
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
  if (!allowedOperations.has(operationName)) return null;
  const queryId = decodeURIComponent(match[1]);
  const upperMethod = String(input?.method || "GET").toUpperCase();
  const bodyJson = parseBody(input?.body);
  let variables = {};
  let features = null;
  let fieldToggles = null;
  if (upperMethod === "GET") {
    variables =
      safeJsonParse(parsed.searchParams.get("variables"), {}) || {};
    features = safeJsonParse(parsed.searchParams.get("features"), null);
    fieldToggles = safeJsonParse(parsed.searchParams.get("fieldToggles"), null);
  } else {
    variables = bodyJson?.variables || {};
    features = bodyJson?.features ?? null;
    fieldToggles = bodyJson?.fieldToggles ?? null;
  }
  if (!variables || typeof variables !== "object") variables = {};
  return {
    url: absolute,
    method: upperMethod,
    headers: pickHeaders(input?.headers),
    body:
      typeof input?.body === "string"
        ? input.body
        : bodyJson
          ? JSON.stringify(bodyJson)
          : "",
    variables,
    features,
    fieldToggles,
    queryId,
    operationName,
    capturedAt: Date.now(),
    responseSample: null,
  };
}

export function parseTemplate(input = {}) {
  return parseGraphqlTemplate(input, FOLLOWING_OPERATIONS);
}

export function parseActivityTemplate(input = {}) {
  return parseGraphqlTemplate(input, ACTIVITY_OPERATIONS);
}
```

`attachSample` fonksiyonunu şununla değiştir:

```js
function attachSample(response, template, readCurrent) {
  if (!response || typeof response.clone !== "function") return;
  try {
    const clone = response.clone();
    if (typeof clone.json !== "function") return;
    clone
      .json()
      .then((json) => {
        const current = readCurrent();
        if (current && current.capturedAt === template.capturedAt) {
          current.responseSample = json;
        }
      })
      .catch(() => {});
  } catch {
    // A consumed or opaque response cannot be cloned.
  }
}
```

`installCapture` içindeki fetch sarmalayıcısını şu şekilde güncelle:

```js
    const wrapped = function uxCaptureFetch(input, init) {
      const parts = requestParts(input, init);
      const following = parseTemplate(parts);
      const activity = parseActivityTemplate(parts);
      const promise = fetchImpl.apply(this, arguments);
      if (following) {
        capturedFollowing = following;
        Promise.resolve(promise)
          .then((response) =>
            attachSample(response, following, () => capturedFollowing)
          )
          .catch(() => {});
      }
      if (activity) {
        capturedActivity = activity;
        Promise.resolve(promise)
          .then((response) =>
            attachSample(response, activity, () => capturedActivity)
          )
          .catch(() => {});
      }
      return promise;
    };
```

XHR `proto.send` içindeki şablon yakalama bloğunu şununla değiştir:

```js
    proto.send = function uxSend(body) {
      const meta = this.__uxRequest;
      if (meta) {
        const input = {
          url: meta.url,
          method: meta.method,
          headers: null,
          body,
        };
        const following = parseTemplate(input);
        const activity = parseActivityTemplate(input);
        if (following) capturedFollowing = following;
        if (activity) capturedActivity = activity;
        if (following || activity) {
          this.addEventListener?.("load", () => {
            try {
              const json = safeJsonParse(this.responseText, null);
              if (
                json &&
                following &&
                capturedFollowing &&
                capturedFollowing.capturedAt === following.capturedAt
              ) {
                capturedFollowing.responseSample = json;
              }
              if (
                json &&
                activity &&
                capturedActivity &&
                capturedActivity.capturedAt === activity.capturedAt
              ) {
                capturedActivity.responseSample = json;
              }
            } catch {
              // Ignore non-JSON responses.
            }
          });
        }
      }
      return originalSend.call(this, body);
    };
```

`uninstallCapture` sonundaki `captured = null;` satırını şununla değiştir:

```js
  capturedFollowing = null;
  capturedActivity = null;
}
```

`getCapturedFollowing` fonksiyonunu şu hale getir ve yanına `getCapturedActivity` ekle:

```js
export function getCapturedFollowing() {
  return capturedFollowing;
}

export function getCapturedActivity() {
  return capturedActivity;
}
```

`resetCapture` fonksiyonunu şu hale getir:

```js
export function resetCapture() {
  capturedFollowing = null;
  capturedActivity = null;
}
```

`waitForCapture` içindeki `if (captured) return resolve(captured);` satırını şu hale getir:

```js
      if (capturedFollowing) return resolve(capturedFollowing);
```

- [ ] **Step 4: Run tests**

Run: `node --test tests/capture.test.js`
Expected: PASS (all capture tests, including the new 3).

- [ ] **Step 5: Commit**

```bash
git add src/capture.js tests/capture.test.js
git commit -m "feat: capture tweet reply requests"
```

---

### Task 7: UI görüntüleme katmanı — sekmeler ve pasif liste

**Files:**
- Modify: `src/ui.js`
- Modify: `tests/ui.test.js`

- [ ] **Step 1: Extend the test state helper**

`tests/ui.test.js` içindeki `state()` dönüşüne şu alanları ekle (mevcut alanların yanına):

```js
    activeTab: "nonFollowers",
    activityDays: 30,
    activityEntries: {},
    activityScan: null,
    activity: {
      status: "idle",
      checked: 0,
      total: 0,
      inactive: 0,
      unknown: 0,
      current: "",
      source: "lookup",
      error: "",
      nextAt: 0,
      startedAt: 0,
    },
```

- [ ] **Step 2: Write the failing display tests**

`tests/ui.test.js` sonuna ekle:

```js
import {
  getActivityEntry,
  getUnknownActivityUsers,
  activityStatus,
} from "../src/ui.js";

test("inactive tab lists only inactive users, never-posted first", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: Date.now() - 40 * 86400000,
      checkedAt: Date.now(),
    },
    "3": {
      id: "3",
      handle: "carol",
      state: "unknown",
      reason: "not-found",
      checkedAt: Date.now(),
    },
  };
  assert.deepEqual(
    getDisplayUsers(s).map((user) => user.handle),
    ["alice", "bob"]
  );
  assert.deepEqual(
    getUnknownActivityUsers(s).map((user) => user.handle),
    ["carol"]
  );
  assert.equal(activityStatus(s, s.users[0]), "inactive");
  assert.equal(getActivityEntry(s, s.users[0]).lastTweetAt, 0);
});

test("results view renders tabs and the activity intro", () => {
  const s = state();
  s.activeTab = "inactive";
  const html = renderResultsView(s);
  assert.match(html, /data-tab="nonFollowers"/);
  assert.match(html, /data-tab="inactive"/);
  assert.match(html, /data-action="start-activity"/);
  assert.match(html, /Activity audit/);
});

test("activity rows show last post notes and unknown section", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
    "2": {
      id: "2",
      handle: "bob",
      state: "known",
      lastTweetAt: Date.now() - 40 * 86400000,
      checkedAt: Date.now(),
    },
    "3": {
      id: "3",
      handle: "carol",
      state: "unknown",
      reason: "not-found",
      checkedAt: Date.now(),
    },
  };
  const html = renderResultsView(s);
  assert.match(html, /No posts yet/);
  assert.match(html, /Last post:/);
  assert.match(html, /could not be checked/);
  assert.doesNotMatch(html, /data-select="3"/);
});

test("passive pill shows the inactive count", () => {
  const s = state();
  s.activeTab = "inactive";
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  s.mode = "results";
  assert.match(pillLabel(s), /inactive/);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test tests/ui.test.js`
Expected: FAIL because the new exports and markup do not exist.

- [ ] **Step 4: Add imports and display helpers**

`src/ui.js` imports'a ekle:

```js
import {
  classifyActivity,
  activityEntryFor,
  isActivityFresh,
} from "./activity.js";
```

`src/ui.js` içinde `import { ... } from "./config.js";` listesine `ACTIVITY_DEFAULT_DAYS` ekle.

`keyOf` fonksiyonundan sonra ekle:

```js
export function getActivityEntry(state, user) {
  return activityEntryFor(state.activityEntries || {}, user);
}

export function activityStatus(state, user) {
  const entry = getActivityEntry(state, user);
  if (!entry || !isActivityFresh(entry)) return "unchecked";
  return classifyActivity(
    entry,
    state.activityDays ?? ACTIVITY_DEFAULT_DAYS
  );
}

export function getUnknownActivityUsers(state) {
  const filters = { ...DEFAULT_FILTERS, ...(state.filters || {}) };
  const hidden = setOf(state.hidden);
  const search = String(state.search || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  return (state.users || [])
    .filter((user) => user && user.handle)
    .filter((user) => activityStatus(state, user) === "unknown")
    .filter((user) => filters.showHidden || !isHidden(user, hidden))
    .filter((user) => filters.verified || !user.verified)
    .filter((user) => filters.protected || !user.protected)
    .filter((user) => filters.noAvatar || !isDefaultAvatar(user))
    .filter((user) => {
      if (!search) return true;
      return (
        user.handle.toLowerCase().includes(search) ||
        String(user.name || "").toLowerCase().includes(search)
      );
    })
    .sort((a, b) => a.handle.localeCompare(b.handle));
}
```

`getDisplayUsers` fonksiyonunu şu hale getir:

```js
export function getDisplayUsers(
  state,
  tab = state.activeTab || "nonFollowers"
) {
  const filters = { ...DEFAULT_FILTERS, ...(state.filters || {}) };
  const hidden = setOf(state.hidden);
  const search = String(state.search || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  const list = (state.users || [])
    .filter((user) => user && user.handle)
    .filter((user) => {
      if (tab === "inactive") return activityStatus(state, user) === "inactive";
      return user.followsViewer !== true;
    })
    .filter((user) => filters.showHidden || !isHidden(user, hidden))
    .filter((user) => filters.verified || !user.verified)
    .filter((user) => filters.protected || !user.protected)
    .filter((user) => filters.noAvatar || !isDefaultAvatar(user))
    .filter((user) => {
      if (!search) return true;
      return (
        user.handle.toLowerCase().includes(search) ||
        String(user.name || "").toLowerCase().includes(search)
      );
    });
  return list.sort((a, b) => {
    if (tab !== "inactive") return a.handle.localeCompare(b.handle);
    const aEntry = getActivityEntry(state, a);
    const bEntry = getActivityEntry(state, b);
    const aStamp = aEntry?.lastTweetAt === 0 ? -1 : Number(aEntry?.lastTweetAt) || 0;
    const bStamp = bEntry?.lastTweetAt === 0 ? -1 : Number(bEntry?.lastTweetAt) || 0;
    if (aStamp !== bStamp) return aStamp - bStamp;
    return a.handle.localeCompare(b.handle);
  });
}
```

- [ ] **Step 5: Add row notes, tabs, and activity rendering**

`renderRow` imzasını ve alt satırını değiştir:

```js
export function renderRow(user, state, note = "") {
```

Mevcut `@handle` satırını şu hale getir:

```js
      <span>@${escapeHTML(user.handle)} ${badgesHTML(user, t)}${
        note
          ? ` <span class="ux-row-note">${escapeHTML(note)}</span>`
          : ""
      }</span>
```

`renderEmpty` fonksiyonundan sonra ekle:

```js
function activityNote(state, user, t) {
  const entry = getActivityEntry(state, user);
  if (!entry || entry.state !== "known") return "";
  if (entry.lastTweetAt === 0) return t("activityNever");
  return t("activityLastPost", {
    time: timeAgo(entry.lastTweetAt, state.language),
  });
}

function reasonLabel(reason, t) {
  if (reason === "no-id") return t("activityReasonNoId");
  if (reason === "not-found") return t("activityReasonNotFound");
  if (reason === "template") return t("activityReasonTemplate");
  if (reason === "protected") return t("activityReasonProtected");
  if (reason === "rate") return t("activityReasonRate");
  return t("activityReasonUnavailable");
}

function renderTabs(state, t) {
  const active = state.activeTab === "inactive" ? "inactive" : "nonFollowers";
  const nonFollowers = (state.users || []).filter(
    (user) => user && user.followsViewer !== true
  ).length;
  const inactive = (state.users || []).filter(
    (user) => activityStatus(state, user) === "inactive"
  ).length;
  return `<div class="ux-tabs" role="tablist" aria-label="${escapeAttr(
    t("auditKicker")
  )}">
    <button class="ux-tab${active === "nonFollowers" ? " is-active" : ""}" role="tab" aria-selected="${
    active === "nonFollowers"
  }" data-action="tab" data-tab="nonFollowers">
      <span>${escapeHTML(t("tabNonFollowers"))}</span><span class="ux-tab-count">${nonFollowers}</span>
    </button>
    <button class="ux-tab${active === "inactive" ? " is-active" : ""}" role="tab" aria-selected="${
    active === "inactive"
  }" data-action="tab" data-tab="inactive">
      <span>${escapeHTML(t("tabInactive"))}</span><span class="ux-tab-count">${inactive}</span>
    </button>
  </div>`;
}

function renderControls(state, t) {
  const filters = { ...DEFAULT_FILTERS, ...(state.filters || {}) };
  const hidden = setOf(state.hidden);
  return `<label class="ux-search">${ICONS.search}<input data-search value="${escapeAttr(
    state.search || ""
  )}" placeholder="${escapeAttr(t("search"))}" autocomplete="off" spellcheck="false"></label>
    <div class="ux-chips">
      ${chip(t("filterVerified"), "verified", filters.verified)}
      ${chip(t("filterProtected"), "protected", filters.protected)}
      ${chip(t("filterNoAvatar"), "noAvatar", filters.noAvatar)}
      ${chip(
        filters.showHidden && hidden.size
          ? t("showHiddenCount", { count: hidden.size })
          : t("filterShowHidden"),
        "showHidden",
        filters.showHidden,
        hidden.size ? `<span class="ux-chip-count">${hidden.size}</span>` : ""
      )}
    </div>`;
}

function renderActionbar(state, t, { locked = false } = {}) {
  const users = getDisplayUsers(state);
  const selected = setOf(state.selected);
  const selectedCount = users.filter((user) => selected.has(keyOf(user))).length;
  const allSelected =
    users.length > 0 && users.every((user) => selected.has(keyOf(user)));
  const someSelected = users.some((user) => selected.has(keyOf(user)));
  return `<div class="ux-actionbar" data-actionbar>
    <label class="ux-check"><input type="checkbox" data-select-all ${
      allSelected ? "checked" : ""
    } data-indeterminate="${someSelected && !allSelected ? "1" : "0"}">${escapeHTML(
      t("selectAll")
    )}</label>
    <button class="ux-link" data-action="select-none">${escapeHTML(
      t("selectNone")
    )}</button>
    <span class="ux-spacer"></span>
    <button class="ux-btn ux-btn-ghost" data-action="copy-all">${escapeHTML(
      t("copyAll")
    )}</button>
    <button class="ux-btn ux-btn-primary" data-action="unfollow" ${
      selectedCount === 0 || state.unverified || locked ? "disabled" : ""
    } data-unfollow-label>${escapeHTML(t("unfollow"))}${
      selectedCount ? ` (${selectedCount})` : ""
    }</button>
  </div>`;
}

function renderUnknownRow(user, state, t) {
  const entry = getActivityEntry(state, user);
  const reason = reasonLabel(entry?.reason, t);
  return `<div class="ux-row ux-row-muted">
    <span class="ux-row-spacer" aria-hidden="true"></span>
    <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener" aria-label="${escapeAttr(
      t("openOnX")
    )}">${avatarHTML(user)}</a>
    <div class="ux-user">
      <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener"><strong>${escapeHTML(
        user.name || user.handle
      )}</strong></a>
      <span>@${escapeHTML(user.handle)} <span class="ux-badge ux-badge-muted">${escapeHTML(
        reason
      )}</span></span>
    </div>
    <div class="ux-row-actions">
      <button class="ux-icon-btn" data-copy="${escapeAttr(
        user.handle
      )}" title="${escapeAttr(t("copyHandle", { handle: user.handle }))}" aria-label="${escapeAttr(
        t("copyHandle", { handle: user.handle })
      )}">${ICONS.copy}</button>
      <a class="ux-icon-btn" href="${escapeAttr(
        profileUrl(user.handle)
      )}" target="_blank" rel="noreferrer noopener" title="${escapeAttr(
        t("openOnX")
      )}" aria-label="${escapeAttr(t("openOnX"))}">${ICONS.external}</a>
    </div>
  </div>`;
}

function renderUnknownSection(state, t) {
  const users = getUnknownActivityUsers(state);
  if (!users.length) return "";
  return `<details class="ux-unknown" data-activity-unknown-list>
    <summary>${escapeHTML(t("activityUnknownCount", { count: users.length }))}</summary>
    ${users.map((user) => renderUnknownRow(user, state, t)).join("")}
  </details>`;
}

function renderActivityEmpty(state, t) {
  if (state.activity?.status === "scanning" || state.activity?.status === "paused") {
    return `<div class="ux-empty"><strong>${escapeHTML(
      t("activityLiveEmpty")
    )}</strong></div>`;
  }
  const hasInactive = (state.users || []).some(
    (user) => activityStatus(state, user) === "inactive"
  );
  if (!hasInactive) {
    return `<div class="ux-empty"><strong>${escapeHTML(
      t("activityNone")
    )}</strong>${escapeHTML(t("activityStart"))}</div>`;
  }
  return `<div class="ux-empty"><strong>${escapeHTML(
    t("noMatches")
  )}</strong>${escapeHTML(t("selectHint"))}</div>`;
}

function renderActivityProgress(state, t) {
  const activity = state.activity || {};
  const checked = Number(activity.checked) || 0;
  const total = Number(activity.total) || 0;
  const percent = total ? clamp((checked / total) * 100, 0, 100) : 0;
  const paused = activity.status === "paused";
  return `<div class="ux-card ux-activity-progress">
    <div class="ux-card-line"><span class="ux-live-dot${
      paused ? " is-paused" : ""
    }"></span><strong>${escapeHTML(
      paused ? t("paused") : t("activityScanning")
    )}</strong><span class="ux-muted" data-activity-source>${escapeHTML(
      activity.source === "graphql" ? t("activitySourceProfile") : t("activitySourceBatch")
    )}</span></div>
    <div class="ux-bar"><i data-activity-bar style="width:${percent}%"></i></div>
    <div class="ux-card-line"><span data-activity-current>${escapeHTML(
      t("activityCurrent", { handle: activity.current || "?" })
    )}</span><span class="ux-muted" data-activity-progress>${escapeHTML(
      t("activityProgress", { checked, total })
    )}</span></div>
    <div class="ux-card-line"><span class="ux-muted" data-activity-found>${escapeHTML(
      t("activityFound", { count: Number(activity.inactive) || 0 })
    )}</span><span class="ux-muted" data-activity-unknown-live>${escapeHTML(
      t("activityUnknownCount", { count: Number(activity.unknown) || 0 })
    )}</span></div>
    <div class="ux-card-actions">
      <button class="ux-btn ux-btn-soft" data-action="${
        paused ? "resume-activity" : "pause-activity"
      }" data-activity-toggle>${escapeHTML(
        paused ? t("resume") : t("pause")
      )}</button>
      <button class="ux-btn ux-btn-ghost" data-action="cancel-activity">${escapeHTML(
        t("cancel")
      )}</button>
    </div>
    <div class="ux-muted" data-activity-hint>${escapeHTML(
      countdownText(state) || t("activityHint")
    )}</div>
  </div>`;
}

function renderActivityView(state, t) {
  const users = getDisplayUsers(state, "inactive");
  const hasUsers = (state.users || []).some((user) => user && user.handle);
  const hasData = Object.values(state.activityEntries || {}).some((entry) =>
    isActivityFresh(entry)
  );
  const scanning =
    state.activity?.status === "scanning" || state.activity?.status === "paused";
  const partial = Boolean(state.activityScan && !state.activityScan.complete);
  const warnings = [];
  if (state.unverified) {
    warnings.push(
      `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
        t("unverified")
      )}</span></div>`
    );
  }
  if (state.partial) {
    warnings.push(
      `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
        t("partialBody", { count: state.scan?.scanned || (state.users || []).length })
      )}</span></div>`
    );
  }
  if (partial && !scanning) {
    warnings.push(
      `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
        t("activityPartial", { count: Number(state.activityScan?.checked) || 0 })
      )}</span></div>`
    );
  }
  if (activityError(state)) {
    warnings.push(
      `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
        activityError(state)
      )}</span></div>`
    );
  }

  const header = `<div class="ux-results-head">
    <div>
      <span class="ux-eyebrow">${escapeHTML(t("activityKicker"))}</span>
      <div class="ux-hero-count">
        <strong data-activity-count>${users.length}</strong>
        <span data-activity-unit>${escapeHTML(
          users.length === 1 ? t("activityUnitOne") : t("activityUnit")
        )}</span>
      </div>
    </div>
    <div class="ux-results-links">
      ${
        scanning
          ? ""
          : `<button class="ux-link" data-action="start-activity">${escapeHTML(
              partial ? t("resume") : hasData ? t("rescan") : t("activityStart")
            )}</button>`
      }
      ${
        hasData && !scanning
          ? `<button class="ux-link" data-action="clear-activity">${escapeHTML(
              t("activityClear")
            )}</button>`
          : ""
      }
    </div>
  </div>`;

  if (!hasUsers) {
    return `<div class="ux-results-body ux-activity" data-activity-view>
      ${header}
      ${warnings.join("")}
      <div class="ux-empty"><strong>${escapeHTML(
        t("activityNeedsScan")
      )}</strong>${escapeHTML(t("navigateHint"))}</div>
    </div>`;
  }

  if (!hasData && !scanning) {
    return `<div class="ux-results-body ux-activity" data-activity-view>
      ${header}
      ${warnings.join("")}
      <div class="ux-activity-intro">
        <p>${escapeHTML(t("activityBody"))}</p>
        <button class="ux-btn ux-btn-primary ux-btn-block" data-action="start-activity">${escapeHTML(
          t("activityStart")
        )}</button>
      </div>
    </div>`;
  }

  const subline = `<div class="ux-subline">
    <span data-activity-progress>${escapeHTML(
      t("activityProgress", {
        checked: Number(state.activity?.checked) || 0,
        total: Number(state.activity?.total) || 0,
      })
    )}</span>
    <span data-activity-unknown>${escapeHTML(
      t("activityUnknownCount", { count: getUnknownActivityUsers(state).length })
    )}</span>
    <span data-hidden-count>${escapeHTML(
      t("hiddenCount", { count: setOf(state.hidden).size })
    )}</span>
  </div>`;

  const lastChecked = Math.max(
    0,
    ...Object.values(state.activityEntries || {})
      .filter((entry) => isActivityFresh(entry))
      .map((entry) => Number(entry?.checkedAt) || 0)
  );
  const lastCheck = lastChecked
    ? `<div class="ux-muted">${escapeHTML(
        t("activityLastCheck", {
          time: timeAgo(lastChecked, state.language),
        })
      )}</div>`
    : "";

  return `<div class="ux-results-body ux-activity" data-activity-view>
    ${header}
    ${scanning ? renderActivityProgress(state, t) : subline}
    ${scanning ? "" : lastCheck}
    ${warnings.join("")}
    ${scanning ? "" : renderControls(state, t)}
    <div class="ux-list" data-activity-list>${users
      .map((user) => renderRow(user, state, activityNote(state, user, t)))
      .join("") || renderActivityEmpty(state, t)}</div>
    <div data-activity-unknown-host>${renderUnknownSection(state, t)}</div>
    ${
      scanning
        ? ""
        : renderActionbar(state, t, { locked: false })
    }
  </div>`;
}

function activityError(state) {
  const activity = state.activity || {};
  if (!activity.error) return "";
  return activity.error;
}
```

- [ ] **Step 6: Split the existing results view**

Mevcut `export function renderResultsView(state) { ... }` fonksiyonunu `function renderNonFollowersView(state, t) { ... }` olarak yeniden adlandır. Fonksiyonun gövdesindeki `<section class="ux-view ux-results" data-view="results">` ve kapanış `</section>` etiketlerini kaldır; içeriği bir `<div class="ux-results-body" data-nonfollowers-view>` içine al. Search/chips bloğunu `renderControls(state, t)` ile, actionbar bloğunu `renderActionbar(state, t)` ile değiştir.

Ardından dosyaya şu yeni `renderResultsView` fonksiyonunu ekle:

```js
export function renderResultsView(state) {
  const t = makeT(state.language);
  return `<section class="ux-view ux-results" data-view="results">
    ${renderTabs(state, t)}
    ${
      state.activeTab === "inactive"
        ? renderActivityView(state, t)
        : renderNonFollowersView(state, t)
    }
  </section>`;
}
```

`renderNonFollowersView` içindeki `const users = getDisplayUsers(state);` satırını `const users = getDisplayUsers(state, "nonFollowers");` yap. Mevcut `data-list`, `data-result-count`, `data-select-all` ve `data-action="unfollow"` işaretlerini koru; `renderActionbar` bu işaretleri üretir.

- [ ] **Step 7: Add CSS**

`src/ui.js` içindeki CSS şablonunda `.ux-row-actions svg` kuralından sonra ekle:

```css
#${APP_ID} .ux-tabs {
  display: flex; gap: 4px; margin: 0 0 14px;
  border-bottom: 1px solid var(--ux-line-soft);
}
#${APP_ID} .ux-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; border-bottom: 2px solid transparent; background: transparent;
  color: var(--ux-muted); font: inherit; font-size: 11px; padding: 8px 4px;
  cursor: pointer;
}
#${APP_ID} .ux-tab.is-active { color: var(--ux-text); border-bottom-color: var(--ux-text); }
#${APP_ID} .ux-tab-count { font-size: 10px; color: var(--ux-muted); }
#${APP_ID} .ux-tab.is-active .ux-tab-count { color: var(--ux-text); }
#${APP_ID} .ux-row-note { color: var(--ux-muted); font-size: 10px; white-space: nowrap; }
#${APP_ID} .ux-row-spacer { width: 13px; }
#${APP_ID} .ux-row-muted { opacity: .78; }
#${APP_ID} .ux-unknown {
  margin-top: 10px; padding-top: 8px; border-top: 1px solid var(--ux-line-soft);
}
#${APP_ID} .ux-unknown summary {
  cursor: pointer; color: var(--ux-muted); font-size: 10.5px;
}
#${APP_ID} .ux-activity-intro { padding: 14px 0; }
#${APP_ID} .ux-activity-intro p {
  color: var(--ux-muted); font-size: 11.5px; line-height: 1.5; margin: 0 0 12px;
}
#${APP_ID} .ux-card-actions { display: flex; gap: 6px; margin-top: 10px; }
```

- [ ] **Step 8: Run tests**

Run: `node --test tests/ui.test.js`
Expected: PASS (existing UI tests + 4 new display tests).

- [ ] **Step 9: Commit**

```bash
git add src/ui.js tests/ui.test.js
git commit -m "feat: render inactive accounts tab"
```

---

### Task 8: UI etkileşimleri, ayarlar ve pasif takipten çıkarma onayı

**Files:**
- Modify: `src/ui.js`
- Modify: `tests/ui.test.js`

- [ ] **Step 1: Write the failing interaction tests**

`tests/ui.test.js` sonuna ekle:

```js
test("mounted panel switches tabs, clears selection, and starts activity", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activityEntries = {
    "1": {
      id: "1",
      handle: "alice",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  const actions = [];
  const ui = mountUI({
    state: s,
    onAction: (action) => actions.push(action),
  });
  dom.window.document.querySelector('[data-tab="inactive"]').click();
  assert.equal(s.activeTab, "inactive");
  assert.equal(s.selected.size, 0);
  dom.window.document.querySelector('[data-action="start-activity"]').click();
  assert.deepEqual(actions, ["start-activity"]);
  ui.destroy();
});

test("settings form includes the inactivity threshold", () => {
  const html = settingsHTML(state().timings, "en", 30);
  assert.match(html, /data-setting="activityDays"/);
  assert.equal(readSettings(new JSDOM(`<div>${html}</div>`).window.document.querySelector("div")).activityDays, 30);
});

test("passive unfollow confirmation warns about accounts that follow you", () => {
  const dom = new JSDOM("<!doctype html><html><head></head><body></body></html>");
  global.document = dom.window.document;
  global.window = dom.window;
  const s = state();
  s.activeTab = "inactive";
  s.selected = new Set(["3"]);
  s.activityEntries = {
    "3": {
      id: "3",
      handle: "carol",
      state: "known",
      lastTweetAt: 0,
      checkedAt: Date.now(),
    },
  };
  mountUI({ state: s });
  dom.window.document.querySelector('[data-action="unfollow"]').click();
  const dialog = dom.window.document.querySelector('[role="dialog"]');
  assert.match(dialog.textContent, /follow you/i);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/ui.test.js`
Expected: FAIL because tab/activity actions and the settings field do not exist.

- [ ] **Step 3: Add activity update logic to `mountUI`**

`mountUI` içindeki `updateResults` fonksiyonundan önce ekle:

```js
  const updateActivity = () => {
    const users = getDisplayUsers(state);
    const list = root.querySelector("[data-activity-list]");
    if (list) {
      const signature = users.map(keyOf).join("|");
      if (list.getAttribute("data-signature") !== signature) {
        list.innerHTML = users.length
          ? users
              .map((user) =>
                renderRow(user, state, activityNote(state, user, t()))
              )
              .join("")
          : renderActivityEmpty(state, t());
        list.setAttribute("data-signature", signature);
      }
    }
    const unknownHost = root.querySelector("[data-activity-unknown-host]");
    if (unknownHost) {
      const unknown = getUnknownActivityUsers(state);
      const signature = unknown.map(keyOf).join("|");
      if (unknownHost.getAttribute("data-signature") !== signature) {
        unknownHost.innerHTML = renderUnknownSection(state, t());
        unknownHost.setAttribute("data-signature", signature);
      }
    }
    const count = root.querySelector("[data-activity-count]");
    if (count) count.textContent = String(users.length);
    const inactiveTab = root.querySelector(
      '[data-tab="inactive"] .ux-tab-count'
    );
    if (inactiveTab) {
      inactiveTab.textContent = String(
        (state.users || []).filter(
          (user) => activityStatus(state, user) === "inactive"
        ).length
      );
    }
    const unit = root.querySelector("[data-activity-unit]");
    if (unit) {
      unit.textContent =
        users.length === 1 ? t()("activityUnitOne") : t()("activityUnit");
    }
    const progress = root.querySelector("[data-activity-progress]");
    if (progress) {
      progress.textContent = t()("activityProgress", {
        checked: Number(state.activity?.checked) || 0,
        total: Number(state.activity?.total) || 0,
      });
    }
    const bar = root.querySelector("[data-activity-bar]");
    if (bar) {
      const total = Number(state.activity?.total) || 0;
      const checked = Number(state.activity?.checked) || 0;
      bar.style.width = `${total ? clamp((checked / total) * 100, 0, 100) : 0}%`;
    }
    const current = root.querySelector("[data-activity-current]");
    if (current) {
      current.textContent = t()("activityCurrent", {
        handle: state.activity?.current || "?",
      });
    }
    const found = root.querySelector("[data-activity-found]");
    if (found) {
      found.textContent = t()("activityFound", {
        count: Number(state.activity?.inactive) || 0,
      });
    }
    const unknownLive = root.querySelector("[data-activity-unknown-live]");
    if (unknownLive) {
      unknownLive.textContent = t()("activityUnknownCount", {
        count: Number(state.activity?.unknown) || 0,
      });
    }
    const unknownSubline = root.querySelector("[data-activity-unknown]");
    if (unknownSubline) {
      unknownSubline.textContent = t()("activityUnknownCount", {
        count: getUnknownActivityUsers(state).length,
      });
    }
    const hiddenCount = root.querySelector("[data-hidden-count]");
    if (hiddenCount) {
      hiddenCount.textContent = t()("hiddenCount", {
        count: setOf(state.hidden).size,
      });
    }
    const source = root.querySelector("[data-activity-source]");
    if (source) {
      source.textContent =
        state.activity?.source === "graphql"
          ? t()("activitySourceProfile")
          : t()("activitySourceBatch");
    }
    const hint = root.querySelector("[data-activity-hint]");
    if (hint) {
      hint.textContent = countdownText(state) || t()("activityHint");
    }
    const toggle = root.querySelector("[data-activity-toggle]");
    if (toggle) {
      const paused = state.activity?.status === "paused";
      toggle.setAttribute(
        "data-action",
        paused ? "resume-activity" : "pause-activity"
      );
      toggle.textContent = paused ? t()("resume") : t()("pause");
    }
    const selectedCount = visibleSelectedCount(state);
    const unfollow = root.querySelector('[data-action="unfollow"]');
    if (unfollow) {
      unfollow.disabled =
        selectedCount === 0 ||
        Boolean(state.unverified) ||
        state.activity?.status === "scanning" ||
        state.activity?.status === "paused";
      unfollow.textContent = `${t()("unfollow")}${
        selectedCount ? ` (${selectedCount})` : ""
      }`;
    }
    const selectAll = root.querySelector("[data-select-all]");
    if (selectAll) {
      const selected = setOf(state.selected);
      const all =
        users.length > 0 && users.every((user) => selected.has(keyOf(user)));
      const some = users.some((user) => selected.has(keyOf(user)));
      selectAll.checked = all;
      selectAll.indeterminate = some && !all;
    }
    root.querySelectorAll("[data-filter]").forEach((button) => {
      const key = button.getAttribute("data-filter");
      button.classList.toggle("is-on", Boolean(state.filters?.[key]));
    });
  };
```

`updateResults` fonksiyonunun başına ekle:

```js
    if ((state.activeTab || "nonFollowers") === "inactive") {
      updateActivity();
      return;
    }
```

- [ ] **Step 4: Add actions and tab switching**

`onClick` içindeki `actions` kümesine ekle:

```js
        "tab",
        "start-activity",
        "pause-activity",
        "resume-activity",
        "cancel-activity",
        "clear-activity",
```

`onClick` içindeki `if (actions.has(action))` bloğuna şu dalları ekle:

```js
        if (action === "tab") {
          const tab = actionElement.getAttribute("data-tab");
          if (tab === "inactive" || tab === "nonFollowers") {
            state.activeTab = tab;
            state.selected = new Set();
            onChange();
            render();
          }
          return;
        }
        if (action === "clear-activity") {
          showDialog({
            title: t()("activityClearTitle"),
            body: t()("activityClearBody"),
            confirmLabel: t()("activityClear"),
            cancelLabel: t()("cancel"),
            destructive: true,
            onConfirm: () => onAction("clear-activity"),
          });
          return;
        }
        if (
          action === "start-activity" ||
          action === "pause-activity" ||
          action === "resume-activity" ||
          action === "cancel-activity"
        ) {
          onAction(action);
          return;
        }
```

- [ ] **Step 5: Make the unfollow confirmation tab-aware**

`confirmUnfollow` fonksiyonunu şu hale getir:

```js
  const confirmUnfollow = () => {
    const selected = selectedUsers(state);
    if (!selected.length) {
      toast(t()("noSelection"));
      return;
    }
    if (state.unverified) return;
    const count = selected.length;
    const activityTab = state.activeTab === "inactive";
    const followers = selected.filter(
      (user) => user.followsViewer === true
    ).length;
    showDialog({
      title: activityTab
        ? t()("activityUnfollowTitle", { count })
        : t()("unfollowConfirmTitle", { count }),
      body: activityTab
        ? t()("activityUnfollowBody")
        : t()("unfollowConfirmBody"),
      contentHTML:
        activityTab && followers
          ? `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
              t()("activityFollowsWarning", { count: followers })
            )}</span></div>`
          : "",
      confirmLabel: t()("unfollowConfirmBtn", { count }),
      cancelLabel: t()("cancel"),
      destructive: true,
      onConfirm: () => onAction("start-unfollow"),
    });
  };
```

- [ ] **Step 6: Add the settings field**

`settingsHTML` imzasını değiştir:

```js
export function settingsHTML(
  timings = {},
  language = "en",
  activityDays = ACTIVITY_DEFAULT_DAYS
) {
```

`settingsScan` grubunun sonuna ekle:

```js
      ${field(t("activityDays"), "activityDays", activityDays, {
        min: 1,
        max: 365,
      })}
```

`readSettings` imzasını değiştir:

```js
export function readSettings(root, activityDaysFallback = ACTIVITY_DEFAULT_DAYS) {
```

Dönüş nesnesine ekle:

```js
    activityDays: Math.round(
      clamp(read("activityDays", activityDaysFallback), 1, 365)
    ),
```

`mountUI` içindeki `openSettings` çağrısını güncelle:

```js
      contentHTML: settingsHTML(
        state.timings,
        state.language,
        state.activityDays ?? ACTIVITY_DEFAULT_DAYS
      ),
```

`onConfirm` içinde:

```js
        const timings = readSettings(
          overlay,
          state.activityDays ?? ACTIVITY_DEFAULT_DAYS
        );
        state.timings = timings;
        state.activityDays = timings.activityDays;
        onAction("save-settings", timings);
```

- [ ] **Step 7: Update countdown and pill labels**

`countdownText` içine `unfollow.nextAt` kontrolünden önce ekle:

```js
  if (Number(state.activity?.nextAt) > now) {
    return t("nextActionIn", {
      seconds: Math.ceil((Number(state.activity.nextAt) - now) / 1000),
    });
  }
```

`pillLabel` içindeki `results`/`done` dalını şu hale getir:

```js
  if (state.mode === "results" || state.mode === "done") {
    if (state.activity?.status === "scanning" || state.activity?.status === "paused") {
      return t("pillActivity");
    }
    if (state.activeTab === "inactive") {
      return t("pillInactive", { count: getDisplayUsers(state).length });
    }
    return t("pillResults", { count: getDisplayUsers(state).length });
  }
```

- [ ] **Step 8: Run tests**

Run: `node --test tests/ui.test.js`
Expected: PASS (existing + new interaction tests).

- [ ] **Step 9: Commit**

```bash
git add src/ui.js tests/ui.test.js
git commit -m "feat: wire activity tab interactions"
```

---

### Task 9: Main durum modeli ve aktivite taraması orkestrasyonu

**Files:**
- Modify: `src/main.js`
- Modify: `tests/main.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/main.test.js` başındaki import'a `createState` ekle:

```js
import {
  mergeScan,
  canUnfollow,
  coverageFrom,
  createState,
  boot,
} from "../src/main.js";
```

Dosyanın sonuna ekle:

```js
test("createState includes activity defaults", () => {
  const state = createState();
  assert.equal(state.activeTab, "nonFollowers");
  assert.equal(state.activityDays, 30);
  assert.deepEqual(state.activityEntries, {});
  assert.equal(state.activity.status, "idle");
});

test("boot loads fresh activity cache for the viewer", () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    localStorage: globalThis.localStorage,
  };
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    dom.window.localStorage.setItem(
      "ux_state_v1",
      JSON.stringify({ activityDays: 45 })
    );
    dom.window.localStorage.setItem(
      "ux_activity_v1",
      JSON.stringify({
        version: 1,
        viewerHandle: "me",
        savedAt: Date.now(),
        entries: {
          "1": {
            id: "1",
            handle: "alice",
            state: "known",
            lastTweetAt: 0,
            checkedAt: Date.now(),
            source: "lookup",
          },
        },
      })
    );
    state = boot();
    assert.equal(state.activityDays, 45);
    assert.equal(state.activityEntries["1"].handle, "alice");
    assert.equal(state.activity.status, "done");
    assert.equal(state.activity.inactive, 1);
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    dom.window.close();
  }
});

test("activity scan from the inactive tab fills the cache and renders results", async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  dom.window.document.cookie = "ct0=test; path=/";
  const originalFetch = globalThis.fetch;
  const oldDate = new Date(Date.now() - 40 * 86400000).toUTCString();
  const recentDate = new Date(Date.now() - 86400000).toUTCString();
  const fakeFetch = async (url) => {
    const parsed = new URL(url);
    if (parsed.pathname.endsWith("/users/lookup.json")) {
      const ids = (parsed.searchParams.get("user_id") || "")
        .split(",")
        .filter(Boolean);
      return new Response(
        JSON.stringify(
          ids.map((id) => ({
            id_str: id,
            screen_name: id === "1" ? "alice" : id === "2" ? "bob" : "carol",
            statuses_count: id === "3" ? 0 : 1,
            status:
              id === "3"
                ? undefined
                : {
                    created_at: id === "1" ? recentDate : oldDate,
                  },
          }))
        ),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    localStorage: globalThis.localStorage,
    fetch: globalThis.fetch,
  };
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    set("fetch", fakeFetch);
    state = boot();
    state.users = [
      { id: "1", handle: "alice", name: "Alice", followsViewer: false },
      { id: "2", handle: "bob", name: "Bob", followsViewer: false },
      { id: "3", handle: "carol", name: "Carol", followsViewer: true },
    ];
    state.mode = "results";
    state.unverified = false;
    state.partial = false;
    state.timings = {
      ...state.timings,
      scanDelayMin: 0,
      scanDelayMax: 0,
      scanPauseEveryPages: 0,
      scanPauseMs: 0,
    };
    state.ui.render();
    dom.window.document.querySelector('[data-tab="inactive"]').click();
    dom.window.document.querySelector('[data-action="start-activity"]').click();
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (state.activity.status === "done" || Date.now() - started > 3000) {
          return resolve();
        }
        setTimeout(tick, 25);
      };
      tick();
    });
    assert.equal(state.activity.status, "done");
    assert.equal(Object.keys(state.activityEntries).length, 3);
    assert.equal(state.activityEntries["2"].state, "known");
    assert.equal(state.activityEntries["3"].lastTweetAt, 0);
    assert.match(
      dom.window.document.querySelector('[data-view="results"]').textContent,
      /Bob/
    );
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    globalThis.fetch = originalFetch;
    dom.window.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/main.test.js`
Expected: FAIL because `createState` has no activity fields and the activity scan action does nothing.

- [ ] **Step 3: Add imports and module helpers**

`src/main.js` config import'a ekle:

```js
  ACTIVITY_DEFAULT_DAYS,
  ACTIVITY_MIN_DAYS,
  ACTIVITY_MAX_DAYS,
```

utils import'a ekle:

```js
  clamp,
```

storage import'a ekle:

```js
  loadActivity,
  saveActivity,
  clearActivity as clearActivityStore,
  loadActivityScan,
  saveActivityScan,
  clearActivityScan,
```

capture import'a ekle:

```js
  getCapturedActivity,
```

Yeni import ekle:

```js
import {
  runActivityScan,
  classifyActivity,
  activityEntryFor,
  isActivityFresh,
} from "./activity.js";
```

`coverageFrom` fonksiyonundan sonra ekle:

```js
function idleActivity() {
  return {
    status: "idle",
    checked: 0,
    total: 0,
    inactive: 0,
    unknown: 0,
    current: "",
    source: "lookup",
    error: "",
    nextAt: 0,
    startedAt: 0,
  };
}

function hydrateActivityCounters(state) {
  const entries = Object.values(state.activityEntries || {}).filter((entry) =>
    isActivityFresh(entry)
  );
  const inactive = entries.filter(
    (entry) => classifyActivity(entry, state.activityDays) === "inactive"
  ).length;
  const unknown = entries.filter((entry) => entry.state === "unknown").length;
  state.activity = {
    ...idleActivity(),
    status: entries.length ? "done" : "idle",
    checked: entries.length,
    total: entries.length,
    inactive,
    unknown,
  };
}

function pruneActivityCache(state) {
  if (!state.viewer.handle) return;
  const keys = new Set();
  for (const user of state.users || []) {
    if (!user || !user.handle) continue;
    if (user.id) keys.add(String(user.id));
    keys.add(user.handle.toLowerCase());
  }
  for (const key of Object.keys(state.activityEntries)) {
    if (!keys.has(key)) delete state.activityEntries[key];
  }
  saveActivity(undefined, state.viewer.handle, state.activityEntries);
  hydrateActivityCounters(state);
}
```

- [ ] **Step 4: Extend state and persistence**

`createState` başındaki `const stored = loadState();` satırından sonra ekle:

```js
  const activityDays = clamp(
    Number(stored.activityDays) || ACTIVITY_DEFAULT_DAYS,
    ACTIVITY_MIN_DAYS,
    ACTIVITY_MAX_DAYS
  );
```

Dönüş nesnesine ekle:

```js
    activeTab: "nonFollowers",
    activityDays,
    activityEntries: {},
    activityScan: null,
    activity: idleActivity(),
```

`persist` içindeki `persistState` nesnesine ekle:

```js
    activityDays: state.activityDays,
```

- [ ] **Step 5: Load activity on boot and viewer change**

`boot` içindeki `resolveHandle(state);` satırından sonra ekle:

```js
  state.activityEntries = loadActivity(undefined, state.viewer.handle);
  state.activityScan = loadActivityScan(undefined, state.viewer.handle);
  hydrateActivityCounters(state);
```

`setHandle` içindeki `state.lastScan = loadLastScan(undefined, handle);` satırından sonra ekle:

```js
    state.activityEntries = loadActivity(undefined, handle);
    state.activityScan = loadActivityScan(undefined, handle);
    hydrateActivityCounters(state);
    state.activeTab = "nonFollowers";
```

`startScan` içindeki `state.error = "";` satırından sonra ekle:

```js
    state.activeTab = "nonFollowers";
    state.activityScan = null;
    clearActivityScan(undefined);
```

`finishScan` içindeki `snapshotLastScan();` satırından sonra ekle:

```js
    if (!truncated) pruneActivityCache(state);
```

`showLastScan` içindeki `state.lastScan = scan;` satırından sonra ekle:

```js
    state.activityEntries = loadActivity(undefined, state.viewer.handle);
    state.activityScan = loadActivityScan(undefined, state.viewer.handle);
    hydrateActivityCounters(state);
    state.activeTab = "nonFollowers";
```

- [ ] **Step 6: Add the activity scan orchestration**

`boot` içindeki `let pauseTimer = null;` satırından sonra ekle:

```js
  let activityUiTimer = null;
  let activityUiAt = 0;
  let activityCacheWarned = false;
```

`activeSleep` fonksiyonundan sonra ekle:

```js
  const scheduleActivityUi = (force = false) => {
    if (state.disposed) return;
    if (force) {
      activityUiAt = Date.now();
      ui.update();
      return;
    }
    const wait = 500 - (Date.now() - activityUiAt);
    if (wait <= 0) {
      activityUiAt = Date.now();
      ui.update();
      return;
    }
    if (activityUiTimer) return;
    activityUiTimer = setTimeout(() => {
      activityUiTimer = null;
      activityUiAt = Date.now();
      if (!state.disposed) ui.update();
    }, wait);
  };

  const saveActivityCache = () => {
    if (!state.viewer.handle) return true;
    return saveActivity(
      undefined,
      state.viewer.handle,
      state.activityEntries
    );
  };

  const persistActivity = () => {
    const ok = saveActivityCache();
    if (!ok && !activityCacheWarned) {
      activityCacheWarned = true;
      ui.toast(t()("activityCacheWarning"));
    }
    if (state.activityScan) {
      state.activityScan.checked = Number(state.activity.checked) || 0;
      state.activityScan.total = Number(state.activity.total) || 0;
      saveActivityScan(undefined, state.activityScan);
    }
  };
```

`showLastScan` fonksiyonundan sonra, `startUnfollow` fonksiyonundan önce ekle:

```js
  async function startActivityScan() {
    if (state.active.running || state.disposed) return;
    if (!(state.users || []).some((user) => user && user.handle)) {
      ui.toast(t()("activityNeedsScan"));
      return;
    }
    if (Date.now() < Number(state.cooldownUntil)) {
      ui.toast(
        t()("cooldownIn", { time: formatClock(state.cooldownUntil) })
      );
      return;
    }
    const session = ensureSession();
    if (!session) return;

    const candidates = state.users.filter(
      (user) =>
        user &&
        user.handle &&
        !isActivityFresh(activityEntryFor(state.activityEntries, user))
    );
    if (!candidates.length) {
      state.activeTab = "inactive";
      state.mode = "results";
      state.activityScan = null;
      clearActivityScan(undefined);
      hydrateActivityCounters(state);
      ui.render();
      ui.toast(t()("activityFresh"));
      return;
    }

    state.activeTab = "inactive";
    state.mode = "results";
    state.error = "";
    state.paused = false;
    state.cooldownUntil = 0;
    state.scanPauseUntil = 0;
    state.activity = {
      ...idleActivity(),
      status: "scanning",
      total: candidates.length,
      source: "lookup",
      startedAt: Date.now(),
    };
    state.activityScan = {
      viewerHandle: state.viewer.handle,
      startedAt: Date.now(),
      checked: 0,
      total: candidates.length,
      complete: false,
      stopped: null,
    };
    saveActivityScan(undefined, state.activityScan);
    state.active = {
      running: true,
      paused: false,
      cancelled: false,
      abort: new AbortController(),
      wake: null,
    };
    activityCacheWarned = false;
    ui.render();

    const onResult = (user, entry) => {
      if (state.disposed) return;
      const key = String(entry.id || user.handle.toLowerCase());
      const handleKey = String(user.handle || "").toLowerCase();
      if (entry.id && state.activityEntries[handleKey]) {
        delete state.activityEntries[handleKey];
      }
      state.activityEntries[key] = entry;
      if (!user.id && entry.id) user.id = entry.id;
      state.activity.checked = (Number(state.activity.checked) || 0) + 1;
      state.activity.current = user.handle;
      state.activity.source = entry.source || state.activity.source;
      if (entry.state === "unknown") {
        state.activity.unknown = (Number(state.activity.unknown) || 0) + 1;
      } else if (classifyActivity(entry, state.activityDays) === "inactive") {
        state.activity.inactive = (Number(state.activity.inactive) || 0) + 1;
      }
      scheduleActivityUi();
    };

    const onProgress = (event) => {
      if (state.disposed) return;
      if (event.kind === "delay") {
        state.activity.nextAt = Date.now() + Number(event.ms || 0);
        scheduleActivityUi();
        return;
      }
      if (event.kind === "pause") {
        state.scanPauseUntil = Date.now() + Number(event.ms || 0);
        scheduleActivityUi();
        return;
      }
      if (event.kind === "paused") {
        if (state.activity.status !== "paused") {
          state.activity.status = "paused";
          scheduleActivityUi(true);
        }
        return;
      }
      if (event.kind === "fallback") {
        state.activity.source = "graphql";
        ui.toast(t()("activityFallback"));
        scheduleActivityUi(true);
        return;
      }
      if (event.kind === "template-broken") {
        ui.toast(t()("activityGraphqlHint"));
        return;
      }
      if (event.kind === "checkpoint") {
        persistActivity();
        scheduleActivityUi(true);
        return;
      }
      if (event.kind === "result") {
        state.activity.source = event.source || state.activity.source;
        scheduleActivityUi();
      }
    };

    try {
      const result = await runActivityScan({
        users: candidates,
        cache: state.activityEntries,
        days: state.activityDays,
        csrf: session.csrf,
        origin: session.origin,
        template: getCapturedActivity(),
        fetchImpl: globalThis.fetch,
        sleepFn: (ms) => activeSleep(ms),
        random: Math.random,
        timings: state.timings,
        onResult,
        onProgress,
        shouldPause: () => state.active.paused,
        shouldCancel: () => state.active.cancelled,
        signal: state.active.abort.signal,
      });
      if (state.disposed) return;
      const entries = Object.values(state.activityEntries || {}).filter(
        (entry) => isActivityFresh(entry)
      );
      state.activity.status = "done";
      state.activity.nextAt = 0;
      state.scanPauseUntil = 0;
      state.activity.checked = entries.length;
      state.activity.total = entries.length;
      state.activity.inactive = entries.filter(
        (entry) => classifyActivity(entry, state.activityDays) === "inactive"
      ).length;
      state.activity.unknown = entries.filter(
        (entry) => entry.state === "unknown"
      ).length;
      state.activity.source = result.source || state.activity.source;
      state.activityScan = null;
      clearActivityScan(undefined);
      persistActivity();
      state.active.running = false;
      state.active.paused = false;
      state.active.wake = null;
      state.paused = false;
      ui.render();
      ui.toast(
        t()("activityDoneToast", { count: state.activity.inactive })
      );
    } catch (error) {
      if (state.disposed) return;
      state.active.running = false;
      state.active.paused = false;
      state.active.wake = null;
      state.paused = false;
      state.activity.nextAt = 0;
      state.scanPauseUntil = 0;
      const aborted =
        state.active.cancelled || error?.kind === "aborted";
      if (aborted) {
        state.activity.status = "idle";
        state.activity.error = "";
        if (state.activityScan) state.activityScan.stopped = "cancel";
      } else {
        state.activity.status = "error";
        if (error?.kind === "rate") {
          state.cooldownUntil =
            Number(error.resetAt) ||
            Date.now() + Number(error.retryAfter || COOLDOWN_MS.rate);
          state.activity.error = t()("tooManyRequests", {
            time: formatClock(state.cooldownUntil),
          });
        } else if (error?.kind === "auth") {
          state.activity.error = t()("sessionExpired");
        } else if (error?.kind === "blocked") {
          state.activity.error = t()("scanBlocked");
        } else if (error?.kind === "network") {
          state.activity.error = t()("networkError");
        } else {
          state.activity.error = t()("unknownError");
        }
        if (state.activityScan) {
          state.activityScan.stopped = error?.kind || "error";
        }
      }
      persistActivity();
      if (!aborted && state.activityScan) {
        saveActivityScan(undefined, state.activityScan);
      }
      ui.render();
    }
  }

  function clearActivityData() {
    if (state.active.running) return;
    state.activityEntries = {};
    state.activityScan = null;
    state.activity = idleActivity();
    state.selected = new Set();
    clearActivityStore(undefined);
    clearActivityScan(undefined);
    ui.render();
    ui.toast(t()("activityCleared"));
  }
```

- [ ] **Step 7: Wire actions and settings**

`handleAction` içindeki `save-settings` dalını şu hale getir:

```js
    if (action === "save-settings") {
      state.timings = normalizeTimings(payload || state.timings);
      state.activityDays = clamp(
        Number(payload?.activityDays) || state.activityDays,
        ACTIVITY_MIN_DAYS,
        ACTIVITY_MAX_DAYS
      );
      persist(state);
      ui.toast(t()("settingsSaved"));
      return;
    }
```

`handleAction` içine, `start-unfollow` dalından önce ekle:

```js
    if (action === "start-activity") {
      startActivityScan();
      return;
    }
    if (action === "pause-activity") {
      if (state.active.running) {
        state.active.paused = true;
        state.paused = true;
        state.activity.status = "paused";
        ui.update();
      }
      return;
    }
    if (action === "resume-activity") {
      state.active.paused = false;
      state.paused = false;
      state.activity.status = "scanning";
      ui.update();
      return;
    }
    if (action === "cancel-activity") {
      state.active.cancelled = true;
      state.active.paused = false;
      state.active.wake?.();
      state.active.abort?.abort();
      ui.toast(t()("cancel"));
      return;
    }
    if (action === "clear-activity") {
      clearActivityData();
      return;
    }
```

`cleanup` içine ekle:

```js
    clearTimeout(activityUiTimer);
    activityUiTimer = null;
```

- [ ] **Step 8: Run tests**

Run: `node --test tests/main.test.js`
Expected: PASS (existing main tests + 3 new activity tests).

- [ ] **Step 9: Commit**

```bash
git add src/main.js tests/main.test.js
git commit -m "feat: orchestrate activity scans"
```

---

### Task 10: Pasif sekmeden takipten çıkarma

**Files:**
- Modify: `src/main.js`
- Modify: `tests/main.test.js`

- [ ] **Step 1: Write the failing tests**

`tests/main.test.js` sonuna ekle:

```js
test("unfollowing from the inactive tab allows followers with boolean data", async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  dom.window.document.cookie = "ct0=test; path=/";
  const originalFetch = globalThis.fetch;
  const fakeFetch = async (url) => {
    if (String(url).includes("unfollowUserMutation")) {
      return new Response(
        JSON.stringify({
          data: { unfollow_user: { __typename: "UnfollowSuccessResult" } },
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      );
    }
    return new Response("{}", {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    localStorage: globalThis.localStorage,
    fetch: globalThis.fetch,
  };
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    set("fetch", fakeFetch);
    state = boot();
    const now = Date.now();
    state.users = [
      {
        id: "1",
        handle: "alice",
        name: "Alice",
        followsViewer: true,
        protected: false,
        verified: false,
        avatar: "",
      },
      {
        id: "2",
        handle: "bob",
        name: "Bob",
        followsViewer: false,
        protected: false,
        verified: false,
        avatar: "",
      },
    ];
    state.activityEntries = {
      "1": {
        id: "1",
        handle: "alice",
        state: "known",
        lastTweetAt: 0,
        checkedAt: now,
        source: "lookup",
      },
      "2": {
        id: "2",
        handle: "bob",
        state: "known",
        lastTweetAt: 0,
        checkedAt: now,
        source: "lookup",
      },
    };
    state.activeTab = "inactive";
    state.mode = "results";
    state.selected = new Set(["1"]);
    state.unverified = false;
    state.timings = {
      ...state.timings,
      unfollowDelayMin: 0,
      unfollowDelayMax: 0,
      unfollowPauseEvery: 0,
    };
    state.ui.render();
    dom.window.document.querySelector('[data-action="unfollow"]').click();
    dom.window.document.querySelector("[data-confirm]").click();
    await new Promise((resolve) => {
      const started = Date.now();
      const tick = () => {
        if (state.mode === "done" || Date.now() - started > 3000) {
          return resolve();
        }
        setTimeout(tick, 25);
      };
      tick();
    });
    assert.equal(state.unfollow.ok, 1);
    assert.equal(state.users.some((user) => user.id === "1"), false);
    assert.equal(state.activityEntries["1"], undefined);
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    globalThis.fetch = originalFetch;
    dom.window.close();
  }
});

test("inactive unfollow blocks unknown relationship data", async () => {
  const dom = new JSDOM(
    '<!doctype html><html><body><a data-testid="AppTabBar_Profile_Link" href="/me">Profile</a></body></html>',
    { url: "https://x.com/home" }
  );
  dom.window.document.cookie = "ct0=test; path=/";
  const previous = {
    window: globalThis.window,
    document: globalThis.document,
    location: globalThis.location,
    localStorage: globalThis.localStorage,
  };
  const set = (key, value) => {
    Object.defineProperty(globalThis, key, {
      value,
      configurable: true,
      writable: true,
    });
  };
  const restore = (key, value) => {
    if (value === undefined) delete globalThis[key];
    else set(key, value);
  };
  let state = null;
  try {
    set("window", dom.window);
    set("document", dom.window.document);
    set("location", dom.window.location);
    set("localStorage", dom.window.localStorage);
    state = boot();
    state.users = [
      {
        id: "1",
        handle: "alice",
        name: "Alice",
        followsViewer: null,
        protected: false,
        verified: false,
        avatar: "",
      },
    ];
    state.activityEntries = {
      "1": {
        id: "1",
        handle: "alice",
        state: "known",
        lastTweetAt: 0,
        checkedAt: Date.now(),
        source: "lookup",
      },
    };
    state.activeTab = "inactive";
    state.mode = "results";
    state.selected = new Set(["1"]);
    state.unverified = false;
    state.ui.render();
    dom.window.document.querySelector('[data-action="unfollow"]').click();
    assert.equal(dom.window.document.querySelector("[data-confirm]"), null);
    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(state.mode, "results");
    assert.equal(state.unfollow.ok, 0);
  } finally {
    state?.cleanup();
    for (const [key, value] of Object.entries(previous)) restore(key, value);
    dom.window.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/main.test.js`
Expected: FAIL because `startUnfollow` still requires `followsViewer === false` and does not clear the activity cache.

- [ ] **Step 3: Make the unfollow guard tab-aware**

`startUnfollow` içindeki şu bloğu:

```js
    if (selected.some((user) => user.followsViewer !== false)) {
      ui.toast(t()("unverified"));
      return;
    }
```

şununla değiştir:

```js
    if (state.activeTab === "inactive") {
      if (selected.some((user) => typeof user.followsViewer !== "boolean")) {
        ui.toast(t()("unverified"));
        return;
      }
    } else if (selected.some((user) => user.followsViewer !== false)) {
      ui.toast(t()("unverified"));
      return;
    }
```

- [ ] **Step 4: Remove cache entries on successful unfollow**

`onProgress` içindeki başarılı sonuç bloğunu şu hale getir:

```js
        if (event.ok && event.user) {
          const key = keyOf(event.user);
          state.users = state.users.filter((user) => keyOf(user) !== key);
          state.selected.delete(key);
          const entryKey = String(
            event.user.id || event.user.handle.toLowerCase()
          );
          delete state.activityEntries[entryKey];
          delete state.activityEntries[
            String(event.user.handle || "").toLowerCase()
          ];
          state.activity.inactive = Math.max(
            0,
            (Number(state.activity.inactive) || 0) - 1
          );
          saveActivity(undefined, state.viewer.handle, state.activityEntries);
        }
```

- [ ] **Step 5: Also block unknown data in the UI confirmation**

`confirmUnfollow` içine, `if (state.unverified) return;` satırından sonra ekle:

```js
    if (
      state.activeTab === "inactive" &&
      selected.some((user) => typeof user.followsViewer !== "boolean")
    ) {
      toast(t()("unverified"));
      return;
    }
```

- [ ] **Step 6: Run tests**

Run: `node --test tests/main.test.js`
Expected: PASS (existing + 2 new unfollow tests).

- [ ] **Step 7: Commit**

```bash
git add src/main.js tests/main.test.js
git commit -m "feat: unfollow from inactive tab"
```

---

### Task 11: Dokümantasyon, sürüm ve build

**Files:**
- Modify: `README.md`
- Modify: `README.tr.md`
- Modify: `package.json`, `package-lock.json`
- Modify: `unfollow-x.js` (generated)

- [ ] **Step 1: Update the Turkish README**

`README.tr.md` içindeki "Neler yapar" listesine ekle:

```md
- Takip ettiğin hesaplar arasında son 30 günde gönderi, retweet veya yanıt paylaşmayanları ayrı bir "Pasif hesaplar" sekmesinde listeler.
```

"Panel akışı" bölümünden sonra yeni bir bölüm ekle:

```md
### Pasif hesaplar

- Takip taraması bittikten sonra sonuç ekranında **Takip etmeyenler** ve **Pasif hesaplar** sekmeleri görünür.
- **Aktivite taramasını başlat** takip ettiğin tüm hesapları kontrol eder. Tarama otomatik başlamaz.
- X'in toplu kullanıcı kontrolü 10 hesap/istek olarak yapılır; istekler arasında 1,5–2,5 saniye beklenir ve her 10 istekte yaklaşık 10 saniye duraklanır.
- Toplu kontrol kullanılamazsa hesap başına `UserTweetsAndReplies` sorgusuna geçilir; bu yol daha yavaştır ve arayüzde **Profil** etiketiyle gösterilir.
- Son 30 günde gönderi, retweet veya yanıt yoksa hesap pasiftir. Hiç gönderisi olmayanlar da pasif sayılır.
- Veri okunamayan hesaplar pasif sayılmaz; **Kontrol edilemedi** bölümünde gösterilir ve takipten çıkarılamaz.
- Pasif sekmeden takipten çıkarma aynı güvenli kuyruğu kullanır. Seçilenler arasında seni takip eden varsa onay penceresi uyarır.
```

"Güvenlik ve hız" bölümüne ekle:

```md
### Aktivite taraması sınırları

- Toplu kontrol: 10 hesap/istek.
- İstek gecikmesi: 1,5–2,5 saniye; her 10 istekte yaklaşık 10 saniye duraklama.
- `429` durur ve bekleme saatini gösterir; `401`/`403` oturum/engel mesajıyla durur.
- Hesap başına yedek sorgu yalnızca toplu kontrol eksik veri döndürdüğünde çalışır.
- Aktivite taraması salt okunurdur; bu aşamada hiçbir hesap takipten çıkarılmaz.
```

"Veri ve gizlilik" bölümüne ekle:

```md
- Aktivite kayıtları `ux_activity_v1`, yarım kalan tarama `ux_activity_scan_v1` anahtarlarıyla yalnızca yerel `localStorage`'da tutulur.
- Kayıtlarda yalnızca son gönderi zamanı, kontrol zamanı, durum ve kaynak bulunur; tweet metni, bio veya medya saklanmaz.
- Aktivite kayıtları 24 saat sonra düşer ve görüntüleyen hesaba bağlıdır. **Aktivite verilerini temizle** ile anında silinebilir.
```

"Sorun giderme" bölümüne ekle:

```md
### Aktivite taraması çok yavaş

Toplu kontrol kullanılamıyor olabilir; arayüzde **Profil** etiketi görünür. Bu durumda her hesap için ayrı sorgu yapılır. Hız limitine takılmamak için sekmeyi görünür tut ve taramayı duraklatıp devam et.

### "Kontrol edilemedi" hesaplar

Hesap suspended/korumalı olabilir, kimlik bilgisi eksik olabilir veya X sorgu şekli değişmiş olabilir. Bir profilin **Yanıtlar** sekmesini bir kez açıp taramayı tekrar dene. Bu hesaplar bilinçli olarak pasif sayılmaz.
```

"Bilinen sınırlamalar" bölümüne ekle:

```md
- Aktivite kontrolü X'in `users/lookup` ucuna ve yedek olarak `UserTweetsAndReplies` sorgusuna bağlıdır; X bunları haber vermeden değiştirebilir.
- Son gönderi zamanı yalnızca gönderi/retweet/yanıtı kapsar; beğeni veya yalnızca oturum açma aktivite sayılmaz.
- 10.000 hesap için toplu modda bile tarama uzun sürebilir; ilerleme, cache ve devam desteği vardır.
```

- [ ] **Step 2: Update the English README**

`README.md` içindeki "What it does" listesine ekle:

```md
- Lists accounts you follow that have not posted, reposted, or replied in the last 30 days in a separate "Inactive" tab.
```

"Panel flow" bölümünden sonra ekle:

```md
### Inactive accounts

- After the following scan, the results view shows **Non-followers** and **Inactive** tabs.
- **Start activity scan** checks every account you follow. The scan never starts automatically.
- X's batch lookup is called with 10 accounts per request; requests wait 1.5–2.5 seconds and pause for about 10 seconds every 10 requests.
- If batch lookup is unavailable, the tool falls back to per-account `UserTweetsAndReplies` queries; this is slower and is labeled **Profile** in the UI.
- An account is inactive when it has no post, repost, or reply in the last 30 days. Accounts with no posts at all are also inactive.
- Accounts whose activity cannot be read are not treated as inactive; they appear in a separate **Could not check** section and cannot be unfollowed.
- Unfollowing from the inactive tab uses the same safe queue. If selected accounts follow you back, the confirmation dialog warns you.
```

"Safety and speed" bölümüne ekle:

```md
### Activity scan limits

- Batch check: 10 accounts per request.
- Request delay: 1.5–2.5 seconds; a pause of about 10 seconds every 10 requests.
- `429` stops and shows the reset time; `401`/`403` stop with a session/block message.
- The per-account fallback runs only when batch lookup returns incomplete data.
- The activity scan is read-only; nothing is unfollowed during this phase.
```

"Data and privacy" bölümüne ekle:

```md
- Activity records are stored only in local `localStorage` under `ux_activity_v1`; an interrupted scan uses `ux_activity_scan_v1`.
- Records contain only the last post time, check time, state, and source; no tweet text, bio, or media is stored.
- Activity records expire after 24 hours, are bound to the viewing account, and can be removed immediately with **Clear activity data**.
```

"Troubleshooting" bölümüne ekle:

```md
### Activity scan is very slow

Batch lookup may be unavailable; the UI shows the **Profile** badge. In that mode each account is queried separately. Keep the tab visible and pause/resume if you hit rate limits.

### "Could not check" accounts

The account may be suspended/protected, the user ID may be missing, or X may have changed its query shape. Open any profile's **Replies** tab once, then retry the scan. These accounts are intentionally not treated as inactive.
```

"Known limitations" bölümüne ekle:

```md
- Activity checks depend on X's `users/lookup` endpoint and the `UserTweetsAndReplies` fallback; X can change either without notice.
- The last post timestamp covers posts, reposts, and replies only; likes or login-only activity are not counted.
- Large lists (up to 10,000 accounts) can take a long time even in batch mode; progress, cache, and resume support are provided.
```

- [ ] **Step 3: Bump the package version**

Run:

```bash
npm version 0.3.0 --no-git-tag-version
```

Expected: `package.json` and `package-lock.json` report `0.3.0`; no git tag is created.

- [ ] **Step 4: Build and run the full check**

Run:

```bash
npm run check
```

Expected: esbuild writes `unfollow-x.js`; all node:test suites pass.

- [ ] **Step 5: Manual smoke test**

1. Open `https://x.com/home` in a desktop browser and log in.
2. Paste the rebuilt `unfollow-x.js` into DevTools Console.
3. Run a following scan.
4. Open the **Pasif hesaplar** tab and start the activity scan.
5. Confirm progress, pause/resume, and cancel.
6. Confirm inactive rows show "Hiç gönderi yok" or "Son gönderi: …".
7. Confirm **Kontrol edilemedi** rows have no checkbox.
8. Select a passive account and confirm the unfollow dialog; cancel instead of unfollowing.
9. Toggle TR/EN and verify the new labels.
10. Clear activity data and verify the intro state returns.

- [ ] **Step 6: Commit**

```bash
git add README.md README.tr.md package.json package-lock.json unfollow-x.js docs/superpowers
git commit -m "docs: document activity audit and build 0.3.0"
```

---

## Plan self-review

### Spec coverage

- 30-day inactivity threshold → Task 2 (`classifyActivity`), Task 1 (`ACTIVITY_DEFAULT_DAYS`).
- All followed accounts, hidden included → Task 9 candidates, Task 2/7 display.
- Manual start, no automatic scan → Task 7 UI, Task 9 action.
- 10-account batches → Task 1/4.
- `users/lookup` primary + `UserTweetsAndReplies` fallback → Task 3/4/9.
- Unknown accounts are not inactive → Task 2/4/7.
- 24-hour resident cache and clear action → Task 5/9/7.
- Separate inactive tab, search/filters, sorting → Task 7/8.
- Unfollow warning for followers, block unknown data → Task 8/10.
- Settings threshold and persistence → Task 8/9.
- TR/EN strings → Task 1.
- Rate limit and pause/cancel handling → Task 4/9.
- Capture activity template → Task 6.
- Docs and version/build → Task 11.
- Tests at every layer → Tasks 2-10.

### Placeholder scan

No `TBD`, `TODO`, "implement later", or "add appropriate error handling" steps. Every code step shows the code to write.

### Type consistency

- `activityEntryFor(entries, user)` is used by `classifyActivity` callers in main and UI.
- `isActivityFresh(entry, now?)` matches Task 2 and Task 9 usage.
- `runActivityScan` returns `{ checked, inactive, unknown, total, source, stopped }` and main reads those fields.
- `state.activity` fields match Task 1/9/7: `status`, `checked`, `total`, `inactive`, `unknown`, `current`, `source`, `error`, `nextAt`, `startedAt`.
- `state.activityEntries` keys are `id` or lowercase handle; Task 9 migrates handle keys on result.
- `settingsHTML(timings, language, activityDays)` and `readSettings(root, activityDaysFallback)` signatures match the tests and `mountUI`.
- `getDisplayUsers(state, tab?)` keeps the old default behavior for existing tests.
- `renderRow(user, state, note?)` keeps the old two-argument calls working.

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-10-30-activity-audit.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session using `executing-plans`, batch execution with checkpoints for review.

Which approach?
