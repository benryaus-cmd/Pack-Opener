import { createServer } from "vite";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, launchOptions } from "./browser-support.mjs";
const app = await createServer({ server: { host: "127.0.0.1", port: 8080 } });
await app.listen();
const browser = await chromium.launch(launchOptions);
fs.mkdirSync("test-results", { recursive: true });
const errors = [],
  results = [];
async function ready(page) {
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:8080");
  await page
    .getByRole("button", { name: "Settings", exact: true })
    .waitFor({ timeout: 20000 });
}
async function state(page) {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("packverse-v1", 1);
        r.onsuccess = () => {
          const get = r.result
            .transaction("saves")
            .objectStore("saves")
            .get(localStorage.getItem("packverse-browser-id"));
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
  );
}
try {
  for (const [w, h] of [
    [280, 470],
    [320, 530],
    [360, 600],
    [375, 667],
    [390, 700],
    [430, 800],
    [768, 1024],
  ]) {
    const context = await browser.newContext({
        viewport: { width: w, height: h },
        reducedMotion: "reduce",
      }),
      page = await context.newPage();
    await ready(page);
    assert.equal(await page.locator(".coin-balance").innerText(), "500");
    for (const name of ["HOME", "SHOP", "RIP", "CARDS", "SOCIAL"]) {
      await page
        .getByRole("navigation")
        .getByRole("button", { name, exact: true })
        .click();
      assert(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `Overflow ${w}`,
      );
    }
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "HOME", exact: true })
      .click();
    await page.getByRole("button", { name: /OPEN ORIGIN BOOSTER/ }).click();
    await page.getByRole("button", { name: /or tap to rip/ }).click();
    await page
      .getByRole("button", { name: "REVEAL CARD", exact: true })
      .click();
    await page
      .getByRole("button", { name: "NEXT CARD", exact: true })
      .waitFor();
    assert.equal((await state(page)).coins, 400);
    assert.equal((await state(page)).owned.length, 5);
    const card = await page.locator(".revealed-card").boundingBox(),
      next = await page
        .getByRole("button", { name: "NEXT CARD", exact: true })
        .boundingBox();
    assert(card.y >= 0 && card.y + card.height <= h, `Card clipped ${w}`);
    assert(next.y + next.height <= h, `Next clipped ${w}`);
    await page.screenshot({ path: `test-results/reveal-${w}.png` });
    await page.reload();
    await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
    await page.getByRole("button", { name: /YOUR PACK IS WAITING/ }).click();
    assert.equal((await state(page)).coins, 400);
    await page.getByRole("button", { name: "Reveal all", exact: true }).click();
    await page.getByRole("button", { name: /BACK TO THE UNIVERSE/ }).click();
    assert.equal((await state(page)).pending, null);
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "CARDS", exact: true })
      .click();
    await page.getByRole("button", { name: /KANTO.*Base Set/ }).click();
    await page
      .getByRole("combobox", { name: "Card ownership filter" })
      .selectOption("owned");
    const owned = page.locator(".binder-slot.owned");
    assert((await owned.count()) >= 1);
    await owned.first().click();
    await page.getByRole("dialog", { name: "A closer look" }).waitFor();
    const close = await page
      .getByRole("button", { name: "Close dialog" })
      .boundingBox();
    assert(close.y >= 0 && close.y + close.height <= h);
    await page.screenshot({ path: `test-results/inspector-${w}.png` });
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "HOME", exact: true })
      .click();
    await page.getByRole("button", { name: /DAILY GIFT/ }).click();
    assert.equal((await state(page)).coins, 500);
    await page.getByRole("button", { name: /COLLECTOR MISSIONS/ }).click();
    const mission = page
      .locator(".mission-row")
      .filter({ hasText: "Crack the seal" });
    await mission.getByRole("button").click();
    assert.equal((await state(page)).coins, 530);
    assert(await mission.getByRole("button").isDisabled());
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.getByRole("button", { name: /OPEN ORIGIN BOOSTER/ }).click();
    const rip = page.getByRole("slider", { name: "Rip the booster" });
    await rip.waitFor();
    const r = await rip.boundingBox();
    await page.mouse.move(r.x + 5, r.y + 20);
    await page.mouse.down();
    await page.mouse.move(r.x + r.width - 5, r.y + 25, { steps: 10 });
    await page.mouse.up();
    await page
      .getByRole("button", { name: "REVEAL CARD", exact: true })
      .waitFor();
    assert.equal((await state(page)).owned.length, 10);
    await page.getByRole("button", { name: "Reveal all", exact: true }).click();
    await page.getByRole("button", { name: /BACK TO THE UNIVERSE/ }).click();
    await page.screenshot({ path: `test-results/home-${w}.png` });
    results.push(
      `${w}x${h}: navigation, purchase, tap/drag rip, reveal, reload, binder, inspector, daily/mission rewards passed`,
    );
    await context.close();
  }
  const ctx = await browser.newContext({
      viewport: { width: 390, height: 700 },
    }),
    p1 = await ctx.newPage();
  await ready(p1);
  const p2 = await ctx.newPage();
  await ready(p2);
  await Promise.all([
    p1.getByRole("button", { name: /OPEN ORIGIN BOOSTER/ }).click(),
    p2.getByRole("button", { name: /OPEN ORIGIN BOOSTER/ }).click(),
  ]);
  await p1.waitForTimeout(400);
  assert.equal((await state(p1)).owned.length, 5);
  assert.equal((await state(p2)).coins, 400);
  results.push("Concurrent tabs: one pack, one debit");
  await ctx.close();

  for (const productId of ["collector", "premium", "bundle", "daily"]) {
    const context = await browser.newContext({
        viewport: { width: 320, height: 530 },
        reducedMotion: "reduce",
      }),
      page = await context.newPage();
    await ready(page);
    await page.evaluate(
      () =>
        new Promise((resolve) => {
          const r = indexedDB.open("packverse-v1", 1);
          r.onsuccess = () => {
            const tx = r.result.transaction("saves", "readwrite"),
              store = tx.objectStore("saves"),
              key = localStorage.getItem("packverse-browser-id");
            const get = store.get(key);
            get.onsuccess = () => {
              const s = get.result || {
                version: 1,
                revision: 0,
                coins: 500,
                xp: 0,
                owned: [],
                pending: null,
                queued: [],
                lastFreePack: "",
                ledger: [],
                purchaseIds: [],
                claims: [],
                favourites: [],
                showcase: [],
                friends: [],
                daily: {
                  day: new Date().toISOString().slice(0, 10),
                  packs: 0,
                  newCards: 0,
                  inspections: 0,
                },
                weekly: { week: "", packs: 0 },
                stats: {
                  packs: 0,
                  inspections: 0,
                  newCards: 0,
                  bestTier: 0,
                  studyWins: 0,
                },
                lastClaim: "",
                streak: 0,
                study: { day: "", count: 0, last: 0 },
              };
              s.coins = 2000;
              store.put(s, key);
            };
            tx.oncomplete = () => resolve(null);
          };
        }),
    );
    await page.reload();
    await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
    await page
      .getByRole("navigation")
      .getByRole("button", { name: "SHOP", exact: true })
      .click();
    await page
      .getByRole("combobox", { name: "Pack product" })
      .selectOption(productId);
    await page
      .locator(".shop-product")
      .first()
      .getByRole("button", { name: /OPEN (PACK|BUNDLE)/ })
      .click();
    const expected = { collector: 7, premium: 10, bundle: 15, daily: 5 }[
      productId
    ];
    assert.equal((await state(page)).owned.length, expected);
    const packs = productId === "bundle" ? 3 : 1;
    for (let i = 0; i < packs; i++) {
      await page.getByRole("button", { name: /or tap to rip/ }).click();
      await page
        .getByRole("button", { name: "Reveal all", exact: true })
        .click();
      if (productId === "bundle" && i === 1) {
        await page.reload();
        await page
          .getByRole("button", { name: "Settings", exact: true })
          .waitFor();
        await page
          .getByRole("button", { name: /YOUR PACK IS WAITING/ })
          .click();
      }
      await page
        .getByRole("button", {
          name: i < packs - 1 ? "NEXT BUNDLE PACK" : /BACK TO THE UNIVERSE/,
        })
        .click();
    }
    assert.equal((await state(page)).pending, null);
    assert.equal((await state(page)).queued.length, 0);
    assert.equal((await state(page)).owned.length, expected);
    results.push(
      `${productId}: correct count, committed purchase, complete reveal recovery`,
    );
    await context.close();
  }
  assert.deepEqual(errors, []);
  console.log(results.join("\n"));
  fs.writeFileSync(
    "test-results/browser-report.json",
    JSON.stringify({ results, errors }, null, 2),
  );
} finally {
  await browser.close();
  await app.close();
}
