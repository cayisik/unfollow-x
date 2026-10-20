import {
  APP_ID,
  STYLE_ID,
  ICONS,
  DEFAULT_TIMINGS,
  DEFAULT_FILTERS,
  PANEL,
  VERSION,
  makeT,
} from "./config.js";
import {
  escapeHTML,
  escapeAttr,
  isDefaultAvatar,
  clamp,
  formatClock,
  timeAgo,
} from "./utils.js";

const LOCK = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;

export const CSS = `
#${APP_ID}, #${APP_ID} * { box-sizing: border-box; }
#${APP_ID} {
  --ux-bg: #000;
  --ux-surface: #000;
  --ux-line: #4d4d4d;
  --ux-line-soft: #2a2a2a;
  --ux-text: #fff;
  --ux-muted: #b0b0b0;
  --ux-faint: #8a8a8a;
  --ux-primary-bg: #fff;
  --ux-primary-text: #000;
  --ux-hover: rgba(255,255,255,.06);
  --ux-selected: rgba(255,255,255,.10);
  --ux-ok: #35d07f;
  --ux-danger: #ff5a4f;
  --ux-warn: #e0a23c;
  --ux-shadow: 0 18px 44px rgba(0,0,0,.65);
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: transparent;
  color: var(--ux-text);
  font-family: "TwitterChirp", "Chirp", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  line-height: 1.35;
  color-scheme: dark;
  font-variant-numeric: tabular-nums;
}
#${APP_ID}[data-theme="light"] {
  --ux-bg: #fff;
  --ux-surface: #fff;
  --ux-line: #949494;
  --ux-line-soft: #e6e6e6;
  --ux-text: #000;
  --ux-muted: #555;
  --ux-faint: #6f6f6f;
  --ux-primary-bg: #000;
  --ux-primary-text: #fff;
  --ux-hover: #f4f4f4;
  --ux-selected: #ededed;
  --ux-ok: #0b7a4a;
  --ux-danger: #c6281d;
  --ux-warn: #8a5200;
  --ux-shadow: 0 18px 44px rgba(0,0,0,.14);
  color-scheme: light;
}
#${APP_ID}[data-high-contrast="true"] {
  --ux-line: var(--ux-text);
  --ux-line-soft: var(--ux-text);
  --ux-muted: var(--ux-text);
  --ux-faint: var(--ux-text);
}
#${APP_ID} .ux-panel, #${APP_ID} .ux-pill, #${APP_ID} .ux-overlay, #${APP_ID} .ux-toast { pointer-events: auto; }
#${APP_ID} button, #${APP_ID} input, #${APP_ID} select, #${APP_ID} textarea { font: inherit; color: inherit; }
#${APP_ID} button { border: 0; background: none; cursor: pointer; }
#${APP_ID} a { color: inherit; text-decoration: none; }
#${APP_ID} svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; display: block; }
#${APP_ID} .ux-panel {
  position: absolute;
  top: ${PANEL.top}px;
  right: ${PANEL.right}px;
  width: ${PANEL.width}px;
  max-width: calc(100vw - ${PANEL.margin * 2}px);
  max-height: min(760px, calc(100vh - ${PANEL.top + PANEL.margin}px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--ux-surface);
  border: 1px solid var(--ux-line);
  border-radius: 8px;
  box-shadow: var(--ux-shadow);
  animation: ux-in 120ms ease-out;
}
@keyframes ux-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
#${APP_ID} .ux-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--ux-line);
  cursor: grab;
  user-select: none;
}
#${APP_ID} .ux-head:active { cursor: grabbing; }
#${APP_ID} .ux-head button, #${APP_ID} .ux-head a { cursor: pointer; }
#${APP_ID} .ux-grip {
  width: 16px; height: 24px; padding: 0;
  display: grid; grid-template-columns: repeat(2, 2px); gap: 2px;
  align-content: center; justify-content: center;
  color: var(--ux-faint); cursor: grab; flex: none;
}
#${APP_ID} .ux-grip i { width: 2px; height: 2px; border-radius: 50%; background: currentColor; display: block; }
#${APP_ID} .ux-grip:hover { color: var(--ux-text); }
#${APP_ID} .ux-grip:active { cursor: grabbing; }
#${APP_ID} .ux-brand { display: flex; align-items: center; gap: 7px; min-width: 0; flex: 1; }
#${APP_ID} .ux-mark {
  position: relative;
  width: 24px; height: 24px;
  border: 1px solid var(--ux-text);
  display: grid; place-items: center;
  font-size: 11px; font-weight: 800; line-height: 1;
  flex: none;
}
#${APP_ID} .ux-mark::after {
  content: "";
  position: absolute; left: 3px; right: 3px; top: 50%;
  height: 1px; background: var(--ux-text);
}
#${APP_ID} .ux-brand-text { display: flex; flex-direction: column; min-width: 0; }
#${APP_ID} .ux-brand-text strong {
  font-size: 11px; font-weight: 800; letter-spacing: .04em;
  text-transform: uppercase; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
#${APP_ID} .ux-brand-text span {
  font-size: 9.5px; color: var(--ux-muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
#${APP_ID} .ux-head-actions { display: flex; align-items: center; gap: 1px; flex: none; }
#${APP_ID} .ux-icon-btn {
  width: 26px; height: 26px; border-radius: 4px;
  display: inline-grid; place-items: center;
  color: var(--ux-muted);
}
#${APP_ID} .ux-icon-btn:hover { background: var(--ux-hover); color: var(--ux-text); }
#${APP_ID} .ux-lang {
  height: 24px; min-width: 30px; padding: 0 6px;
  border: 1px solid var(--ux-line); border-radius: 3px;
  font-size: 9.5px; font-weight: 700; color: var(--ux-muted);
}
#${APP_ID} .ux-lang:hover { color: var(--ux-text); border-color: var(--ux-text); }
#${APP_ID} .ux-body { overflow: auto; overscroll-behavior: contain; }
#${APP_ID} .ux-body::-webkit-scrollbar { width: 8px; }
#${APP_ID} .ux-body::-webkit-scrollbar-thumb {
  background: var(--ux-line); border-radius: 99px;
  border: 2px solid var(--ux-surface); background-clip: padding-box;
}
#${APP_ID} .ux-view { padding: 12px; }
#${APP_ID} .ux-eyebrow {
  display: block; font-size: 10px; font-weight: 600;
  color: var(--ux-muted); letter-spacing: 0; text-transform: none;
}
#${APP_ID} h1 { font-size: 22px; line-height: 1.1; letter-spacing: -.04em; margin: 4px 0 6px; font-weight: 800; }
#${APP_ID} h2 { font-size: 17px; line-height: 1.15; letter-spacing: -.02em; margin: 0; font-weight: 800; }
#${APP_ID} h3 { margin: 0; font-size: 15px; letter-spacing: -.02em; }
#${APP_ID} p { margin: 0; }
#${APP_ID} .ux-muted { color: var(--ux-muted); }
#${APP_ID} .ux-hero p { color: var(--ux-muted); font-size: 12px; line-height: 1.5; margin-top: 4px; }
#${APP_ID} .ux-hero-count { display: flex; align-items: baseline; gap: 7px; margin-top: 2px; }
#${APP_ID} .ux-hero-count strong {
  font-size: 36px; line-height: 1; letter-spacing: -.06em;
  font-weight: 800; font-variant-numeric: tabular-nums;
}
#${APP_ID} .ux-hero-count span { font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-subline {
  display: flex; flex-wrap: wrap; gap: 6px 12px;
  margin-top: 8px; padding: 6px 0;
  border-top: 1px solid var(--ux-line-soft);
  border-bottom: 1px solid var(--ux-line-soft);
  font-size: 10px; color: var(--ux-muted);
}
#${APP_ID} .ux-subline b { color: var(--ux-text); }
#${APP_ID} .ux-card {
  margin-top: 10px; padding: 10px 0;
  border-top: 1px solid var(--ux-line);
  border-bottom: 1px solid var(--ux-line);
  border-radius: 0; background: transparent;
}
#${APP_ID} .ux-card-line { display: flex; align-items: center; gap: 7px; margin-bottom: 9px; font-size: 11px; color: var(--ux-muted); }
#${APP_ID} .ux-card-line strong { color: var(--ux-text); font-size: 12px; }
#${APP_ID} .ux-live-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ux-ok); flex: none; }
#${APP_ID} .ux-live-dot.is-paused { background: var(--ux-warn); }
#${APP_ID} .ux-btn {
  min-height: 32px; padding: 0 11px;
  border-radius: 4px;
  display: inline-flex; align-items: center; justify-content: center; gap: 7px;
  font-size: 11.5px; font-weight: 700; letter-spacing: -.01em;
  border: 1px solid transparent;
  transition: background 90ms ease, border-color 90ms ease, opacity 90ms ease;
}
#${APP_ID} .ux-btn:active { transform: translateY(1px); }
#${APP_ID} .ux-btn:disabled { opacity: .42; cursor: not-allowed; }
#${APP_ID} .ux-btn-block { width: 100%; }
#${APP_ID} .ux-btn-primary { background: var(--ux-primary-bg); color: var(--ux-primary-text); }
#${APP_ID} .ux-btn-primary:hover:not(:disabled) { opacity: .84; }
#${APP_ID} .ux-btn-soft { border-color: var(--ux-line); color: var(--ux-text); background: transparent; }
#${APP_ID} .ux-btn-soft:hover:not(:disabled) { background: var(--ux-hover); }
#${APP_ID} .ux-btn-danger { border-color: var(--ux-danger); color: var(--ux-danger); background: transparent; }
#${APP_ID} .ux-btn-danger:hover:not(:disabled) { background: var(--ux-hover); }
#${APP_ID} .ux-btn-ghost { color: var(--ux-muted); }
#${APP_ID} .ux-btn-ghost:hover:not(:disabled) { color: var(--ux-text); background: var(--ux-hover); }
#${APP_ID} .ux-stack { display: grid; gap: 6px; margin-top: 10px; }
#${APP_ID} .ux-stack .ux-btn { justify-content: space-between; }
#${APP_ID} .ux-safety {
  display: flex; gap: 7px; align-items: flex-start;
  margin-top: 12px; padding: 7px 0 7px 9px;
  border-left: 2px solid var(--ux-ok);
  color: var(--ux-muted); font-size: 11px; line-height: 1.45;
}
#${APP_ID} .ux-safety svg { width: 14px; height: 14px; flex: none; margin-top: 1px; }
#${APP_ID} .ux-scan-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
#${APP_ID} .ux-source-badge {
  font-size: 9px; font-weight: 700; color: var(--ux-muted);
  border: 1px solid var(--ux-line); border-radius: 2px; padding: 3px 5px;
  white-space: nowrap;
}
#${APP_ID} .ux-bar { height: 3px; border-radius: 0; background: var(--ux-line-soft); overflow: hidden; }
#${APP_ID} .ux-bar i { display: block; height: 100%; width: 0%; background: var(--ux-text); transition: width 180ms ease; }
#${APP_ID} .ux-bar.is-indeterminate i { width: 38% !important; animation: ux-indeterminate 1.15s ease-in-out infinite; }
@keyframes ux-indeterminate { 0% { transform: translateX(-110%); } 100% { transform: translateX(280%); } }
#${APP_ID} .ux-scan-meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 6px; font-size: 10px; color: var(--ux-muted); }
#${APP_ID} .ux-hint { margin-top: 10px; font-size: 11px; line-height: 1.5; color: var(--ux-muted); }
#${APP_ID} .ux-live-list { display: grid; margin-top: 10px; border-top: 1px solid var(--ux-line); }
#${APP_ID} .ux-mini-row { display: flex; align-items: center; gap: 8px; padding: 6px 2px; border-bottom: 1px solid var(--ux-line-soft); border-radius: 0; background: transparent; }
#${APP_ID} .ux-mini-row .ux-avatar { width: 26px; height: 26px; font-size: 10px; }
#${APP_ID} .ux-mini-user { min-width: 0; display: flex; flex-direction: column; }
#${APP_ID} .ux-mini-user strong { font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-mini-user span { font-size: 9.5px; color: var(--ux-muted); }
#${APP_ID} .ux-actions { display: flex; gap: 7px; margin-top: 12px; }
#${APP_ID} .ux-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-results-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
#${APP_ID} .ux-results-links { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex: none; }
#${APP_ID} .ux-link { color: var(--ux-text); font-size: 10.5px; font-weight: 600; padding: 3px 0; white-space: nowrap; text-decoration: underline; text-underline-offset: 2px; }
#${APP_ID} .ux-link:hover { text-decoration-thickness: 2px; }
#${APP_ID} .ux-warning {
  display: flex; gap: 7px; align-items: flex-start;
  margin-top: 10px; padding: 7px 0 7px 9px;
  border-left: 2px solid var(--ux-warn);
  color: var(--ux-text); font-size: 11px; line-height: 1.45;
}
#${APP_ID} .ux-warning svg { width: 14px; height: 14px; flex: none; margin-top: 1px; color: var(--ux-warn); }
#${APP_ID} .ux-search {
  display: flex; align-items: center; gap: 7px;
  margin-top: 10px; padding: 0 9px; height: 32px;
  border: 1px solid var(--ux-line); border-radius: 3px;
  background: transparent;
}
#${APP_ID} .ux-search:focus-within { border-color: var(--ux-text); }
#${APP_ID} .ux-search svg { width: 14px; height: 14px; color: var(--ux-muted); flex: none; }
#${APP_ID} .ux-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 11.5px; }
#${APP_ID} .ux-search input::placeholder { color: var(--ux-faint); }
#${APP_ID} .ux-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
#${APP_ID} .ux-chip {
  height: 25px; padding: 0 8px; border-radius: 3px;
  border: 1px solid var(--ux-line); color: var(--ux-muted);
  font-size: 9.5px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 5px;
}
#${APP_ID} .ux-chip:hover { color: var(--ux-text); border-color: var(--ux-text); }
#${APP_ID} .ux-chip.is-on { background: var(--ux-primary-bg); border-color: var(--ux-primary-bg); color: var(--ux-primary-text); }
#${APP_ID} .ux-chip .ux-chip-count { font-size: 9px; opacity: .7; }
#${APP_ID} .ux-list { display: grid; margin-top: 8px; border-top: 1px solid var(--ux-line); }
#${APP_ID} .ux-row {
  display: grid; grid-template-columns: 16px 28px minmax(0, 1fr) auto;
  align-items: center; gap: 8px;
  padding: 7px 2px;
  border-bottom: 1px solid var(--ux-line-soft);
  border-radius: 0;
}
#${APP_ID} .ux-row:hover { background: var(--ux-hover); }
#${APP_ID} .ux-row.is-selected { background: var(--ux-selected); }
#${APP_ID} .ux-row.is-hidden { opacity: .55; }
#${APP_ID} .ux-row input[type="checkbox"], #${APP_ID} .ux-check input[type="checkbox"] {
  width: 14px; height: 14px; accent-color: var(--ux-text); cursor: pointer;
}
#${APP_ID} .ux-check { display: inline-flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--ux-muted); cursor: pointer; }
#${APP_ID} .ux-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  object-fit: cover; display: grid; place-items: center; flex: none;
  background: transparent; border: 1px solid var(--ux-line);
}
#${APP_ID} .ux-avatar-fallback { font-size: 11px; font-weight: 800; color: var(--ux-text); background: transparent; }
#${APP_ID} .ux-user { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
#${APP_ID} .ux-user a { min-width: 0; }
#${APP_ID} .ux-user strong { display: block; font-size: 11.5px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-user span { display: block; font-size: 10px; color: var(--ux-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-badges { display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; }
#${APP_ID} .ux-badge {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 8.5px; font-weight: 600; border-radius: 2px;
  padding: 1px 4px; color: var(--ux-muted);
  border: 1px solid var(--ux-line); background: transparent;
}
#${APP_ID} .ux-badge svg { width: 10px; height: 10px; }
#${APP_ID} .ux-badge-blue { color: var(--ux-text); border-color: var(--ux-text); }
#${APP_ID} .ux-badge-warn { color: var(--ux-warn); border-color: var(--ux-warn); }
#${APP_ID} .ux-badge-muted { color: var(--ux-faint); }
#${APP_ID} .ux-row-actions { display: flex; align-items: center; gap: 1px; opacity: .65; }
#${APP_ID} .ux-row:hover .ux-row-actions { opacity: 1; }
#${APP_ID} .ux-row-actions .ux-icon-btn { width: 24px; height: 24px; }
#${APP_ID} .ux-row-actions svg { width: 13px; height: 13px; }
#${APP_ID} .ux-empty { padding: 22px 10px; text-align: center; color: var(--ux-muted); font-size: 11.5px; line-height: 1.5; }
#${APP_ID} .ux-empty strong { display: block; color: var(--ux-text); font-size: 12px; margin-bottom: 4px; }
#${APP_ID} .ux-actionbar {
  position: sticky; bottom: 0; z-index: 2;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  margin: 10px -12px -12px; padding: 9px 10px 10px;
  border-top: 1px solid var(--ux-line);
  background: var(--ux-surface);
}
#${APP_ID} .ux-actionbar .ux-spacer { flex: 1; }
#${APP_ID} .ux-actionbar .ux-btn { min-height: 30px; padding: 0 9px; font-size: 10.5px; }
#${APP_ID} .ux-actionbar .ux-link { padding: 0 2px; }
#${APP_ID} .ux-statline { display: flex; gap: 12px; margin: 10px 0 0; padding: 6px 0; border-top: 1px solid var(--ux-line); border-bottom: 1px solid var(--ux-line); }
#${APP_ID} .ux-stat { display: flex; align-items: baseline; gap: 4px; }
#${APP_ID} .ux-stat strong { font-size: 11px; font-weight: 800; }
#${APP_ID} .ux-stat span { font-size: 10px; color: var(--ux-muted); text-transform: none; letter-spacing: 0; }
#${APP_ID} .ux-current { margin-top: 10px; font-size: 12px; font-weight: 700; }
#${APP_ID} .ux-current span { color: var(--ux-text); }
#${APP_ID} .ux-next { margin-top: 2px; font-size: 10.5px; color: var(--ux-muted); }
#${APP_ID} .ux-log { display: grid; margin-top: 10px; max-height: 180px; overflow: auto; border-top: 1px solid var(--ux-line); }
#${APP_ID} .ux-log-row { display: flex; align-items: center; gap: 7px; font-size: 10.5px; padding: 6px 2px; border-bottom: 1px solid var(--ux-line-soft); }
#${APP_ID} .ux-log-row .ux-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--ux-ok); flex: none; }
#${APP_ID} .ux-log-row.is-fail .ux-dot { background: var(--ux-danger); }
#${APP_ID} .ux-log-row .ux-stamp { margin-left: auto; color: var(--ux-muted); border: 1px solid var(--ux-line); border-radius: 2px; padding: 1px 4px; font-size: 8px; }
#${APP_ID} .ux-strike { text-decoration: line-through; text-decoration-thickness: 1px; color: var(--ux-muted); }
#${APP_ID} .ux-done, #${APP_ID} .ux-error { text-align: center; padding: 22px 14px; }
#${APP_ID} .ux-done-icon, #${APP_ID} .ux-error-icon {
  width: 40px; height: 40px; border-radius: 0;
  margin: 0 auto 10px; display: grid; place-items: center;
  border: 1px solid var(--ux-ok); color: var(--ux-ok); background: transparent;
}
#${APP_ID} .ux-error-icon { border-color: var(--ux-warn); color: var(--ux-warn); }
#${APP_ID} .ux-done-icon svg, #${APP_ID} .ux-error-icon svg { width: 20px; height: 20px; }
#${APP_ID} .ux-done p, #${APP_ID} .ux-error p { color: var(--ux-muted); font-size: 11.5px; line-height: 1.55; margin-top: 6px; }
#${APP_ID} .ux-done .ux-actions, #${APP_ID} .ux-error .ux-actions { margin-top: 14px; }
#${APP_ID} .ux-foot {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 6px 12px 7px; border-top: 1px solid var(--ux-line-soft);
  font-size: 9px; color: var(--ux-faint);
}
#${APP_ID} .ux-foot .ux-foot-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--ux-ok); display: inline-block; margin-right: 4px; }
#${APP_ID} .ux-pill {
  position: absolute; top: ${PANEL.top}px; right: ${PANEL.right}px;
  display: inline-flex; align-items: center; gap: 7px;
  height: 36px; padding: 0 10px; border-radius: 8px;
  background: var(--ux-surface); border: 1px solid var(--ux-line);
  box-shadow: var(--ux-shadow);
  font-size: 11px; font-weight: 700; color: var(--ux-text);
}
#${APP_ID} .ux-pill:hover { border-color: var(--ux-text); }
#${APP_ID} .ux-pill-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--ux-muted); }
#${APP_ID} .ux-pill-dot.scanning, #${APP_ID} .ux-pill-dot.unfollowing { background: var(--ux-warn); }
#${APP_ID} .ux-pill svg { width: 12px; height: 12px; color: var(--ux-muted); }
#${APP_ID} .ux-overlay {
  position: fixed; inset: 0; z-index: 2;
  display: grid; place-items: center; padding: 20px;
  background: rgba(0,0,0,.55);
  animation: ux-fade 100ms ease-out;
}
#${APP_ID}[data-theme="light"] .ux-overlay { background: rgba(0,0,0,.38); }
@keyframes ux-fade { from { opacity: 0; } to { opacity: 1; } }
#${APP_ID} .ux-dialog {
  width: min(380px, 100%);
  max-height: calc(100vh - 40px); overflow: auto;
  background: var(--ux-surface); border: 1px solid var(--ux-line);
  border-radius: 8px; padding: 14px;
  box-shadow: var(--ux-shadow);
}
#${APP_ID} .ux-dialog > p { margin-top: 6px; color: var(--ux-muted); font-size: 11.5px; line-height: 1.55; }
#${APP_ID} .ux-dialog-content { margin-top: 10px; }
#${APP_ID} .ux-dialog-actions { display: flex; gap: 7px; margin-top: 14px; }
#${APP_ID} .ux-dialog-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-settings { display: grid; gap: 10px; }
#${APP_ID} .ux-settings-group { display: grid; gap: 6px; }
#${APP_ID} .ux-settings-title { font-size: 10px; font-weight: 700; color: var(--ux-muted); margin-bottom: 2px; text-transform: none; letter-spacing: 0; }
#${APP_ID} .ux-field { display: grid; grid-template-columns: 1fr 76px; align-items: center; gap: 8px; font-size: 10.5px; color: var(--ux-muted); }
#${APP_ID} .ux-field input { height: 28px; width: 100%; border-radius: 3px; border: 1px solid var(--ux-line); background: transparent; padding: 0 7px; font-size: 11px; outline: 0; }
#${APP_ID} .ux-field input:focus, #${APP_ID} .ux-input:focus { border-color: var(--ux-text); }
#${APP_ID} .ux-input { width: 100%; height: 32px; border-radius: 3px; border: 1px solid var(--ux-line); background: transparent; padding: 0 9px; outline: 0; }
#${APP_ID} .ux-toast {
  position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%);
  z-index: 3; max-width: min(420px, calc(100vw - 28px));
  padding: 8px 12px; border-radius: 6px;
  background: var(--ux-surface); border: 1px solid var(--ux-line);
  box-shadow: var(--ux-shadow);
  font-size: 11px; color: var(--ux-text);
  animation: ux-toast-in 120ms ease-out;
}
@keyframes ux-toast-in { from { opacity: 0; transform: translate(-50%, 6px); } to { opacity: 1; transform: translate(-50%, 0); } }
#${APP_ID} :focus-visible { outline: 2px solid var(--ux-text); outline-offset: 2px; }
#${APP_ID}[data-high-contrast="true"] :focus-visible { outline-width: 3px; }
@media (max-width: 560px) {
  #${APP_ID} .ux-panel { width: auto; left: 12px; right: 12px; max-width: none; }
  #${APP_ID} .ux-row { grid-template-columns: 16px 26px minmax(0, 1fr) auto; }
}
#${APP_ID}[data-reduce-motion="true"] *,
#${APP_ID}[data-reduce-motion="true"] *::before,
#${APP_ID}[data-reduce-motion="true"] *::after {
  animation-duration: .01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: .01ms !important;
  scroll-behavior: auto !important;
}
@media (prefers-reduced-motion: reduce) {
  #${APP_ID} *, #${APP_ID} *::before, #${APP_ID} *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
`;

function setOf(value) {
  if (value instanceof Set) return value;
  if (Array.isArray(value)) return new Set(value);
  return new Set();
}

export function keyOf(user) {
  return String(user?.id || String(user?.handle || "").toLowerCase());
}

function hiddenKeys(user) {
  return [
    keyOf(user),
    String(user?.id || ""),
    String(user?.handle || "").toLowerCase(),
  ].filter(Boolean);
}

function isHidden(user, hidden) {
  return hiddenKeys(user).some((key) => hidden.has(key));
}

export function getDisplayUsers(state) {
  const filters = { ...DEFAULT_FILTERS, ...(state.filters || {}) };
  const hidden = setOf(state.hidden);
  const search = String(state.search || "")
    .trim()
    .toLowerCase()
    .replace(/^@/, "");
  return (state.users || [])
    .filter((user) => user && user.handle)
    .filter((user) => user.followsViewer !== true)
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

export function pruneSelection(state) {
  const visible = new Set(getDisplayUsers(state).map(keyOf));
  const selected = setOf(state.selected);
  for (const key of [...selected]) {
    if (!visible.has(key)) selected.delete(key);
  }
  state.selected = selected;
  return selected;
}

function selectedUsers(state) {
  const selected = setOf(state.selected);
  return (state.users || []).filter(
    (user) => user && user.handle && selected.has(keyOf(user))
  );
}

function visibleSelectedCount(state) {
  const selected = setOf(state.selected);
  return getDisplayUsers(state).filter((user) => selected.has(keyOf(user))).length;
}

function countLabel(state, t) {
  const count = getDisplayUsers(state).length;
  if (count === 0) return t("foundNone");
  if (count === 1) return t("foundOne");
  return t("foundCount", { count });
}

function profileUrl(handle) {
  return `https://x.com/${encodeURIComponent(handle)}`;
}

function avatarHTML(user) {
  const src = /^https?:\/\//i.test(String(user.avatar || ""))
    ? user.avatar
    : "";
  if (src && !isDefaultAvatar(user)) {
    return `<img class="ux-avatar" src="${escapeAttr(src)}" alt="" loading="lazy">`;
  }
  const initial = String(user.name || user.handle || "?")
    .trim()
    .charAt(0)
    .toUpperCase();
  return `<span class="ux-avatar ux-avatar-fallback" aria-hidden="true">${escapeHTML(
    initial || "?"
  )}</span>`;
}

function badgesHTML(user, t) {
  const badges = [];
  if (user.verified) {
    badges.push(
      `<span class="ux-badge ux-badge-blue" title="${escapeAttr(
        t("filterVerified")
      )}">${ICONS.check}</span>`
    );
  }
  if (user.protected) {
    badges.push(
      `<span class="ux-badge" title="${escapeAttr(
        t("protectedBadge")
      )}">${LOCK}</span>`
    );
  }
  if (user.followsViewer === true) {
    badges.push(
      `<span class="ux-badge ux-badge-warn">${escapeHTML(
        t("followsYou")
      )}</span>`
    );
  }
  if (user.followsViewer === null || user.followsViewer === undefined) {
    badges.push(
      `<span class="ux-badge ux-badge-muted">${escapeHTML(
        t("unknown")
      )}</span>`
    );
  }
  return badges.length ? `<span class="ux-badges">${badges.join("")}</span>` : "";
}

export function renderRow(user, state) {
  const t = makeT(state.language);
  const key = keyOf(user);
  const selected = setOf(state.selected).has(key);
  const hidden = isHidden(user, setOf(state.hidden));
  return `<div class="ux-row${hidden ? " is-hidden" : ""}" data-row="${escapeAttr(
    key
  )}">
    <input type="checkbox" data-select="${escapeAttr(key)}" ${
    selected ? "checked" : ""
  } aria-label="${escapeAttr(user.handle)}">
    <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener" aria-label="${escapeAttr(
    t("openOnX")
  )}">${avatarHTML(user)}</a>
    <div class="ux-user">
      <a href="${escapeAttr(profileUrl(user.handle))}" target="_blank" rel="noreferrer noopener"><strong>${escapeHTML(
    user.name || user.handle
  )}</strong></a>
      <span>@${escapeHTML(user.handle)} ${badgesHTML(user, t)}</span>
    </div>
    <div class="ux-row-actions">
      <button class="ux-icon-btn" data-copy="${escapeAttr(
        user.handle
      )}" title="${escapeAttr(
    t("copyHandle", { handle: user.handle })
  )}" aria-label="${escapeAttr(
    t("copyHandle", { handle: user.handle })
  )}">${ICONS.copy}</button>
      <button class="ux-icon-btn" data-hide="${escapeAttr(key)}" title="${escapeAttr(
    hidden ? t("unhideUser", { handle: user.handle }) : t("hideUser", { handle: user.handle })
  )}" aria-label="${escapeAttr(
    hidden ? t("unhideUser", { handle: user.handle }) : t("hideUser", { handle: user.handle })
  )}">${hidden ? ICONS.eye : ICONS.eyeOff}</button>
      <a class="ux-icon-btn" href="${escapeAttr(
        profileUrl(user.handle)
      )}" target="_blank" rel="noreferrer noopener" title="${escapeAttr(
    t("openOnX")
  )}" aria-label="${escapeAttr(t("openOnX"))}">${ICONS.external}</a>
    </div>
  </div>`;
}

function renderMiniRow(user, state) {
  return `<div class="ux-mini-row">${avatarHTML(user)}<div class="ux-mini-user"><strong>${escapeHTML(
    user.name || user.handle
  )}</strong><span>@${escapeHTML(user.handle)}</span></div></div>`;
}

function renderEmpty(state, t) {
  const hasUsers = (state.users || []).some(
    (user) => user && user.followsViewer !== true
  );
  if (!hasUsers) {
    return `<div class="ux-empty"><strong>${escapeHTML(
      t("foundNone")
    )}</strong>${escapeHTML(t("rescan"))}</div>`;
  }
  return `<div class="ux-empty"><strong>${escapeHTML(
    t("noMatches")
  )}</strong>${escapeHTML(t("selectHint"))}</div>`;
}

function chip(label, key, on, extra = "") {
  return `<button class="ux-chip${on ? " is-on" : ""}" data-filter="${key}">${escapeHTML(
    label
  )}${extra}</button>`;
}

export function renderResultsView(state) {
  const t = makeT(state.language);
  const users = getDisplayUsers(state);
  const selected = setOf(state.selected);
  const hidden = setOf(state.hidden);
  const selectedCount = visibleSelectedCount(state);
  const allSelected = users.length > 0 && users.every((u) => selected.has(keyOf(u)));
  const someSelected = users.some((u) => selected.has(keyOf(u)));
  const filters = { ...DEFAULT_FILTERS, ...(state.filters || {}) };
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
        t("partialBody", { count: state.scan?.scanned || users.length })
      )}</span></div>`
    );
  }
  if (state.error) {
    warnings.push(
      `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(
        state.error
      )}</span></div>`
    );
  }
  return `<section class="ux-view ux-results" data-view="results">
    <div class="ux-results-head">
      <div>
        <h2 data-result-count>${escapeHTML(countLabel(state, t))}</h2>
        <p>${escapeHTML(t("reviewHint"))}</p>
      </div>
      <div class="ux-results-links">
        ${
          state.partial && state.checkpoint
            ? `<button class="ux-link" data-action="resume">${escapeHTML(
                t("resumeAfter")
              )}</button>`
            : ""
        }
        <button class="ux-link" data-action="rescan">${escapeHTML(
          t("rescan")
        )}</button>
      </div>
    </div>
    ${warnings.join("")}
    <label class="ux-search">${ICONS.search}<input data-search value="${escapeAttr(
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
    </div>
    <div class="ux-list" data-list>${
      users.length ? users.map((user) => renderRow(user, state)).join("") : renderEmpty(state, t)
    }</div>
    <div class="ux-actionbar" data-actionbar>
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
        selectedCount === 0 || state.unverified ? "disabled" : ""
      } data-unfollow-label>${escapeHTML(
        t("unfollow")
      )}${selectedCount ? ` (${selectedCount})` : ""}</button>
    </div>
    <p class="ux-hint" data-selected-count>${escapeHTML(
      t("selectedCount", { count: selectedCount })
    )}</p>
  </section>`;
}

function renderIdleView(state) {
  const t = makeT(state.language);
  const handle = state.viewer?.handle || "";
  const checkpoint = state.checkpoint;
  const lastScan = state.lastScan;
  return `<section class="ux-view ux-idle" data-view="idle">
    <div class="ux-hero">
      <span class="ux-eyebrow">${escapeHTML(t("tabFollowing"))}</span>
      <h1>${escapeHTML(t("heroTitle"))}</h1>
      <p>${escapeHTML(t("heroBody"))}</p>
    </div>
    <div class="ux-card">
      <div class="ux-card-line">
        <span class="ux-live-dot"></span>
        <strong>@${escapeHTML(handle || "—")}</strong>
        <span class="ux-muted">${escapeHTML(t("navigateHint"))}</span>
      </div>
      <button class="ux-btn ux-btn-primary ux-btn-block" data-action="scan">${ICONS.search}${escapeHTML(
        t("scanBtn")
      )}</button>
    </div>
    <div class="ux-stack">
      ${
        checkpoint
          ? `<button class="ux-btn ux-btn-soft" data-action="resume">${escapeHTML(
              t("resumeAfter")
            )} <span class="ux-muted">· ${checkpoint.users?.length || 0}</span></button>`
          : ""
      }
      ${
        lastScan
          ? `<button class="ux-btn ux-btn-ghost" data-action="show-last">${escapeHTML(
              t("showLastScan")
            )} · ${escapeHTML(timeAgo(lastScan.savedAt, state.language))}</button>`
          : ""
      }
      ${
        !handle
          ? `<button class="ux-btn ux-btn-soft" data-action="manual-handle">${escapeHTML(
              t("manualHandle")
            )}</button>`
          : ""
      }
    </div>
    <div class="ux-safety">${ICONS.check}<span>${escapeHTML(
      t("safetyNote")
    )}</span></div>
  </section>`;
}

function renderScanView(state) {
  const t = makeT(state.language);
  const scan = state.scan || {};
  const scanned = Number(scan.scanned) || (state.users || []).length;
  const total = Number(scan.total) || 0;
  const percent = total ? clamp((scanned / total) * 100, 0, 100) : 0;
  const paused = Boolean(state.paused);
  const users = getDisplayUsers(state).slice(0, 6);
  return `<section class="ux-view ux-scanning" data-view="scanning">
    <div class="ux-scan-top">
      <div>
        <span class="ux-eyebrow">${escapeHTML(
          paused ? t("paused") : t("scanning")
        )}</span>
        <h2 data-live-count>${escapeHTML(countLabel(state, t))}</h2>
      </div>
      <span class="ux-source-badge">${escapeHTML(
        scan.source === "dom" ? t("domBadge") : t("apiBadge")
      )}</span>
    </div>
    <div class="ux-bar${total ? "" : " is-indeterminate"}"><i data-progress-bar style="width:${percent}%"></i></div>
    <div class="ux-scan-meta">
      <span>${escapeHTML(
        total ? t("ofTotal", { count: scanned, total }) : t("ofUnknown", { count: scanned })
      )}</span>
      <span data-scan-page>${escapeHTML(
        t("scanningPage", { page: scan.page || 1, count: scanned })
      )}</span>
    </div>
    <p class="ux-hint" data-scan-hint>${escapeHTML(
      scan.waiting
        ? t("captureWait")
        : paused
          ? t("pausedHint")
          : countdownText(state) || t("liveHint")
    )}</p>
    <div class="ux-live-list" data-live-list>${
      users.length
        ? users.map((user) => renderMiniRow(user, state)).join("")
        : `<div class="ux-empty">${escapeHTML(t("liveEmpty"))}</div>`
    }</div>
    <div class="ux-actions">
      <button class="ux-btn ux-btn-soft" data-action="${
        paused ? "resume-scan" : "pause-scan"
      }">${escapeHTML(paused ? t("resume") : t("pause"))}</button>
      <button class="ux-btn ux-btn-danger" data-action="cancel-scan">${escapeHTML(
        t("cancel")
      )}</button>
    </div>
  </section>`;
}

function renderUnfollowLog(run, t) {
  const log = (run.log || []).slice(-5).reverse();
  return log.length
    ? log
        .map(
          (entry) =>
            `<div class="ux-log-row${entry.ok ? "" : " is-fail"}"><span class="ux-dot"></span><span>@${escapeHTML(
              entry.handle || "—"
            )}</span><span>${escapeHTML(
              entry.ok ? "ok" : entry.reason || "fail"
            )}</span></div>`
        )
        .join("")
    : `<div class="ux-empty">${escapeHTML(t("unfollowHint"))}</div>`;
}

function renderUnfollowView(state) {
  const t = makeT(state.language);
  const run = state.unfollow || {};
  const total = Number(run.total) || 0;
  const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
  const percent = total ? clamp((done / total) * 100, 0, 100) : 0;
  const paused = Boolean(state.paused);
  return `<section class="ux-view ux-unfollowing" data-view="unfollowing">
    <div class="ux-scan-top">
      <div>
        <span class="ux-eyebrow" data-unfollow-eyebrow>${escapeHTML(
          paused ? t("paused") : t("unfollowing")
        )}</span>
        <h2 data-unfollow-count>${escapeHTML(
          String(done)
        )} / ${escapeHTML(String(total))}</h2>
      </div>
      <span class="ux-source-badge" data-unfollow-transport>${escapeHTML(
        String(run.transport || "mutation").toUpperCase()
      )}</span>
    </div>
    <div class="ux-bar"><i data-unfollow-progress style="width:${percent}%"></i></div>
    <div class="ux-current" data-unfollow-current>${escapeHTML(
      t("currently", { handle: run.current || "—" })
    )}</div>
    <div class="ux-next" data-next>${escapeHTML(countdownText(state))}</div>
    <div class="ux-statline">
      <div class="ux-stat"><strong data-unfollow-ok>${Number(run.ok) || 0}</strong><span>ok</span></div>
      <div class="ux-stat"><strong data-unfollow-fail>${Number(run.fail) || 0}</strong><span>fail</span></div>
      <div class="ux-stat"><strong data-unfollow-left>${Math.max(
        0,
        total - done
      )}</strong><span>left</span></div>
    </div>
    <div class="ux-log" data-unfollow-log>${renderUnfollowLog(run, t)}</div>
    <p class="ux-hint" data-unfollow-hint>${escapeHTML(
      paused ? t("unfollowPausedHint") : t("unfollowHint")
    )}</p>
    <div class="ux-actions">
      <button class="ux-btn ux-btn-soft" data-unfollow-toggle data-action="${
        paused ? "resume-unfollow" : "pause-unfollow"
      }">${escapeHTML(paused ? t("resume") : t("pause"))}</button>
      <button class="ux-btn ux-btn-danger" data-action="cancel-unfollow">${escapeHTML(
        t("cancel")
      )}</button>
    </div>
  </section>`;
}

function renderDoneView(state) {
  const t = makeT(state.language);
  const run = state.unfollow || {};
  const cooldown = countdownText(state);
  return `<section class="ux-view ux-done" data-view="done">
    <div class="ux-done-icon">${ICONS.check}</div>
    <h2>${escapeHTML(t("unfollowDoneTitle"))}</h2>
    <p>${escapeHTML(
      t("unfollowDoneBody", {
        ok: Number(run.ok) || 0,
        fail: Number(run.fail) || 0,
        remaining: Number(run.remaining) || 0,
      })
    )}</p>
    ${cooldown ? `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(cooldown)}</span></div>` : ""}
    <div class="ux-actions">
      <button class="ux-btn ux-btn-primary" data-action="rescan">${escapeHTML(
        t("rescan")
      )}</button>
      <button class="ux-btn ux-btn-soft" data-action="close">${escapeHTML(
        t("close")
      )}</button>
    </div>
  </section>`;
}

function renderErrorView(state) {
  const t = makeT(state.language);
  const cooldown = countdownText(state);
  return `<section class="ux-view ux-error" data-view="error">
    <div class="ux-error-icon">${ICONS.alert}</div>
    <h2>${escapeHTML(t("scanFailed"))}</h2>
    <p>${escapeHTML(state.error || t("unknownError"))}</p>
    ${cooldown ? `<div class="ux-warning">${ICONS.alert}<span>${escapeHTML(cooldown)}</span></div>` : ""}
    <div class="ux-actions">
      <button class="ux-btn ux-btn-primary" data-action="retry-scan">${escapeHTML(
        t("retry")
      )}</button>
      <button class="ux-btn ux-btn-soft" data-action="back">${escapeHTML(
        t("goBack")
      )}</button>
    </div>
  </section>`;
}

function renderMode(state) {
  if (state.mode === "scanning") return renderScanView(state);
  if (state.mode === "results") return renderResultsView(state);
  if (state.mode === "unfollowing") return renderUnfollowView(state);
  if (state.mode === "done") return renderDoneView(state);
  if (state.mode === "error") return renderErrorView(state);
  return renderIdleView(state);
}

export function renderShell(state) {
  const t = makeT(state.language);
  const handle = state.viewer?.handle || "";
  return `<div class="ux-panel" data-panel>
    <header class="ux-head" data-drag>
      <div class="ux-brand">
        <span class="ux-mark">X</span>
        <div class="ux-brand-text">
          <strong>${escapeHTML(t("appTitle"))}</strong>
          <span>${escapeHTML(handle ? `@${handle}` : t("subtitle"))}</span>
        </div>
      </div>
      <div class="ux-head-actions">
        <button class="ux-lang" data-action="toggle-language" title="${escapeAttr(
          t("langSwitch")
        )}">${escapeHTML(t("langCode"))}</button>
        <button class="ux-icon-btn" data-action="settings" title="${escapeAttr(
          t("settings")
        )}" aria-label="${escapeAttr(t("settings"))}">${ICONS.gear}</button>
        <button class="ux-icon-btn" data-action="minimize" title="${escapeAttr(
          t("minimize")
        )}" aria-label="${escapeAttr(t("minimize"))}">${ICONS.minimize}</button>
        <button class="ux-icon-btn is-danger" data-action="close" title="${escapeAttr(
          t("close")
        )}" aria-label="${escapeAttr(t("close"))}">${ICONS.close}</button>
      </div>
    </header>
    <div class="ux-body">${renderMode(state)}</div>
    <footer class="ux-foot">
      <span><span class="ux-foot-dot"></span>${escapeHTML(t("appTitle"))} v${escapeHTML(
        VERSION
      )}</span>
      <span>${escapeHTML(state.source === "dom" ? t("domBadge") : t("apiBadge"))}</span>
    </footer>
  </div>`;
}

export function pillLabel(state) {
  const t = makeT(state.language);
  if (state.mode === "scanning") {
    return `${t("pillScanning")} · ${Number(state.scan?.scanned) || (state.users || []).length}`;
  }
  if (state.mode === "unfollowing") {
    return `${t("pillUnfollowing")} · ${Number(state.unfollow?.ok) || 0}/${Number(
      state.unfollow?.total
    ) || 0}`;
  }
  if (state.mode === "results" || state.mode === "done") {
    return t("pillResults", { count: getDisplayUsers(state).length });
  }
  return t("pillIdle");
}

export function renderPill(state) {
  return `<button class="ux-pill" data-action="expand" title="${escapeAttr(
    makeT(state.language)("expand")
  )}">
    <span class="ux-pill-dot ${escapeAttr(state.mode || "idle")}"></span>
    <span data-pill-label>${escapeHTML(pillLabel(state))}</span>
    ${ICONS.expand}
  </button>`;
}

export function countdownText(state) {
  const t = makeT(state.language);
  const now = Date.now();
  if (Number(state.cooldownUntil) > now) {
    return t("cooldownIn", { time: formatClock(state.cooldownUntil) });
  }
  if (Number(state.scanPauseUntil) > now) {
    return t("scanPause", {
      seconds: Math.ceil((Number(state.scanPauseUntil) - now) / 1000),
    });
  }
  if (Number(state.unfollow?.nextAt) > now) {
    return t("nextActionIn", {
      seconds: Math.ceil((Number(state.unfollow.nextAt) - now) / 1000),
    });
  }
  return "";
}

function field(label, key, value, { min = 0, max = 9999, step = 1 } = {}) {
  return `<label class="ux-field"><span>${escapeHTML(
    label
  )}</span><input type="number" data-setting="${key}" value="${escapeAttr(
    value
  )}" min="${min}" max="${max}" step="${step}" inputmode="decimal"></label>`;
}

export function settingsHTML(timings = {}, language = "en") {
  const t = makeT(language);
  const merged = { ...DEFAULT_TIMINGS, ...timings };
  const seconds = (value) => (Number(value) / 1000).toFixed(1);
  return `<div class="ux-settings" data-settings-body>
    <div class="ux-settings-group">
      <div class="ux-settings-title">Scan</div>
      ${field(t("minScanDelay"), "scanDelayMin", seconds(merged.scanDelayMin), {
        min: 0.5,
        max: 60,
        step: 0.5,
      })}
      ${field(t("maxScanDelay"), "scanDelayMax", seconds(merged.scanDelayMax), {
        min: 0.5,
        max: 60,
        step: 0.5,
      })}
      ${field(t("scanPauseEvery"), "scanPauseEveryPages", merged.scanPauseEveryPages, {
        min: 1,
        max: 100,
      })}
      ${field(t("scanPauseLength"), "scanPauseMs", seconds(merged.scanPauseMs), {
        min: 0,
        max: 600,
        step: 1,
      })}
      ${field(t("usersPerRequest"), "usersPerRequest", merged.usersPerRequest, {
        min: 1,
        max: 100,
      })}
    </div>
    <div class="ux-settings-group">
      <div class="ux-settings-title">Unfollow</div>
      ${field(
        t("minUnfollowDelay"),
        "unfollowDelayMin",
        seconds(merged.unfollowDelayMin),
        { min: 5, max: 120, step: 1 }
      )}
      ${field(
        t("maxUnfollowDelay"),
        "unfollowDelayMax",
        seconds(merged.unfollowDelayMax),
        { min: 5, max: 180, step: 1 }
      )}
      ${field(t("unfollowPauseEvery"), "unfollowPauseEvery", merged.unfollowPauseEvery, {
        min: 1,
        max: 200,
      })}
      ${field(
        t("unfollowPauseLength"),
        "unfollowPauseMs",
        seconds(merged.unfollowPauseMs),
        { min: 0, max: 3600, step: 1 }
      )}
      ${field(t("maxUnfollows"), "maxUnfollows", merged.maxUnfollows, {
        min: 1,
        max: 400,
      })}
    </div>
  </div>`;
}

export function readSettings(root) {
  const read = (key, fallback) => {
    const element = root?.querySelector?.(`[data-setting="${key}"]`);
    const number = Number(element?.value);
    return Number.isFinite(number) ? number : fallback;
  };
  const scanDelayMin = clamp(read("scanDelayMin", 1.5) * 1000, 500, 60000);
  const scanDelayMax = Math.max(
    scanDelayMin,
    clamp(read("scanDelayMax", 2.5) * 1000, 500, 60000)
  );
  const unfollowDelayMin = clamp(
    read("unfollowDelayMin", 12) * 1000,
    5000,
    120000
  );
  const unfollowDelayMax = Math.max(
    unfollowDelayMin,
    clamp(read("unfollowDelayMax", 20) * 1000, 5000, 180000)
  );
  return {
    scanDelayMin,
    scanDelayMax,
    scanPauseEveryPages: Math.round(
      clamp(read("scanPauseEveryPages", 10), 1, 100)
    ),
    scanPauseMs: clamp(read("scanPauseMs", 10) * 1000, 0, 600000),
    usersPerRequest: Math.round(clamp(read("usersPerRequest", 50), 1, 100)),
    unfollowDelayMin,
    unfollowDelayMax,
    unfollowPauseEvery: Math.round(
      clamp(read("unfollowPauseEvery", 25), 1, 200)
    ),
    unfollowPauseMs: clamp(
      read("unfollowPauseMs", 300) * 1000,
      0,
      3600000
    ),
    maxUnfollows: Math.round(clamp(read("maxUnfollows", 190), 1, 400)),
  };
}

export function showDialog({
  title,
  body = "",
  contentHTML = "",
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  extraLabel = "",
  destructive = false,
  onConfirm,
  onCancel,
  onExtra,
} = {}) {
  const host = document.getElementById(APP_ID) || document.body;
  const previousFocus = document.activeElement;
  const overlay = document.createElement("div");
  overlay.className = "ux-overlay";
  overlay.innerHTML = `<div class="ux-dialog" role="dialog" aria-modal="true" aria-label="${escapeAttr(
    title
  )}">
    <h3>${escapeHTML(title)}</h3>
    ${body ? `<p>${escapeHTML(body)}</p>` : ""}
    ${contentHTML ? `<div class="ux-dialog-content">${contentHTML}</div>` : ""}
    <div class="ux-dialog-actions">
      ${extraLabel ? `<button class="ux-btn ux-btn-ghost" type="button" data-extra>${escapeHTML(extraLabel)}</button>` : ""}
      <button class="ux-btn ux-btn-soft" type="button" data-cancel>${escapeHTML(
        cancelLabel
      )}</button>
      <button class="ux-btn ${destructive ? "ux-btn-danger" : "ux-btn-primary"}" type="button" data-confirm>${escapeHTML(
        confirmLabel
      )}</button>
    </div>
  </div>`;
  host.appendChild(overlay);

  const focusables = () =>
    [...overlay.querySelectorAll("button, input, select, textarea, [href]")].filter(
      (element) => !element.disabled
    );

  const close = () => {
    document.removeEventListener("keydown", onKey, true);
    overlay.remove();
    try {
      previousFocus?.focus?.();
    } catch {
      // Ignore focus restoration failures.
    }
  };
  const onKey = (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel?.();
      close();
      return;
    }
    if (event.key !== "Tab") return;
    const items = focusables();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  overlay.querySelector("[data-confirm]")?.addEventListener("click", () => {
    onConfirm?.(overlay);
    close();
  });
  overlay.querySelector("[data-cancel]")?.addEventListener("click", () => {
    onCancel?.();
    close();
  });
  overlay.querySelector("[data-extra]")?.addEventListener("click", () => {
    onExtra?.(overlay);
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      onCancel?.();
      close();
    }
  });
  document.addEventListener("keydown", onKey, true);
  setTimeout(() => {
    const target =
      overlay.querySelector("[data-confirm]") ||
      overlay.querySelector("input") ||
      overlay.querySelector("button");
    target?.focus?.();
  }, 0);
  return { overlay, close };
}

let toastTimer = null;

export function toast(message) {
  if (!message || typeof document === "undefined") return;
  const host = document.getElementById(APP_ID) || document.body;
  host.querySelectorAll(".ux-toast").forEach((node) => node.remove());
  const element = document.createElement("div");
  element.className = "ux-toast";
  element.setAttribute("role", "status");
  element.textContent = message;
  host.appendChild(element);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.remove(), 3500);
}

export function applyPanelPosition(panel, position) {
  if (!panel) return;
  if (position && Number.isFinite(Number(position.left)) && Number.isFinite(Number(position.top))) {
    const margin = 8;
    const maxLeft = Math.max(margin, window.innerWidth - panel.offsetWidth - margin);
    const maxTop = Math.max(margin, window.innerHeight - panel.offsetHeight - margin);
    panel.style.left = `${clamp(Number(position.left), margin, maxLeft)}px`;
    panel.style.top = `${clamp(Number(position.top), margin, maxTop)}px`;
    panel.style.right = "auto";
  } else {
    panel.style.left = "";
    panel.style.top = "";
    panel.style.right = "";
  }
}

export function bindDrag(handle, panel, onEnd) {
  if (!handle || !panel || typeof handle.addEventListener !== "function") return;
  handle.style.touchAction = "none";
  handle.addEventListener("pointerdown", (event) => {
    if (event.target.closest?.("button, a, input")) return;
    const rect = panel.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const offsetX = startX - rect.left;
    const offsetY = startY - rect.top;
    panel.style.right = "auto";
    const move = (moveEvent) => {
      const maxLeft = Math.max(8, window.innerWidth - panel.offsetWidth - 8);
      const maxTop = Math.max(8, window.innerHeight - panel.offsetHeight - 8);
      panel.style.left = `${clamp(moveEvent.clientX - offsetX, 8, maxLeft)}px`;
      panel.style.top = `${clamp(moveEvent.clientY - offsetY, 8, maxTop)}px`;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      onEnd?.({
        left: Number.parseFloat(panel.style.left) || rect.left,
        top: Number.parseFloat(panel.style.top) || rect.top,
      });
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
    event.preventDefault();
  });
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function copyText(text, message) {
  const done = () => toast(message);
  try {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => {
        fallbackCopy(text);
        done();
      });
      return;
    }
  } catch {
    // Fall through to the textarea trick.
  }
  fallbackCopy(text);
  done();
}

function fallbackCopy(text) {
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  } catch {
    // Clipboard access can be denied; the toast still tells the user what happened.
  }
}

export function mountUI({ state, onAction = () => {}, onChange = () => {} } = {}) {
  ensureStyles();
  document.getElementById(APP_ID)?.remove();
  const root = document.createElement("div");
  root.id = APP_ID;
  document.body.appendChild(root);

  const t = () => makeT(state.language);

  const updateResults = () => {
    const users = getDisplayUsers(state);
    const list = root.querySelector("[data-list]");
    if (list) {
      list.innerHTML = users.length
        ? users.map((user) => renderRow(user, state)).join("")
        : renderEmpty(state, t());
    }
    const count = root.querySelector("[data-result-count]");
    if (count) count.textContent = countLabel(state, t());
    const selectedCount = visibleSelectedCount(state);
    const selectedLabel = root.querySelector("[data-selected-count]");
    if (selectedLabel) {
      selectedLabel.textContent = t()("selectedCount", {
        count: selectedCount,
      });
    }
    const unfollow = root.querySelector('[data-action="unfollow"]');
    if (unfollow) {
      unfollow.disabled = selectedCount === 0 || Boolean(state.unverified);
      unfollow.textContent = `${t()("unfollow")}${
        selectedCount ? ` (${selectedCount})` : ""
      }`;
    }
    const selectAll = root.querySelector("[data-select-all]");
    if (selectAll) {
      const selected = setOf(state.selected);
      const all = users.length > 0 && users.every((u) => selected.has(keyOf(u)));
      const some = users.some((u) => selected.has(keyOf(u)));
      selectAll.checked = all;
      selectAll.indeterminate = some && !all;
    }
    root.querySelectorAll("[data-filter]").forEach((button) => {
      const key = button.getAttribute("data-filter");
      button.classList.toggle("is-on", Boolean(state.filters?.[key]));
    });
  };

  const updateScanning = () => {
    const scanned =
      Number(state.scan?.scanned) || (state.users || []).length;
    const total = Number(state.scan?.total) || 0;
    const count = root.querySelector("[data-live-count]");
    if (count) count.textContent = countLabel(state, t());
    const bar = root.querySelector("[data-progress-bar]");
    if (bar) {
      bar.style.width = `${total ? clamp((scanned / total) * 100, 0, 100) : 0}%`;
    }
    const page = root.querySelector("[data-scan-page]");
    if (page) {
      page.textContent = t()("scanningPage", {
        page: state.scan?.page || 1,
        count: scanned,
      });
    }
    const hint = root.querySelector("[data-scan-hint]");
    if (hint) {
      hint.textContent = state.scan?.waiting
        ? t()("captureWait")
        : state.paused
          ? t()("pausedHint")
          : countdownText(state) || t()("liveHint");
    }
    const list = root.querySelector("[data-live-list]");
    if (list) {
      const users = getDisplayUsers(state).slice(0, 6);
      list.innerHTML = users.length
        ? users.map((user) => renderMiniRow(user, state)).join("")
        : `<div class="ux-empty">${escapeHTML(t()("liveEmpty"))}</div>`;
    }
  };

  const updateUnfollowing = () => {
    const t = makeT(state.language);
    const run = state.unfollow || {};
    const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
    const total = Number(run.total) || 0;
    const paused = Boolean(state.paused);
    const bar = root.querySelector("[data-unfollow-progress]");
    if (bar) bar.style.width = `${total ? clamp((done / total) * 100, 0, 100) : 0}%`;
    const eyebrow = root.querySelector("[data-unfollow-eyebrow]");
    if (eyebrow) {
      eyebrow.textContent = paused ? t("paused") : t("unfollowing");
    }
    const count = root.querySelector("[data-unfollow-count]");
    if (count) count.textContent = `${done} / ${total}`;
    const transport = root.querySelector("[data-unfollow-transport]");
    if (transport) {
      transport.textContent = String(run.transport || "mutation").toUpperCase();
    }
    const current = root.querySelector("[data-unfollow-current]");
    if (current) {
      current.textContent = t("currently", { handle: run.current || "—" });
    }
    const next = root.querySelector("[data-next]");
    if (next) next.textContent = countdownText(state);
    const ok = root.querySelector("[data-unfollow-ok]");
    if (ok) ok.textContent = String(Number(run.ok) || 0);
    const fail = root.querySelector("[data-unfollow-fail]");
    if (fail) fail.textContent = String(Number(run.fail) || 0);
    const left = root.querySelector("[data-unfollow-left]");
    if (left) left.textContent = String(Math.max(0, total - done));
    const log = root.querySelector("[data-unfollow-log]");
    if (log) {
      const nextLog = renderUnfollowLog(run, t);
      if (log.innerHTML !== nextLog) log.innerHTML = nextLog;
    }
    const hint = root.querySelector("[data-unfollow-hint]");
    if (hint) {
      hint.textContent = paused ? t("unfollowPausedHint") : t("unfollowHint");
    }
    const toggle = root.querySelector("[data-unfollow-toggle]");
    if (toggle) {
      toggle.setAttribute(
        "data-action",
        paused ? "resume-unfollow" : "pause-unfollow"
      );
      toggle.textContent = paused ? t("resume") : t("pause");
    }
  };

  const update = () => {
    if (!root.isConnected) return;
    if (state.minimized) {
      const dot = root.querySelector(".ux-pill-dot");
      const label = root.querySelector("[data-pill-label]");
      if (!dot || !label) {
        root.innerHTML = renderPill(state);
        return;
      }
      dot.className = `ux-pill-dot ${state.mode || "idle"}`;
      label.textContent = pillLabel(state);
      return;
    }
    const view = root.querySelector("[data-view]");
    if (!view || view.getAttribute("data-view") !== state.mode) {
      render();
      return;
    }
    if (state.mode === "results") updateResults();
    else if (state.mode === "scanning") updateScanning();
    else if (state.mode === "unfollowing") updateUnfollowing();
  };

  const render = () => {
    root.innerHTML = state.minimized ? renderPill(state) : renderShell(state);
    if (!state.minimized) {
      const panel = root.querySelector("[data-panel]");
      const drag = root.querySelector("[data-drag]");
      applyPanelPosition(panel, state.panelPos);
      bindDrag(drag, panel, (position) => {
        state.panelPos = position;
        onChange();
      });
    }
  };

  const openSettings = () => {
    const dialog = showDialog({
      title: t()("settingsTitle"),
      body: t()("settingsBody"),
      contentHTML: settingsHTML(state.timings, state.language),
      confirmLabel: t()("save"),
      cancelLabel: t()("cancel"),
      extraLabel: t()("restoreDefaults"),
      onExtra: (overlay) => {
        const body = overlay.querySelector("[data-settings-body]");
        if (body) {
          const replacement = document.createElement("div");
          replacement.innerHTML = settingsHTML(
            DEFAULT_TIMINGS,
            state.language
          );
          const fresh = replacement.querySelector("[data-settings-body]");
          if (fresh) body.innerHTML = fresh.innerHTML;
        }
      },
      onConfirm: (overlay) => {
        const timings = readSettings(overlay);
        state.timings = timings;
        onAction("save-settings", timings);
      },
    });
    return dialog;
  };

  const openManualHandle = () => {
    showDialog({
      title: t()("manualHandle"),
      body: t()("manualHandleBody"),
      contentHTML: `<input class="ux-input" data-manual-handle placeholder="@handle" autocomplete="off" spellcheck="false">`,
      confirmLabel: t()("openFollowing"),
      cancelLabel: t()("cancel"),
      onConfirm: (overlay) => {
        const value = String(
          overlay.querySelector("[data-manual-handle]")?.value || ""
        )
          .trim()
          .replace(/^@/, "");
        if (value) onAction("manual-handle", value);
      },
    });
  };

  const confirmUnfollow = () => {
    const selected = selectedUsers(state);
    if (!selected.length) {
      toast(t()("noSelection"));
      return;
    }
    if (state.unverified) return;
    const count = selected.length;
    showDialog({
      title: t()("unfollowConfirmTitle", { count }),
      body: t()("unfollowConfirmBody"),
      confirmLabel: t()("unfollowConfirmBtn", { count }),
      cancelLabel: t()("cancel"),
      destructive: true,
      onConfirm: () => onAction("start-unfollow"),
    });
  };

  const onClick = (event) => {
    const actionElement = event.target.closest?.("[data-action]");
    if (actionElement) {
      const action = actionElement.getAttribute("data-action");
      const actions = new Set([
        "toggle-language",
        "settings",
        "minimize",
        "expand",
        "close",
        "scan",
        "resume",
        "show-last",
        "manual-handle",
        "pause-scan",
        "resume-scan",
        "cancel-scan",
        "rescan",
        "copy-all",
        "select-none",
        "unfollow",
        "pause-unfollow",
        "resume-unfollow",
        "cancel-unfollow",
        "retry-scan",
        "back",
        "open-following",
      ]);
      if (actions.has(action)) {
        event.preventDefault();
        if (action === "settings") openSettings();
        else if (action === "manual-handle") openManualHandle();
        else if (action === "select-none") {
          state.selected = new Set();
          onChange();
          update();
        } else if (action === "copy-all") {
          const handles = getDisplayUsers(state).map((user) => user.handle);
          if (handles.length) {
            copyText(
              handles.join("\n"),
              t()("copiedHandles", { count: handles.length })
            );
          }
        } else if (action === "unfollow") confirmUnfollow();
        else if (action === "minimize") {
          state.minimized = true;
          onChange();
          render();
        } else if (action === "expand") {
          state.minimized = false;
          onChange();
          render();
        } else onAction(action, actionElement);
        return;
      }
    }

    const filter = event.target.closest?.("[data-filter]");
    if (filter) {
      const key = filter.getAttribute("data-filter");
      state.filters = { ...DEFAULT_FILTERS, ...(state.filters || {}) };
      state.filters[key] = !state.filters[key];
      pruneSelection(state);
      onChange();
      update();
      return;
    }

    const hide = event.target.closest?.("[data-hide]");
    if (hide) {
      const key = hide.getAttribute("data-hide");
      if (!(state.hidden instanceof Set)) {
        state.hidden = new Set(state.hidden || []);
      }
      if (state.hidden.has(key)) state.hidden.delete(key);
      else state.hidden.add(key);
      onChange();
      update();
      return;
    }

    const copy = event.target.closest?.("[data-copy]");
    if (copy) {
      const handle = copy.getAttribute("data-copy");
      copyText(handle, t()("copiedToast"));
    }
  };

  const onChangeEvent = (event) => {
    const select = event.target.closest?.("[data-select]");
    if (select) {
      const key = select.getAttribute("data-select");
      if (!(state.selected instanceof Set)) {
        state.selected = new Set(state.selected || []);
      }
      if (select.checked) state.selected.add(key);
      else state.selected.delete(key);
      onChange();
      updateResults();
      return;
    }
    const all = event.target.closest?.("[data-select-all]");
    if (all) {
      const users = getDisplayUsers(state);
      if (!(state.selected instanceof Set)) {
        state.selected = new Set(state.selected || []);
      }
      for (const user of users) {
        const key = keyOf(user);
        if (all.checked) state.selected.add(key);
        else state.selected.delete(key);
      }
      onChange();
      updateResults();
    }
  };

  const onInput = (event) => {
    const search = event.target.closest?.("[data-search]");
    if (!search) return;
    state.search = search.value;
    onChange();
    updateResults();
  };

  root.addEventListener("click", onClick);
  root.addEventListener("change", onChangeEvent);
  root.addEventListener("input", onInput);

  render();

  return {
    root,
    render,
    update,
    toast,
    destroy() {
      root.removeEventListener("click", onClick);
      root.removeEventListener("change", onChangeEvent);
      root.removeEventListener("input", onInput);
      clearTimeout(toastTimer);
      toastTimer = null;
      root.querySelectorAll(".ux-toast").forEach((node) => node.remove());
      root.remove();
      document.getElementById(STYLE_ID)?.remove();
    },
  };
}
