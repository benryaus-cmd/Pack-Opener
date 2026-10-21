import { test } from "node:test";
import assert from "node:assert/strict";
import { initialSave } from "../src/game/engine.ts";
import { ARCADE_STAKE, playArcade, arcadeResult } from "../src/game/arcade.ts";

const rolls = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};
test("slots debit and settle together, preserve input, and cannot settle twice after reload", () => {
  const before = initialSave();
  const won = playArcade(before, "slots", "spin-one", 100, rolls(0));
  assert.equal(before.coins, 500);
  assert.equal(won.coins, 500 - ARCADE_STAKE + 15);
  assert.equal(won.ledger[0].delta, 10);
  assert.deepEqual(arcadeResult(won, "spin-one")?.values, [0, 0, 0]);
  const restored = JSON.parse(JSON.stringify(won));
  assert.deepEqual(
    playArcade(restored, "slots", "spin-one", 999999, rolls(0.9)),
    restored,
  );
  restored.ledger = [];
  assert.equal(
    playArcade(restored, "drop", "spin-one", 999999, rolls(0)).coins,
    won.coins,
  );
});
test("a losing spin charges exactly five and insufficient funds do not draw or mutate", () => {
  const before = initialSave();
  const lost = playArcade(before, "slots", "loss", 100, rolls(0, 0.4, 0.8));
  assert.equal(lost.coins, 495);
  assert.equal(arcadeResult(lost, "loss")?.payout, 0);
  const poor = { ...before, coins: 4 };
  assert.throws(
    () =>
      playArcade(poor, "drop", "poor", 100, () => {
        throw Error("RNG was called");
      }),
    /Not enough/,
  );
  assert.equal(poor.coins, 4);
});
test("all slot combinations and ball paths match the disclosed odds and bounded payouts", () => {
  const s = initialSave();
  const slots = new Map<number, number>();
  for (let a = 0; a < 3; a++)
    for (let b = 0; b < 3; b++)
      for (let c = 0; c < 3; c++) {
        const result = arcadeResult(
          playArcade(s, "slots", "s", 100, rolls(a / 3, b / 3, c / 3)),
          "s",
        )!;
        slots.set(result.payout, (slots.get(result.payout) ?? 0) + 1);
      }
  assert.deepEqual(Object.fromEntries(slots), { 0: 6, 6: 18, 15: 3 });
  const bins = [0, 0, 0, 0, 0];
  for (let path = 0; path < 16; path++) {
    const result = arcadeResult(
      playArcade(
        s,
        "drop",
        "d",
        100,
        rolls(...Array.from({ length: 4 }, (_, i) => ((path >> i) & 1) * 0.75)),
      ),
      "d",
    )!;
    bins[result.values.reduce((sum, value) => sum + value, 0)]++;
    assert.equal(
      result.payout,
      [12, 8, 0, 8, 12][result.values.reduce((sum, value) => sum + value, 0)],
    );
  }
  assert.deepEqual(bins, [1, 4, 6, 4, 1]);
});
test("invalid random values and transaction ids never change a balance", () => {
  const s = initialSave();
  for (const value of [NaN, -1, 1, Infinity])
    assert.throws(
      () => playArcade(s, "slots", "bad", 100, () => value),
      /Random/,
    );
  assert.throws(() => playArcade(s, "slots", "", 100), /transaction/);
  assert.equal(s.coins, 500);
  assert.equal(s.purchaseIds.length, 0);
});
