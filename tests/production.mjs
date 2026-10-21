import { preview } from "vite";
import assert from "node:assert/strict";
import { chromium, launchOptions } from "./browser-support.mjs";
const server = await preview({ preview: { host: "127.0.0.1", port: 8080 } });
const browser = await chromium.launch(launchOptions);
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 320, height: 530 },
    reducedMotion: "reduce",
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8080");
  await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
  assert.equal(await page.locator(".coin-balance").innerText(), "500");
  await page.getByRole("button", { name: /OPEN ORIGIN BOOSTER/ }).click();
  await page.getByRole("button", { name: /or tap to rip/ }).click();
  await page.getByRole("button", { name: "REVEAL CARD", exact: true }).click();
  await page.getByRole("button", { name: "NEXT CARD", exact: true }).waitFor();
  await page.reload();
  await page.getByRole("button", { name: /YOUR PACK IS WAITING/ }).click();
  await page.getByRole("button", { name: "Reveal all", exact: true }).click();
  await page.getByRole("button", { name: /BACK TO THE UNIVERSE/ }).click();
  assert.equal(await page.locator(".coin-balance").innerText(), "400");
  assert.deepEqual(errors, []);
  console.log(
    "PASS: production bundle, SDK identity fallback, embedded assets, purchase/reveal/reload recovery at 320x530",
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
