import { defineConfig } from "commandkit";

export default defineConfig({
  src: "src",
  main: "index.js",
  outDir: "dist",
  watch: false,
  sourcemap: false,
  antiCrash: true,
  envExtra: true,
  minify: true,
  clearRestartLogs: false,
});
