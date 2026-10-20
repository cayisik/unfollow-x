import { boot } from "./main.js";

const HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);

if (!HOSTS.has(location.hostname)) {
  alert("Open https://x.com first, then paste this script again.");
} else {
  boot();
}
