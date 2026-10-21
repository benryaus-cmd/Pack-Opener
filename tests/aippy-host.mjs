import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { chromium, launchOptions } from "./browser-support.mjs";
const root = path.resolve(
  process.env.AIPPY_HOST_DIR || "../aippy-reference",
  "dist",
);
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split("?")[0]);
  const p = path.resolve(root, "." + (rel === "/" ? "/index.html" : rel));
  if (!p.startsWith(root + "/") || !fs.existsSync(p)) {
    res.writeHead(404).end();
    return;
  }
  res.setHeader(
    "Content-Type",
    p.endsWith(".html")
      ? "text/html"
      : p.endsWith(".woff2")
        ? "font/woff2"
        : p.endsWith(".webp")
          ? "image/webp"
          : "application/octet-stream",
  );
  res.end(fs.readFileSync(p));
});
await new Promise((r) => server.listen(8084, "127.0.0.1", r));
const browser = await chromium.launch(launchOptions);
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 700 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://**/*", (r) => r.abort());
  await page.goto("http://127.0.0.1:8084");
  await page
    .getByRole("button", { name: "Settings", exact: true })
    .waitFor({ timeout: 15000 });
  assert.equal(await page.locator(".host-recovery-access").count(), 0);
  assert.equal(
    await page.locator("#packverse-game-root .game-root").count(),
    1,
  );
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "temp save", exact: true }).click();
  await page.getByLabel("temp save code", { exact: true }).fill("0000");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await page.getByText("Incorrect code. Try again.").waitFor();
  assert.equal(await page.locator(".file-viewer").count(), 0);
  await page.getByLabel("temp save code", { exact: true }).fill("1234");
  await page.getByRole("button", { name: "Unlock", exact: true }).click();
  await page.getByPlaceholder("Search project files").waitFor();
  await page.screenshot({ path: "test-results/aippy-temp-save.png" });
  assert.deepEqual(errors, []);
  console.log(
    "PASS: actual Aippy host production bundle loads one game root, floating viewer button removed; Settings temp save rejects wrong code and opens file viewer with 1234.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
