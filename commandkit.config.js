import { defineConfig } from "commandkit";

export default defineConfig({
  src: "src",
  main: "index.js",
  outDir: "dist",
  watch: true,
  sourcemap: true,
  antiCrash: true,
  envExtra: true,
});
