import { build } from "esbuild";

await build({
  entryPoints: ["src/index.js"],
  bundle: true,
  format: "iife",
  target: ["es2020"],
  outfile: "unfollow-x.js",
  legalComments: "none",
  banner: {
    js: "/* Unfollow X — paste into the console on x.com. See README.md. */",
  },
});
console.log("built unfollow-x.js");
