import {
  APP_ID,
  STYLE_ID,
  ICONS,
  DEFAULT_TIMINGS,
  DEFAULT_FILTERS,
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
  --ux-bg: #0a0e13;
  --ux-panel: rgba(15, 20, 26, 0.96);
  --ux-panel-2: rgba(23, 30, 38, 0.96);
  --ux-border: rgba(255, 255, 255, 0.10);
  --ux-border-strong: rgba(255, 255, 255, 0.18);
  --ux-text: #e7e9ea;
  --ux-muted: #8b98a5;
  --ux-faint: #61707d;
  --ux-accent: #1d9bf0;
  --ux-accent-2: #7856ff;
  --ux-ok: #00ba7c;
  --ux-danger: #f4212e;
  --ux-warn: #ffd400;
  position: fixed;
  top: 68px;
  right: 18px;
  z-index: 2147483647;
  color: var(--ux-text);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.35;
  color-scheme: dark;
}
#${APP_ID} button, #${APP_ID} input, #${APP_ID} select, #${APP_ID} textarea { font: inherit; color: inherit; }
#${APP_ID} button { border: 0; background: none; cursor: pointer; }
#${APP_ID} a { color: inherit; text-decoration: none; }
#${APP_ID} svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; display: block; }
#${APP_ID} .ux-panel {
  width: 424px;
  max-height: min(760px, calc(100vh - 32px));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, var(--ux-panel-2), var(--ux-panel));
  border: 1px solid var(--ux-border);
  border-radius: 20px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(29, 155, 240, 0.06) inset;
  backdrop-filter: blur(18px) saturate(1.2);
  -webkit-backdrop-filter: blur(18px) saturate(1.2);
  animation: ux-in 180ms ease-out;
}
@keyframes ux-in { from { opacity: 0; transform: translateY(-6px) scale(.985); } to { opacity: 1; transform: none; } }
#${APP_ID} .ux-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 12px 10px 14px;
  border-bottom: 1px solid var(--ux-border);
  background: linear-gradient(180deg, rgba(29, 155, 240, 0.06), transparent);
  cursor: grab;
  user-select: none;
}
#${APP_ID} .ux-head:active { cursor: grabbing; }
#${APP_ID} .ux-brand { display: flex; align-items: center; gap: 10px; min-width: 0; }
#${APP_ID} .ux-mark {
  width: 34px; height: 34px; border-radius: 11px;
  display: grid; place-items: center;
  font-weight: 900; font-size: 17px; letter-spacing: -0.04em;
  color: #fff;
  background: linear-gradient(145deg, var(--ux-accent), var(--ux-accent-2));
  box-shadow: 0 6px 18px rgba(29, 155, 240, 0.28);
  flex: none;
}
#${APP_ID} .ux-brand-text { display: flex; flex-direction: column; min-width: 0; }
#${APP_ID} .ux-brand-text strong { font-size: 14px; letter-spacing: -0.01em; }
#${APP_ID} .ux-brand-text span { font-size: 11px; color: var(--ux-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-head-actions { display: flex; align-items: center; gap: 2px; flex: none; }
#${APP_ID} .ux-icon-btn {
  width: 30px; height: 30px; border-radius: 9px;
  display: inline-grid; place-items: center;
  color: var(--ux-muted);
  transition: background 120ms ease, color 120ms ease;
}
#${APP_ID} .ux-icon-btn:hover { background: rgba(255,255,255,.08); color: var(--ux-text); }
#${APP_ID} .ux-icon-btn.is-danger:hover { color: var(--ux-danger); }
#${APP_ID} .ux-lang {
  height: 26px; min-width: 34px; padding: 0 8px;
  border-radius: 8px; border: 1px solid var(--ux-border);
  font-size: 11px; font-weight: 700; color: var(--ux-muted);
  letter-spacing: .04em;
}
#${APP_ID} .ux-lang:hover { color: var(--ux-text); border-color: var(--ux-border-strong); }
#${APP_ID} .ux-body { overflow: auto; overscroll-behavior: contain; }
#${APP_ID} .ux-body::-webkit-scrollbar { width: 10px; }
#${APP_ID} .ux-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,.14); border-radius: 99px; border: 3px solid transparent; background-clip: padding-box; }
#${APP_ID} .ux-view { padding: 16px; }
#${APP_ID} .ux-eyebrow { display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 800; letter-spacing: .13em; text-transform: uppercase; color: var(--ux-muted); }
#${APP_ID} .ux-eyebrow::before { content: ""; width: 6px; height: 6px; border-radius: 99px; background: var(--ux-accent); box-shadow: 0 0 10px var(--ux-accent); }
#${APP_ID} h1 { font-size: 22px; line-height: 1.12; letter-spacing: -0.035em; margin: 8px 0 8px; font-weight: 800; }
#${APP_ID} h2 { font-size: 18px; line-height: 1.2; letter-spacing: -0.025em; margin: 0; font-weight: 800; }
#${APP_ID} p { margin: 0; }
#${APP_ID} .ux-muted { color: var(--ux-muted); }
#${APP_ID} .ux-hero p { color: var(--ux-muted); font-size: 13px; line-height: 1.5; }
#${APP_ID} .ux-card {
  margin-top: 14px; padding: 12px;
  border: 1px solid var(--ux-border); border-radius: 16px;
  background: linear-gradient(180deg, rgba(29,155,240,.08), rgba(255,255,255,.02));
}
#${APP_ID} .ux-card-line { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font-size: 12px; color: var(--ux-muted); }
#${APP_ID} .ux-card-line strong { color: var(--ux-text); }
#${APP_ID} .ux-live-dot { width: 8px; height: 8px; border-radius: 99px; background: var(--ux-ok); box-shadow: 0 0 0 4px rgba(0,186,124,.12); flex: none; }
#${APP_ID} .ux-live-dot.is-paused { background: var(--ux-warn); box-shadow: 0 0 0 4px rgba(255,212,0,.12); }
#${APP_ID} .ux-btn {
  min-height: 38px; padding: 0 14px;
  border-radius: 11px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 13px; font-weight: 700; letter-spacing: -0.01em;
  border: 1px solid transparent; transition: transform 120ms ease, background 120ms ease, border-color 120ms ease, opacity 120ms ease;
}
#${APP_ID} .ux-btn:active { transform: translateY(1px); }
#${APP_ID} .ux-btn:disabled { opacity: .42; cursor: not-allowed; }
#${APP_ID} .ux-btn-block { width: 100%; }
#${APP_ID} .ux-btn-primary { background: linear-gradient(145deg, #1d9bf0, #1478c8); color: #fff; box-shadow: 0 8px 24px rgba(29,155,240,.22); }
#${APP_ID} .ux-btn-primary:hover:not(:disabled) { background: linear-gradient(145deg, #31a8f7, #1684d8); }
#${APP_ID} .ux-btn-soft { background: rgba(255,255,255,.07); border-color: var(--ux-border); color: var(--ux-text); }
#${APP_ID} .ux-btn-soft:hover:not(:disabled) { background: rgba(255,255,255,.11); }
#${APP_ID} .ux-btn-danger { background: rgba(244,33,46,.10); border-color: rgba(244,33,46,.28); color: #ff7a82; }
#${APP_ID} .ux-btn-danger:hover:not(:disabled) { background: rgba(244,33,46,.17); }
#${APP_ID} .ux-btn-ghost { color: var(--ux-muted); }
#${APP_ID} .ux-btn-ghost:hover:not(:disabled) { color: var(--ux-text); background: rgba(255,255,255,.06); }
#${APP_ID} .ux-stack { display: grid; gap: 8px; margin-top: 12px; }
#${APP_ID} .ux-safety { display: flex; gap: 8px; align-items: flex-start; margin-top: 14px; padding: 10px 11px; border-radius: 12px; background: rgba(0,186,124,.07); border: 1px solid rgba(0,186,124,.18); color: #9ee6c8; font-size: 11px; line-height: 1.45; }
#${APP_ID} .ux-safety svg { width: 15px; height: 15px; flex: none; margin-top: 1px; }
#${APP_ID} .ux-scan-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
#${APP_ID} .ux-scan-top h2 { margin-top: 6px; }
#${APP_ID} .ux-source-badge { font-size: 10px; font-weight: 800; letter-spacing: .08em; color: var(--ux-muted); border: 1px solid var(--ux-border); border-radius: 8px; padding: 4px 7px; }
#${APP_ID} .ux-bar { height: 6px; border-radius: 99px; background: rgba(255,255,255,.08); overflow: hidden; }
#${APP_ID} .ux-bar i { display: block; height: 100%; width: 0%; border-radius: inherit; background: linear-gradient(90deg, var(--ux-accent), var(--ux-accent-2)); transition: width 300ms ease; }
#${APP_ID} .ux-bar.is-indeterminate i { width: 38% !important; animation: ux-indeterminate 1.15s ease-in-out infinite; }
@keyframes ux-indeterminate { 0% { transform: translateX(-110%); } 100% { transform: translateX(280%); } }
#${APP_ID} .ux-scan-meta { display: flex; justify-content: space-between; gap: 10px; margin-top: 8px; font-size: 11px; color: var(--ux-muted); }
#${APP_ID} .ux-hint { margin-top: 12px; font-size: 11.5px; line-height: 1.5; color: var(--ux-muted); }
#${APP_ID} .ux-live-list { display: grid; gap: 6px; margin-top: 12px; }
#${APP_ID} .ux-mini-row { display: flex; align-items: center; gap: 9px; padding: 7px 8px; border-radius: 11px; background: rgba(255,255,255,.035); border: 1px solid rgba(255,255,255,.05); }
#${APP_ID} .ux-mini-row .ux-avatar { width: 30px; height: 30px; font-size: 12px; }
#${APP_ID} .ux-mini-user { min-width: 0; display: flex; flex-direction: column; }
#${APP_ID} .ux-mini-user strong { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-mini-user span { font-size: 10.5px; color: var(--ux-muted); }
#${APP_ID} .ux-actions { display: flex; gap: 8px; margin-top: 14px; }
#${APP_ID} .ux-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-results-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; }
#${APP_ID} .ux-results-head h2 { font-size: 19px; }
#${APP_ID} .ux-results-head p { margin-top: 4px; font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-link { color: var(--ux-accent); font-size: 11.5px; font-weight: 700; padding: 4px 0; white-space: nowrap; }
#${APP_ID} .ux-link:hover { text-decoration: underline; }
#${APP_ID} .ux-warning { display: flex; gap: 8px; align-items: flex-start; margin-top: 12px; padding: 9px 10px; border-radius: 11px; color: #ffd9a3; background: rgba(255,158,11,.08); border: 1px solid rgba(255,158,11,.2); font-size: 11.5px; line-height: 1.45; }
#${APP_ID} .ux-warning svg { width: 15px; height: 15px; flex: none; margin-top: 1px; }
#${APP_ID} .ux-search { display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 0 10px; height: 38px; border: 1px solid var(--ux-border); border-radius: 11px; background: rgba(255,255,255,.04); }
#${APP_ID} .ux-search svg { width: 16px; height: 16px; color: var(--ux-muted); flex: none; }
#${APP_ID} .ux-search input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; font-size: 12.5px; }
#${APP_ID} .ux-search input::placeholder { color: var(--ux-faint); }
#${APP_ID} .ux-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
#${APP_ID} .ux-chip {
  height: 27px; padding: 0 9px; border-radius: 99px;
  border: 1px solid var(--ux-border); color: var(--ux-muted);
  font-size: 10.5px; font-weight: 700; letter-spacing: .01em;
  display: inline-flex; align-items: center; gap: 5px;
  transition: all 120ms ease;
}
#${APP_ID} .ux-chip:hover { border-color: var(--ux-border-strong); color: var(--ux-text); }
#${APP_ID} .ux-chip.is-on { background: rgba(29,155,240,.14); border-color: rgba(29,155,240,.4); color: #8fd3ff; }
#${APP_ID} .ux-chip .ux-chip-count { font-size: 9.5px; opacity: .75; }
#${APP_ID} .ux-list { display: grid; gap: 5px; margin-top: 10px; }
#${APP_ID} .ux-row {
  display: grid; grid-template-columns: 18px 38px minmax(0, 1fr) auto;
  align-items: center; gap: 9px;
  padding: 8px 7px; border-radius: 12px;
  border: 1px solid transparent;
  transition: background 120ms ease, border-color 120ms ease;
}
#${APP_ID} .ux-row:hover { background: rgba(255,255,255,.045); border-color: rgba(255,255,255,.06); }
#${APP_ID} .ux-row.is-hidden { opacity: .55; }
#${APP_ID} .ux-row input[type="checkbox"], #${APP_ID} .ux-check input[type="checkbox"] { width: 15px; height: 15px; accent-color: var(--ux-accent); cursor: pointer; }
#${APP_ID} .ux-check { display: inline-flex; align-items: center; gap: 7px; font-size: 11px; color: var(--ux-muted); cursor: pointer; }
#${APP_ID} .ux-avatar { width: 38px; height: 38px; border-radius: 50%; object-fit: cover; display: grid; place-items: center; flex: none; background: rgba(255,255,255,.08); }
#${APP_ID} .ux-avatar-fallback { font-size: 14px; font-weight: 800; color: #dcefff; background: linear-gradient(145deg, rgba(29,155,240,.7), rgba(120,86,255,.7)); }
#${APP_ID} .ux-user { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
#${APP_ID} .ux-user a { min-width: 0; }
#${APP_ID} .ux-user strong { display: block; font-size: 12.5px; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-user span { display: block; font-size: 11px; color: var(--ux-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
#${APP_ID} .ux-badges { display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; }
#${APP_ID} .ux-badge { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 700; border-radius: 5px; padding: 1px 4px; color: var(--ux-muted); background: rgba(255,255,255,.06); }
#${APP_ID} .ux-badge svg { width: 11px; height: 11px; }
#${APP_ID} .ux-badge-blue { color: #8fd3ff; background: rgba(29,155,240,.14); }
#${APP_ID} .ux-badge-warn { color: #ffd98a; background: rgba(255,212,0,.10); }
#${APP_ID} .ux-badge-muted { color: var(--ux-faint); }
#${APP_ID} .ux-row-actions { display: flex; align-items: center; gap: 1px; opacity: .55; transition: opacity 120ms ease; }
#${APP_ID} .ux-row:hover .ux-row-actions { opacity: 1; }
#${APP_ID} .ux-row-actions .ux-icon-btn { width: 27px; height: 27px; }
#${APP_ID} .ux-row-actions svg { width: 15px; height: 15px; }
#${APP_ID} .ux-empty { padding: 26px 14px; text-align: center; color: var(--ux-muted); font-size: 12px; line-height: 1.5; }
#${APP_ID} .ux-empty strong { display: block; color: var(--ux-text); font-size: 13px; margin-bottom: 4px; }
#${APP_ID} .ux-actionbar {
  position: sticky; bottom: 0; z-index: 2;
  display: flex; align-items: center; gap: 7px; flex-wrap: wrap;
  margin: 10px -16px -16px; padding: 10px 12px 12px;
  border-top: 1px solid var(--ux-border);
  background: linear-gradient(180deg, rgba(15,20,26,.82), rgba(15,20,26,.98));
  backdrop-filter: blur(14px);
}
#${APP_ID} .ux-actionbar .ux-spacer { flex: 1; }
#${APP_ID} .ux-actionbar .ux-btn { min-height: 34px; padding: 0 11px; font-size: 11.5px; }
#${APP_ID} .ux-actionbar .ux-link { padding: 0 2px; }
#${APP_ID} .ux-statline { display: flex; gap: 14px; margin: 12px 0 2px; }
#${APP_ID} .ux-stat { display: flex; flex-direction: column; gap: 1px; }
#${APP_ID} .ux-stat strong { font-size: 20px; letter-spacing: -0.03em; }
#${APP_ID} .ux-stat span { font-size: 10px; color: var(--ux-muted); text-transform: uppercase; letter-spacing: .08em; font-weight: 700; }
#${APP_ID} .ux-current { margin-top: 12px; font-size: 13px; font-weight: 700; }
#${APP_ID} .ux-current span { color: var(--ux-accent); }
#${APP_ID} .ux-next { margin-top: 3px; font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-log { display: grid; gap: 5px; margin-top: 12px; max-height: 160px; overflow: auto; }
#${APP_ID} .ux-log-row { display: flex; align-items: center; gap: 7px; font-size: 11px; padding: 6px 8px; border-radius: 9px; background: rgba(255,255,255,.035); }
#${APP_ID} .ux-log-row .ux-dot { width: 6px; height: 6px; border-radius: 99px; background: var(--ux-ok); flex: none; }
#${APP_ID} .ux-log-row.is-fail .ux-dot { background: var(--ux-danger); }
#${APP_ID} .ux-log-row span:last-child { margin-left: auto; color: var(--ux-muted); }
#${APP_ID} .ux-done { text-align: center; padding: 28px 18px; }
#${APP_ID} .ux-done-icon { width: 52px; height: 52px; border-radius: 50%; margin: 0 auto 12px; display: grid; place-items: center; color: var(--ux-ok); background: rgba(0,186,124,.12); border: 1px solid rgba(0,186,124,.24); }
#${APP_ID} .ux-done-icon svg { width: 26px; height: 26px; }
#${APP_ID} .ux-done p { color: var(--ux-muted); font-size: 12.5px; line-height: 1.55; margin-top: 6px; }
#${APP_ID} .ux-done .ux-actions { margin-top: 18px; }
#${APP_ID} .ux-error { text-align: center; padding: 24px 16px; }
#${APP_ID} .ux-error-icon { width: 46px; height: 46px; border-radius: 50%; margin: 0 auto 10px; display: grid; place-items: center; color: #ffd9a3; background: rgba(255,158,11,.10); border: 1px solid rgba(255,158,11,.22); }
#${APP_ID} .ux-error p { color: var(--ux-muted); font-size: 12px; line-height: 1.55; margin-top: 6px; }
#${APP_ID} .ux-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 7px 14px 8px; border-top: 1px solid rgba(255,255,255,.06); font-size: 9.5px; color: var(--ux-faint); letter-spacing: .03em; }
#${APP_ID} .ux-foot .ux-foot-dot { width: 5px; height: 5px; border-radius: 99px; background: var(--ux-ok); display: inline-block; margin-right: 4px; }
#${APP_ID} .ux-pill {
  display: inline-flex; align-items: center; gap: 8px;
  height: 42px; padding: 0 12px; border-radius: 99px;
  background: linear-gradient(145deg, rgba(23,30,38,.98), rgba(15,20,26,.98));
  border: 1px solid var(--ux-border-strong);
  box-shadow: 0 12px 34px rgba(0,0,0,.45);
  font-size: 12px; font-weight: 700; color: var(--ux-text);
  backdrop-filter: blur(14px);
  animation: ux-in 160ms ease-out;
}
#${APP_ID} .ux-pill:hover { border-color: rgba(29,155,240,.55); }
#${APP_ID} .ux-pill-dot { width: 8px; height: 8px; border-radius: 99px; background: var(--ux-accent); box-shadow: 0 0 0 4px rgba(29,155,240,.14); }
#${APP_ID} .ux-pill-dot.scanning { background: var(--ux-ok); box-shadow: 0 0 0 4px rgba(0,186,124,.14); animation: ux-pulse 1.2s infinite; }
#${APP_ID} .ux-pill-dot.unfollowing { background: var(--ux-warn); box-shadow: 0 0 0 4px rgba(255,212,0,.14); animation: ux-pulse 1.2s infinite; }
#${APP_ID} .ux-pill svg { width: 14px; height: 14px; color: var(--ux-muted); }
@keyframes ux-pulse { 50% { opacity: .45; } }
#${APP_ID} .ux-overlay {
  position: fixed; inset: 0; z-index: 2147483647;
  display: grid; place-items: center; padding: 20px;
  background: rgba(0,0,0,.62);
  backdrop-filter: blur(3px);
  animation: ux-fade 120ms ease-out;
}
@keyframes ux-fade { from { opacity: 0; } to { opacity: 1; } }
#${APP_ID} .ux-dialog {
  width: min(380px, 100%);
  max-height: calc(100vh - 40px); overflow: auto;
  background: linear-gradient(180deg, #171e26, #0f141a);
  border: 1px solid var(--ux-border-strong);
  border-radius: 18px; padding: 18px;
  box-shadow: 0 30px 90px rgba(0,0,0,.6);
  animation: ux-dialog-in 160ms ease-out;
}
@keyframes ux-dialog-in { from { opacity: 0; transform: translateY(8px) scale(.985); } to { opacity: 1; transform: none; } }
#${APP_ID} .ux-dialog h3 { margin: 0; font-size: 17px; letter-spacing: -0.02em; }
#${APP_ID} .ux-dialog > p { margin-top: 6px; color: var(--ux-muted); font-size: 12px; line-height: 1.55; }
#${APP_ID} .ux-dialog-content { margin-top: 12px; }
#${APP_ID} .ux-dialog-actions { display: flex; gap: 8px; margin-top: 16px; }
#${APP_ID} .ux-dialog-actions .ux-btn { flex: 1; }
#${APP_ID} .ux-settings { display: grid; gap: 12px; }
#${APP_ID} .ux-settings-group { display: grid; gap: 7px; }
#${APP_ID} .ux-settings-title { font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; color: var(--ux-muted); margin-bottom: 2px; }
#${APP_ID} .ux-field { display: grid; grid-template-columns: 1fr 84px; align-items: center; gap: 10px; font-size: 11.5px; color: var(--ux-muted); }
#${APP_ID} .ux-field input { height: 32px; width: 100%; border-radius: 8px; border: 1px solid var(--ux-border); background: rgba(255,255,255,.04); padding: 0 8px; font-size: 12px; outline: 0; }
#${APP_ID} .ux-field input:focus { border-color: rgba(29,155,240,.6); box-shadow: 0 0 0 3px rgba(29,155,240,.12); }
#${APP_ID} .ux-input { width: 100%; height: 36px; border-radius: 9px; border: 1px solid var(--ux-border); background: rgba(255,255,255,.04); padding: 0 10px; outline: 0; }
#${APP_ID} .ux-input:focus { border-color: rgba(29,155,240,.6); }
#${APP_ID} .ux-toast {
  position: fixed; left: 50%; bottom: 22px; transform: translateX(-50%);
  z-index: 2147483647; max-width: min(420px, calc(100vw - 28px));
  padding: 10px 14px; border-radius: 11px;
  background: rgba(23,30,38,.98); border: 1px solid var(--ux-border-strong);
  box-shadow: 0 14px 40px rgba(0,0,0,.45);
  font-size: 12px; color: var(--ux-text);
  animation: ux-toast-in 160ms ease-out;
}
@keyframes ux-toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
#${APP_ID} :focus-visible { outline: 2px solid var(--ux-accent); outline-offset: 2px; }
@media (max-width: 560px) {
  #${APP_ID} { top: 12px; left: 12px; right: 12px; }
  #${APP_ID} .ux-panel { width: auto; max-height: calc(100vh - 24px); }
  #${APP_ID} .ux-row { grid-template-columns: 18px 34px minmax(0, 1fr) auto; }
  #${APP_ID} .ux-avatar { width: 34px; height: 34px; }
}
@media (prefers-reduced-motion: reduce) {
  #${APP_ID} *, #${APP_ID} *::before, #${APP_ID} *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
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
  return `<section class="ux-view ux-results" data-view="results">
    <div class="ux-results-head">
      <div>
        <h2 data-result-count>${escapeHTML(countLabel(state, t))}</h2>
        <p>${escapeHTML(t("reviewHint"))}</p>
      </div>
      <button class="ux-link" data-action="rescan">${escapeHTML(
        t("rescan")
      )}</button>
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
    <p class="ux-hint">${escapeHTML(
      paused ? t("pausedHint") : t("liveHint")
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

function renderUnfollowView(state) {
  const t = makeT(state.language);
  const run = state.unfollow || {};
  const total = Number(run.total) || 0;
  const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
  const percent = total ? clamp((done / total) * 100, 0, 100) : 0;
  const paused = Boolean(state.paused);
  const log = (run.log || []).slice(-5).reverse();
  return `<section class="ux-view ux-unfollowing" data-view="unfollowing">
    <div class="ux-scan-top">
      <div>
        <span class="ux-eyebrow">${escapeHTML(
          paused ? t("paused") : t("unfollowing")
        )}</span>
        <h2>${escapeHTML(String(done))} / ${escapeHTML(String(total))}</h2>
      </div>
      <span class="ux-source-badge">${escapeHTML(
        String(run.transport || "mutation").toUpperCase()
      )}</span>
    </div>
    <div class="ux-bar"><i data-unfollow-progress style="width:${percent}%"></i></div>
    <div class="ux-current">${escapeHTML(
      t("currently", { handle: run.current || "—" })
    )}</div>
    <div class="ux-next" data-next>${escapeHTML(countdownText(state))}</div>
    <div class="ux-statline">
      <div class="ux-stat"><strong>${Number(run.ok) || 0}</strong><span>ok</span></div>
      <div class="ux-stat"><strong>${Number(run.fail) || 0}</strong><span>fail</span></div>
      <div class="ux-stat"><strong>${Math.max(0, total - done)}</strong><span>left</span></div>
    </div>
    <div class="ux-log" data-unfollow-log>${
      log.length
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
        : `<div class="ux-empty">${escapeHTML(t("unfollowHint"))}</div>`
    }</div>
    <p class="ux-hint">${escapeHTML(
      paused ? t("unfollowPausedHint") : t("unfollowHint")
    )}</p>
    <div class="ux-actions">
      <button class="ux-btn ux-btn-soft" data-action="${
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
    <span>${escapeHTML(pillLabel(state))}</span>
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

export function toast(message) {
  if (!message || typeof document === "undefined") return;
  const host = document.getElementById(APP_ID) || document.body;
  host.querySelectorAll(".ux-toast").forEach((node) => node.remove());
  const element = document.createElement("div");
  element.className = "ux-toast";
  element.setAttribute("role", "status");
  element.textContent = message;
  host.appendChild(element);
  setTimeout(() => element.remove(), 3500);
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
    const list = root.querySelector("[data-live-list]");
    if (list) {
      const users = getDisplayUsers(state).slice(0, 6);
      list.innerHTML = users.length
        ? users.map((user) => renderMiniRow(user, state)).join("")
        : `<div class="ux-empty">${escapeHTML(t()("liveEmpty"))}</div>`;
    }
  };

  const updateUnfollowing = () => {
    const run = state.unfollow || {};
    const done = (Number(run.ok) || 0) + (Number(run.fail) || 0);
    const total = Number(run.total) || 0;
    const bar = root.querySelector("[data-unfollow-progress]");
    if (bar) bar.style.width = `${total ? clamp((done / total) * 100, 0, 100) : 0}%`;
    const current = root.querySelector(".ux-current");
    if (current) {
      current.textContent = t()("currently", { handle: run.current || "—" });
    }
    const next = root.querySelector("[data-next]");
    if (next) next.textContent = countdownText(state);
  };

  const update = () => {
    if (!root.isConnected) return;
    if (state.minimized) {
      root.innerHTML = renderPill(state);
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
      root.remove();
      document.getElementById(STYLE_ID)?.remove();
    },
  };
}
