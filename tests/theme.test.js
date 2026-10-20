import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import {
  applyXAppearance,
  observeXAppearance,
  parseLuminance,
  readXAppearance,
} from "../src/theme.js";

function stubMedia(win, { dark = false, light = false, reduce = false } = {}) {
  Object.defineProperty(win, "matchMedia", {
    configurable: true,
    value: (query) => ({
      matches: query.includes("prefers-color-scheme: dark")
        ? dark
        : query.includes("prefers-color-scheme: light")
          ? light
          : query.includes("prefers-reduced-motion")
            ? reduce
            : false,
      addEventListener() {},
      removeEventListener() {},
    }),
  });
}

test("X data-theme wins over the system preference", () => {
  const dom = new JSDOM('<!doctype html><html data-theme="light"></html>');
  stubMedia(dom.window, { dark: true });
  assert.equal(
    readXAppearance(dom.window.document, dom.window).theme,
    "light"
  );
  dom.window.close();
});

test("falls back to prefers-color-scheme when X has no data-theme", () => {
  const dom = new JSDOM("<!doctype html><html></html>");
  stubMedia(dom.window, { dark: true });
  assert.equal(readXAppearance(dom.window.document, dom.window).theme, "dark");
  dom.window.close();
});

test("falls back to background luminance when media queries are absent", () => {
  const dom = new JSDOM("<!doctype html><html><body></body></html>");
  stubMedia(dom.window, {});
  Object.defineProperty(dom.window, "getComputedStyle", {
    configurable: true,
    value: () => ({ backgroundColor: "rgb(255, 255, 255)" }),
  });
  assert.equal(readXAppearance(dom.window.document, dom.window).theme, "light");
  dom.window.close();
});

test("reads high-contrast and reduced-motion flags", () => {
  const dom = new JSDOM(
    '<!doctype html><html data-theme="dark" data-high-contrast="true" data-reduce-motion="true"></html>'
  );
  assert.deepEqual(readXAppearance(dom.window.document, dom.window), {
    theme: "dark",
    highContrast: true,
    reduceMotion: true,
  });
  dom.window.close();
});

test("applies appearance to a root dataset", () => {
  const root = { dataset: {} };
  applyXAppearance(root, {
    theme: "light",
    highContrast: true,
    reduceMotion: false,
  });
  assert.equal(root.dataset.theme, "light");
  assert.equal(root.dataset.highContrast, "true");
  assert.equal(root.dataset.reduceMotion, "false");
});

test("parses rgb/rgba luminance and rejects invalid colors", () => {
  assert.equal(parseLuminance("rgb(0, 0, 0)"), 0);
  assert.ok(Math.abs(parseLuminance("rgb(255, 255, 255)") - 1) < 1e-9);
  assert.equal(parseLuminance("rgba(0, 0, 0, 0.5)"), 0);
  assert.equal(parseLuminance("not-a-color"), null);
});

test("observer applies attribute changes and stops cleanly", async () => {
  const dom = new JSDOM('<!doctype html><html data-theme="dark"></html>');
  stubMedia(dom.window, {});
  const root = { dataset: {} };
  const handle = observeXAppearance(root, {
    document: dom.window.document,
    window: dom.window,
  });

  assert.equal(root.dataset.theme, "dark");
  dom.window.document.documentElement.setAttribute("data-theme", "light");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(root.dataset.theme, "light");

  handle.stop();
  dom.window.document.documentElement.setAttribute("data-theme", "dark");
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(root.dataset.theme, "light", "stopped observer must not update");
  dom.window.close();
});
