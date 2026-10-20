const THEME_ATTR = "data-theme";
const HIGH_CONTRAST_ATTR = "data-high-contrast";
const REDUCE_MOTION_ATTR = "data-reduce-motion";

export function parseTheme(value) {
  return value === "light" || value === "dark" ? value : null;
}

export function parseLuminance(value) {
  const match = String(value || "").match(/rgba?\(([^)]+)\)/i);
  if (!match) return null;
  const parts = match[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) {
    return null;
  }
  const [r, g, b] = parts.slice(0, 3).map((channel) => {
    const v = channel / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function mediaMatches(win, query) {
  try {
    return Boolean(win?.matchMedia?.(query)?.matches);
  } catch {
    return false;
  }
}

export function detectTheme(doc = globalThis.document, win = doc?.defaultView) {
  const declared = parseTheme(doc?.documentElement?.getAttribute(THEME_ATTR));
  if (declared) return declared;

  if (mediaMatches(win, "(prefers-color-scheme: dark)")) return "dark";
  if (mediaMatches(win, "(prefers-color-scheme: light)")) return "light";

  const background = win?.getComputedStyle?.(
    doc?.body || doc?.documentElement
  )?.backgroundColor;
  const luminance = parseLuminance(background);
  if (luminance !== null) return luminance < 0.5 ? "dark" : "light";
  return "dark";
}

export function readXAppearance(
  doc = globalThis.document,
  win = doc?.defaultView
) {
  const html = doc?.documentElement;
  return {
    theme: detectTheme(doc, win),
    highContrast: html?.getAttribute(HIGH_CONTRAST_ATTR) === "true",
    reduceMotion:
      html?.getAttribute(REDUCE_MOTION_ATTR) === "true" ||
      mediaMatches(win, "(prefers-reduced-motion: reduce)"),
  };
}

export function applyXAppearance(root, appearance) {
  if (!root?.dataset) return;
  root.dataset.theme = appearance?.theme === "light" ? "light" : "dark";
  root.dataset.highContrast = appearance?.highContrast ? "true" : "false";
  root.dataset.reduceMotion = appearance?.reduceMotion ? "true" : "false";
}

export function observeXAppearance(
  root,
  { document: doc = globalThis.document, window: win = doc?.defaultView } = {}
) {
  const sync = () => applyXAppearance(root, readXAppearance(doc, win));
  sync();

  const Observer = doc?.defaultView?.MutationObserver;
  const observer =
    typeof Observer === "function" ? new Observer(sync) : null;
  observer?.observe(doc.documentElement, {
    attributes: true,
    attributeFilter: [THEME_ATTR, HIGH_CONTRAST_ATTR, REDUCE_MOTION_ATTR],
  });

  const queries = [
    "(prefers-color-scheme: dark)",
    "(prefers-color-scheme: light)",
    "(prefers-reduced-motion: reduce)",
  ];
  const media = queries
    .map((query) => {
      try {
        return { mql: win?.matchMedia?.(query) };
      } catch {
        return { mql: null };
      }
    })
    .filter((item) => item.mql);
  const onChange = () => sync();

  for (const { mql } of media) {
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
    } else if (typeof mql.addListener === "function") {
      mql.addListener(onChange);
    }
  }

  return {
    sync,
    stop() {
      observer?.disconnect();
      for (const { mql } of media) {
        if (typeof mql.removeEventListener === "function") {
          mql.removeEventListener("change", onChange);
        } else if (typeof mql.removeListener === "function") {
          mql.removeListener(onChange);
        }
      }
    },
  };
}
