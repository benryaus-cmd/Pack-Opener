import { createServer } from "vite";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, launchOptions } from "./browser-support.mjs";
const app = await createServer({ server: { host: "127.0.0.1", port: 8082 } });
await app.listen();
const browser = await chromium.launch(launchOptions);
const errors = [];
try {
  for (const [width, height] of [
    [280, 530],
    [390, 700],
  ]) {
    const context = await browser.newContext({ viewport: { width, height } });
    await context.route("https://**/*", async (route) => {
      const url = route.request().url();
      if (url.includes("api.tcgdex.net"))
        return route.fulfill({
          json: {
            pricing: { tcgplayer: { holofoil: { marketPrice: 123.45 } } },
          },
        });
      if (
        url.includes("assets.tcgdex.net") ||
        url.includes("images.pokemontcg.io")
      )
        return route.fulfill({
          contentType: "image/webp",
          body: fs.readFileSync("public/cards/base1-4.webp"),
        });
      return route.abort();
    });
    await context.addInitScript(() => {
      Math.random = () => 0;
      window.DeviceOrientationEvent = class extends Event {
        constructor(type, init) {
          super(type);
          Object.assign(this, init);
        }
      };
    });
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:8082");
    await page.getByRole("button", { name: "Dismiss welcome" }).click();
    assert.equal(await page.locator(".home-hero").count(), 0);
    await page.getByRole("button", { name: /EARN COINS/ }).click();
    await page.getByRole("button", { name: /Collector’s Eye/ }).click();
    assert.equal(await page.locator(".study-grid button").count(), 12);
    const cols = await page
      .locator(".study-grid")
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    assert.equal(cols, 4);
    // Same two different cards are intentionally mismatched three times.
    const buttons = page.locator(".study-grid button");
    let pair;
    for (let j = 1; j < 12; j++) {
      await buttons.nth(0).click();
      await buttons.nth(j).click();
      const names = await page
        .locator('.study-grid img:not([alt="Pokémon trading card back"])')
        .evaluateAll((imgs) => imgs.map((i) => i.alt));
      await page.waitForTimeout(720);
      if (names.length >= 2 && names[0] !== names[1]) {
        pair = [0, j];
        break;
      }
    }
    assert(pair);
    for (let i = 0; i < 2; i++) {
      await buttons.nth(pair[0]).click();
      await buttons.nth(pair[1]).click();
      await page.waitForTimeout(720);
    }
    await page.getByText("Out of lives. Try again.").waitFor();
    assert.equal(await buttons.locator(":scope:disabled").count(), 12);
    assert.equal(await page.locator(".coin-balance").innerText(), "500");
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "CARDS", exact: true })
      .click();
    await page.locator(".binder-set").first().click();
    const binderCols = await page
      .locator(".binder-grid")
      .first()
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(" ").length,
      );
    assert.equal(binderCols, 4);
    await page.locator(".binder-slot").first().click();
    await page.evaluate(() =>
      window.dispatchEvent(
        new DeviceOrientationEvent("deviceorientation", {
          gamma: 20,
          beta: 60,
        }),
      ),
    );
    const tilt = await page
      .locator(".inspect-art .card-view")
      .evaluate((el) => [
        el.style.getPropertyValue("--ry"),
        el.style.getPropertyValue("--mx"),
      ]);
    assert.equal(tilt[0], "24deg");
    assert.equal(tilt[1], "86%");
    await page.screenshot({ path: `test-results/qol-${width}.png` });
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    "PASS: 280/390 phone layout, persistent splash dismissal, direct arcade, 4x3 study and three-life loss, four-column binder, default sensor tilt with glare.",
  );
} finally {
  await browser.close();
  await app.close();
}
