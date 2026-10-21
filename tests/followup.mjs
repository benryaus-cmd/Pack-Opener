import { createServer } from "vite";
import assert from "node:assert/strict";
import fs from "node:fs";
import { chromium, launchOptions } from "./browser-support.mjs";
const app = await createServer({ server: { host: "127.0.0.1", port: 8080 } });
await app.listen();
const browser = await chromium.launch(launchOptions);
const errors = [];
fs.mkdirSync("test-results", { recursive: true });
async function read(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const r = indexedDB.open("packverse-v1", 1);
        r.onsuccess = () => {
          const get = r.result
            .transaction("saves")
            .objectStore("saves")
            .get(localStorage.getItem("packverse-browser-id"));
          get.onsuccess = () => resolve(get.result);
        };
      }),
  );
}
async function ready(page) {
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("https://**/*", (r) => r.abort());
  await page.goto("http://127.0.0.1:8080");
  await page.getByRole("button", { name: "Settings", exact: true }).waitFor();
}
try {
  for (const [w, h] of [
    [280, 470],
    [320, 530],
    [390, 700],
  ]) {
    const ctx = await browser.newContext({
        viewport: { width: w, height: h },
        reducedMotion: "reduce",
      }),
      page = await ctx.newPage();
    await ready(page);
    await page.getByRole("button", { name: /OPEN ORIGIN BOOSTER/ }).click();
    await page.getByRole("button", { name: "Save and leave opening" }).click();
    await page.waitForTimeout(250);
    assert.equal(
      await page
        .getByRole("navigation")
        .getByRole("button", { name: "HOME", exact: true })
        .getAttribute("aria-current"),
      "page",
    );
    assert.equal(
      await page.locator(".home-hero").count(),
      1,
      "Leaving an opening returns to a real home screen",
    );
    await page.getByRole("button", { name: /YOUR PACK IS WAITING/ }).click();
    await page.getByRole("button", { name: /or tap to rip/ }).click();
    await page.getByRole("button", { name: "Reveal all", exact: true }).click();
    for (const name of [
      /OPEN ANOTHER/,
      /VIEW CARDS/,
      /SHARE PULL/,
      /BACK TO THE UNIVERSE/,
    ]) {
      const box = await page.getByRole("button", { name }).boundingBox();
      assert(
        box && box.y >= 0 && box.y + box.height <= h,
        `Summary action clipped ${name} at ${w}`,
      );
    }
    assert.equal((await read(page)).owned.length, 5);
    await page.getByRole("button", { name: /OPEN ANOTHER/ }).click();
    await page.getByRole("button", { name: /or tap to rip/ }).waitFor();
    let state = await read(page);
    assert.equal(state.owned.length, 10);
    assert.equal(state.ledger.filter((x) => x.delta < 0).length, 2);
    await page.reload();
    await page.getByRole("button", { name: /YOUR PACK IS WAITING/ }).click();
    await page.getByRole("button", { name: /or tap to rip/ }).click();
    await page.getByRole("button", { name: "Reveal all", exact: true }).click();
    await page.waitForTimeout(200);
    await page.screenshot({ path: `test-results/summary-update-${w}.png` });
    await page.getByRole("button", { name: /VIEW CARDS/ }).click();
    await page.getByText("A universe. Yours.").waitFor();
    assert.equal((await read(page)).pending, null);
    // A fixture inventory with the real Base Set's first 26 unique definitions.
    await page.evaluate(async () => {
      const { initialSave } = await import("/src/game/engine.ts");
      const { sets } = await import("/src/game/catalogue.ts");
      const key = localStorage.getItem("packverse-browser-id");
      const save = initialSave();
      save.owned = sets[0].cards.slice(0, 26).map((c, i) => ({
        instanceId: "fixture_" + i,
        cardId: c.id,
        setId: c.setId,
        finish: "holo",
        tier: c.tier,
        obtainedAt: Date.now(),
        openingId: "fixture",
      }));
      save.stats.bestTier = 3;
      await new Promise((resolve) => {
        const r = indexedDB.open("packverse-v1", 1);
        r.onsuccess = () => {
          const tx = r.result.transaction("saves", "readwrite");
          tx.objectStore("saves").put(save, key);
          tx.oncomplete = resolve;
        };
      });
    });
    await page.reload();
    await page.getByRole("button", { name: /COLLECTOR MISSIONS/ }).click();
    await page.getByText("COLLECTOR ACHIEVEMENTS", { exact: true }).click();
    const claim = page.getByRole("button", {
      name: "Claim Base Set · 25%",
      exact: true,
    });
    await claim.click();
    assert.equal((await read(page)).coins, 550);
    assert(await claim.isDisabled());
    await page
      .getByRole("button", { name: "Claim First foil", exact: true })
      .click();
    assert.equal((await read(page)).coins, 575);
    await page.getByRole("button", { name: "Close dialog" }).click();
    await page.reload();
    await page.getByRole("button", { name: /COLLECTOR MISSIONS/ }).click();
    await page.getByText("COLLECTOR ACHIEVEMENTS", { exact: true }).click();
    assert(
      await page
        .getByRole("button", { name: "Claim Base Set · 25%", exact: true })
        .isDisabled(),
    );
    assert.equal((await read(page)).coins, 575);
    await page.screenshot({ path: `test-results/achievements-${w}.png` });
    await ctx.close();
    console.log(
      `PASS ${w}x${h}: summary actions, transactional repeat, reload recovery, binder route, unique set milestone and persistent achievement claims`,
    );
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
  await app.close();
}
