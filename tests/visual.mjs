import { createServer } from "vite";
import fs from "node:fs";
import { chromium, launchOptions } from "./browser-support.mjs";
const server = await createServer({
  server: { host: "127.0.0.1", port: 8080 },
});
await server.listen();
const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({
  viewport: { width: 390, height: 700 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:8080");
await page
  .getByRole("button", { name: "Settings", exact: true })
  .waitFor({ timeout: 20000 });
await page.waitForTimeout(1500);
fs.mkdirSync("test-results", { recursive: true });
await page.screenshot({ path: "test-results/home.png" });
console.log("ERRORS", errors);
console.log((await page.locator("body").innerText()).slice(0, 1800));
await page.getByRole("button", { name: /OPEN ORIGIN BOOSTER/ }).click();
await page.getByRole("button", { name: /or tap to rip/ }).click();
await page.getByRole("button", { name: "Reveal all", exact: true }).click();
await page.locator(".summary-card").first().click();
await page.waitForTimeout(500);
await page.screenshot({ path: "test-results/inspector-stable.png" });
await browser.close();
await server.close();
