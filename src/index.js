import {
  boot,
  mergeScan,
  canUnfollow,
  coverageFrom,
} from "./main.js";

const HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);

if (typeof globalThis.__UX_TEST__ === "function") {
  globalThis.__UX_TEST__({ boot, mergeScan, canUnfollow, coverageFrom });
} else if (!HOSTS.has(location.hostname)) {
  alert("Open https://x.com first, then paste this script again.");
} else {
  boot();
}
