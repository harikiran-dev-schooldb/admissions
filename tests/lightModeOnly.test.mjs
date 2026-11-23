import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const read = (path) => readFileSync(path, "utf8");

test("all app routes, including the installed PWA, declare light-only appearance", () => {
  const layout = read("app/layout.tsx");
  const css = read("app/globals.css");
  assert.match(layout, /export const viewport: Viewport = \{ colorScheme: "light" \}/);
  assert.match(css, /:root\s*\{[^}]*color-scheme:\s*light;/s);
  assert.match(css, /--background:\s*oklch\(0\.975/);
});

test("UI components do not switch themes or react to system dark mode", () => {
  function visit(dir) {
    for (const item of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, item.name);
      if (item.isDirectory()) visit(path);
      else if (/\.(css|tsx|ts)$/.test(item.name)) {
        const source = read(path);
        assert.doesNotMatch(source, /\bdark:/, path);
        assert.doesNotMatch(source, /prefers-color-scheme\s*:\s*dark/i, path);
        assert.doesNotMatch(source, /\b(?:setTheme|toggleTheme|ThemeProvider)\b/, path);
      }
    }
  }
  visit("app");
  visit("components");
  visit("hooks");
});
