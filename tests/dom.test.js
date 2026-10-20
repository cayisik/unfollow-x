import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";
import {
  collectVisibleUsers,
  parseUserRow,
  isProfileHref,
  findRowByHandle,
  findUnfollowButton,
  findConfirmButton,
  clickUnfollow,
  scanDom,
} from "../src/dom.js";

function doc() {
  const html = readFileSync(
    new URL("./fixtures/following.html", import.meta.url),
    "utf8"
  );
  return new JSDOM(html).window.document;
}

test("recognizes profile hrefs", () => {
  assert.equal(isProfileHref("/alice"), true);
  assert.equal(isProfileHref("https://x.com/alice"), true);
  assert.equal(isProfileHref("/alice/status/1"), false);
  assert.equal(isProfileHref("/home"), false);
  assert.equal(isProfileHref("/i/flow/login"), false);
});

test("parses EN and TR rows without test ids", () => {
  const d = doc();
  const rows = d.querySelectorAll(".row");
  assert.equal(parseUserRow(rows[0]).followsViewer, true);
  assert.equal(parseUserRow(rows[1]).followsViewer, false);
  assert.equal(parseUserRow(rows[2]).followsViewer, true);
  assert.equal(parseUserRow(rows[1]).handle, "bob");
  assert.equal(parseUserRow(rows[0]).name, "Alice");
});

test("collects unique visible users", () => {
  const d = doc();
  const users = collectVisibleUsers(d);
  assert.equal(users.length, 3);
  assert.deepEqual(
    users.map((u) => u.handle).sort(),
    ["alice", "ayse", "bob"]
  );
});

test("finds a row by handle", () => {
  const d = doc();
  assert.ok(findRowByHandle(d, "bob"));
  assert.equal(findRowByHandle(d, "nope"), null);
});

test("finds the unfollow and confirm buttons", () => {
  const d = doc();
  const row = findRowByHandle(d, "bob");
  assert.ok(findUnfollowButton(row));
  const dom = new JSDOM('<div id="root"></div>');
  const root = dom.window.document.getElementById("root");
  root.innerHTML =
    '<div role="dialog"><button data-testid="confirmationSheetConfirm">Unfollow</button></div>';
  assert.ok(findConfirmButton(root));
});

test("DOM scan stops after idle rounds and reports coverage", async () => {
  const d = doc();
  const pages = [];
  const result = await scanDom({
    root: d,
    win: { scrollBy() {}, innerHeight: 100, scrollY: 0 },
    sleepFn: async () => {},
    maxRounds: 2,
    stepMs: 0,
    onPage: (page) => pages.push(page),
  });
  assert.equal(result.users.length, 3);
  assert.equal(result.unverified, false);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].source, "dom");
});

test("UI unfollow clicks follow then confirm", async () => {
  const dom = new JSDOM(
    `<div id="root">
      <div class="row" id="row">
        <a href="/bob"><img src="https://p/b.jpg"></a>
        <a href="/bob"><span>Bob</span><span>@bob</span></a>
        <button id="action">Following</button>
      </div>
    </div>`
  );
  const d = dom.window.document;
  const row = d.getElementById("row");
  d.getElementById("action").addEventListener("click", () => {
    const dialog = d.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.innerHTML =
      '<button data-testid="confirmationSheetConfirm">Unfollow</button>';
    d.body.appendChild(dialog);
    dialog.querySelector("button").addEventListener("click", () => {
      dialog.remove();
      row.querySelector("#action").textContent = "Follow";
    });
  });
  const result = await clickUnfollow(row, d, { sleepFn: async () => {} });
  assert.equal(result.ok, true);
  assert.equal(row.querySelector("#action").textContent, "Follow");
});
