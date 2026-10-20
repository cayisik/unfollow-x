# Unfollow X

A single-file, paste-into-the-console tool for x.com that scans the accounts you follow, shows the ones that do not follow you back, and lets you unfollow selected accounts from a floating panel with deliberately conservative pacing.

This is an unofficial community tool. It is not affiliated with X Corp. Automating actions on X can violate its Terms of Service and can lead to rate limits, account review, or suspension. Use it at your own risk, preferably on a small scale.

---

## What it does

- Reads your own Following list through X's web session.
- Compares follow-back data and lists accounts whose `followed_by` flag is false.
- Provides search, filters, selection, copy, hide/show, checkpoint/resume, last-scan restore, TR/EN UI, and persistent settings.
- Unfollows only after an explicit confirmation, with a per-run cap, randomized delays, long pauses, and rate-limit stops.
- Never changes your account during a scan. Scanning is read-only.

## What it does not do

- It does not follow accounts, automate engagement, or grow your account.
- It does not use a backend, extension, build step at runtime, or third-party API.
- It does not scan another user's following list.
- It does not bypass rate limits, CAPTCHAs, account locks, or other protections.
- It does not guarantee that your account will not be restricted.
- It does not send data anywhere except x.com.

---

## Requirements

- A desktop browser with DevTools.
- A logged-in session on `https://x.com` (or `https://twitter.com`).
- The `ct0` cookie, which X uses for CSRF protection.
- The `twid` cookie is preferred but optional. Without it, the screen-name query and DOM fallback can still work.

> **Do not paste code you have not reviewed.** The script runs with your X session. Use the copy in this repository, not an unknown fork.

---

## Quick start

1. Log in to `https://x.com` in your browser.
2. Open any x.com page, for example `https://x.com/home`.
3. Open DevTools (`F12` or `Cmd+Option+I` on macOS) and select the **Console** tab.
4. If Chrome/Edge blocks pasting with a "Don't paste code" warning, type `allow pasting` and press Enter. This warning is a browser safety feature; only do this if you trust the code.
5. Open `unfollow-x.js`, select all of it, copy it, paste it into the Console, and press Enter.
6. The Unfollow X panel appears. Click **Scan now**.

If the panel does not appear, check that you are on x.com and look for an error in the Console.

## Panel behavior

- The panel follows X's light/dark theme automatically and also mirrors X's
  high-contrast and reduced-motion settings. There is no separate theme switch.
- Drag the panel by its header. The grip is keyboard-focusable: arrow keys move
  it by 8px (`Shift` moves 32px), and `Home` resets it to the top-right.
- The position is remembered. The panel is clamped to the viewport and has no
  resize handle.
- The visual language is an audit ledger: ruled rows, one hero count, and a
  strike/“çıktı” stamp on successful unfollows.

---

## Panel flow

### 1. Idle

- **Scan now** starts a new scan.
- **Resume previous scan** appears when a checkpoint exists for the detected handle.
- **Show last scan** appears when a saved scan from the last 24 hours exists.
- If the viewer handle cannot be detected, the panel asks for it manually. You can enter `@handle`, `handle`, or a full profile URL.

### 2. Scanning

- Shows the current step, progress, source (`API` or `DOM`), and the live list of confirmed non-followers.
- **Pause/Resume** and **Cancel** are available.
- If some rows have unknown follow-back data, the scan is marked **unverified** and unfollowing stays disabled.
- Partial scans can be resumed later, within 24 hours and for the same handle.

### 3. Results

- Search by name or handle.
- Filter chips: verified, protected, no avatar, show hidden.
- Select individual rows, select all visible rows, or clear selection.
- Copy a single handle or all visible handles.
- Hide/show accounts without deleting the scan.
- **Unfollow selected** opens a confirmation dialog showing the exact count.

### 4. Unfollowing

- Processes targets one at a time with a randomized delay.
- Shows progress, the current handle, success/fail counts, and the next-action countdown.
- **Pause/Resume** and **Cancel** are available.
- Stops on rate-limit, block, or session errors and keeps progress.
- Does not restart automatically.

### 5. Done / Error

- Done shows how many were unfollowed, how many failed, and how many remain.
- Error shows the reason and offers retry/resume where it makes sense.
- Closing the panel removes its UI and request hooks. Paste the script again to reopen it.

---

## How scanning works

The script prefers X's own web requests over hardcoded endpoints:

1. **Capture.** It hooks `fetch` and `XMLHttpRequest` and records the next same-origin GraphQL `Following` / `followingQuery` request that X makes. After landing on your Following page, it scrolls once to make X request a page.
2. **Replay.** It replays the captured request shape with your cursor, page size, and viewer identity, and paginates through the response.
3. **Fallback templates.** If no request can be captured, it tries the known legacy `Following` query and the 2026 `followingQuery` shape.
4. **DOM fallback.** If both API paths fail, it scrolls the Following page and parses user rows from the DOM.

Captured request templates are **not persisted**. After a reload, the script captures again or uses the fallback paths. Checkpoints and last scans are persisted for 24 hours.

Only accounts with `followsViewer === false` are considered non-followers. If the follow-back flag is missing or cannot be trusted, the scan is marked unverified and unfollowing is blocked. This is deliberate: the tool would rather show a warning than unfollow based on incomplete data.

---

## Safety and pacing

### Scan limits

- Page delay: random 1.5–2.5 seconds.
- Long pause every 10 pages: about 10 seconds.
- Users per request: 50 by default.
- Hard stop: 10,000 users or 400 pages, whichever comes first.
- `429`: stop and cooldown until the reset time (fallback 15 minutes).
- `401`/`403`: stop with a session/blocked message.
- Network/5xx: retry with backoff, then stop with a resumable error.

### Unfollow limits

- Default cap: **190 unfollows per run**. Settings allow 1–400.
- Delay: random **12–20 seconds** between actions.
- Long pause: **5 minutes every 25 actions**.
- If you select more than the cap, only the cap is processed in that run. The rest stay selected and are reported as remaining.
- A confirmation dialog shows the exact count before anything is changed.
- Unfollow transport order:
  1. `unfollowUserMutation` GraphQL mutation when a numeric user id is available.
  2. `friendships/destroy.json` REST endpoint, which also works with a handle.
  3. DOM clicking as a last resort.
- `401`, `403`, and `429` stop the run. They are treated as session/account conditions, not transport failures.

### Unverified scans

Unfollowing is disabled when:

- no parsed user has a boolean follow-back value, or
- any selected user has an unknown follow-back value.

Rescan on the Following page, in English or Turkish, with the tab visible. The API path usually gives the most reliable coverage.

---

## Data and privacy

- All requests go to x.com / twitter.com. There is no telemetry, analytics, or third-party endpoint.
- The script reads `ct0` and, when present, `twid` from your cookies. It does not log cookie values, CSRF tokens, or other secrets.
- Settings, checkpoints, and last scans are stored in `localStorage` under `ux_state_v1`, `ux_scan_v1`, and `ux_last_scan_v1`.
- Checkpoints and last scans expire after 24 hours and are ignored if the detected handle changes.
- The captured GraphQL template lives only in memory and is discarded on reload or close.
- Closing the panel removes its event listeners and restores the patched `fetch` / `XMLHttpRequest` methods.

---

## Troubleshooting

### The browser says "Don't paste code into the DevTools Console"

Chrome and Edge block pasting until you type `allow pasting` in the Console. Only do this after reviewing the script. Firefox and Safari may show a similar warning.

### The panel does not appear

- Confirm the address bar says `x.com` or `twitter.com`.
- Open the Console and check for errors.
- Reload the page and paste the script again.
- If a very old copy is already running, pasting a new copy should clean it up; if not, reload first.

### `ct0 cookie not found`

You are not fully logged in, or the cookie is not available yet. Log in, reload x.com, and paste again.

### "Could not open your Following page"

- Navigate manually to `https://x.com/<your-handle>/following`.
- Click retry in the panel, or paste the script again.
- Make sure you are not on a different user's profile. The script resolves your handle from the side-navigation profile link first, then the URL, then manual input.

### "Unverified results" / unfollow is disabled

Some rows did not expose a reliable follow-back flag. This can happen when:

- X changed its response shape.
- The DOM language is neither English nor Turkish and no known "Follows you" label was found.
- A page was partially loaded or the session expired.

Rescan with the Following tab open and visible. If the warning persists, do not try to bypass it.

### "No non-followers found"

It may be correct: everyone in the scanned list follows you back, or the list is very small. Open a few profiles to verify. You can also try a fresh scan from the Following page.

### Query ID / format errors, or the API path fails

X rotates GraphQL query IDs, feature flags, and transaction-id requirements without notice. The script falls back to the built-in templates, then to DOM scanning. Keep the tab visible while scanning. If all paths fail, X likely changed its frontend; the DOM selectors in `src/dom.js` may need an update.

### `x-client-transaction-id` rejection

The script copies a transaction ID only if it captured one from X. If X rejects the request, the API path degrades to the DOM fallback. Reload, visit the Following page, and let X make its own request before scanning again.

### DOM scan finds nothing

X's markup may have changed. Refresh the Following page, wait for rows to render, then retry. If it still finds nothing, the DOM parser needs updating.

### The scan or unfollow pauses in a background tab

Browsers throttle background tabs. The script pauses when the page becomes hidden and waits for you to resume. Keep the x.com tab visible during a run.

### Rate limited / blocked

Wait for the shown cooldown. Repeated retries can make the restriction worse. Lower the cap and increase delays in Settings before trying again. The script never bypasses a rate limit.

### An unfollow fails

- The row may no longer be visible for the UI fallback. Keep the Following page open and scroll the target into view.
- The session may have expired.
- X may be rate limiting or blocking the action.
- The account may already have been unfollowed from another device.

Check the failure reason and the cooldown notice before retrying.

### Resume or last scan is missing

Checkpoints and last scans expire after 24 hours and are tied to the detected handle. If you changed accounts or the handle detection changed, the old data is intentionally ignored.

---

## Development

The deliverable is generated from ES modules under `src/` and bundled into a single IIFE by esbuild. The development toolchain requires Node.js 20 or newer.

```bash
npm install
npm test          # node:test + jsdom
npm run build     # writes ./unfollow-x.js
npm run check     # build + full test suite
```

Useful details:

- `src/index.js` is the bundle entry point. It enforces the x.com host guard and exposes `globalThis.__UX_TEST__` for tests.
- `src/main.js` contains boot, navigation, scan/unfollow orchestration, persistence, and cleanup.
- `src/api.js` builds and paginates GraphQL scans.
- `src/dom.js` parses rows and provides the DOM fallback.
- `src/unfollow.js` implements the mutation → REST → UI transport chain.
- `src/ui.js` contains the panel, views, dialogs, styles, and interactions.
- `src/theme.js` reads X's theme and accessibility flags and observes changes.
- `tests/` covers URL/response parsing, DOM parsing, UI, pacing, transports, and a jsdom boot → scan → unfollow flow.

Do not edit `unfollow-x.js` by hand. Change `src/` and run `npm run build`.

The automated suite does not replace a real browser test. X's live frontend, cookies, and rate limits cannot be fully simulated with jsdom.

---

## Manual verification checklist

Run this on a logged-in x.com session before treating a build as release-ready. These checks cover the release-critical flows:

- [ ] Paste on the home page; the panel opens and navigates to the Following page.
- [ ] Scan a small account (fewer than 20 following); the DOM fallback or API path completes.
- [ ] Scan a larger account; the progress total matches the profile count.
- [ ] Pause/resume/cancel mid-scan; a checkpoint appears after re-pasting.
- [ ] Toggle filters, search, select all, and copy.
- [ ] Unfollow one account; confirm the row disappears and the count updates.
- [ ] Simulate a `429` (optional DevTools block) and confirm the countdown.
- [ ] Switch TR/EN; reload and confirm the language persists.
- [ ] Toggle X between light and dark; the panel follows without losing the
      current run.
- [ ] Enable X high contrast and reduced motion; borders, focus rings, and
      animation behavior change accordingly.
- [ ] Drag by the header, move with the keyboard, press `Home`, resize the
      window, and re-paste; the panel stays visible.
- [ ] A successful unfollow row gets the strike/“çıktı” stamp; a failure does
      not.

Also confirm:

- [ ] The panel can be dragged and minimized, and its position survives a reload.
- [ ] Closing the panel restores `fetch` / `XMLHttpRequest` and removes the UI.
- [ ] A partial or unverified scan cannot start an unfollow.
- [ ] A second paste cleans up the previous panel instead of leaving duplicate hooks.

---

## Known limitations

- X's frontend is a compiled SPA; query IDs, feature flags, response shapes, and selectors can change at any time.
- The happy path depends on capturing a request that X actually makes. Without a capture, the fallback query IDs may be stale.
- DOM scanning relies on language heuristics and generic row structure; it is intentionally conservative and can mark a scan unverified.
- Resuming after a reload may rescan from the beginning if the captured cursor cannot be reused with a fallback template. The merge is deduplicated, so this is slower but safe.
- The tool is desktop-oriented. Mobile layouts and unusual X experiments are not guaranteed.
- Bulk automation is inherently risky. The defaults are conservative, not a guarantee.

---

## License

MIT. See [LICENSE](LICENSE).
