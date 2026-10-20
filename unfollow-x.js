/* Unfollow X — paste into the console on x.com. See README.md. */
(() => {
  // src/main.js
  function boot() {
    console.log("[ux] boot stub");
  }

  // src/index.js
  var HOSTS = /* @__PURE__ */ new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com"]);
  if (!HOSTS.has(location.hostname)) {
    alert("Open https://x.com first, then paste this script again.");
  } else {
    boot();
  }
})();
