import type { Save, WalletLedgerEntry } from "./types.ts";
export const ARCADE_STAKE = 5;
export type ArcadeKind = "slots" | "drop";
export interface ArcadeResult {
  kind: ArcadeKind;
  values: number[];
  payout: number;
}
type ArcadeLedgerEntry = WalletLedgerEntry & { arcade?: ArcadeResult };
const prefix = "arcade:";
/** This entire operation runs inside the existing IndexedDB write transaction. */
export function playArcade(
  save: Save,
  kind: ArcadeKind,
  id: string,
  now = Date.now(),
  rng = Math.random,
): Save {
  if (!id || id.length > 120) throw Error("Invalid arcade transaction");
  const key = prefix + id;
  // Permanent purchase IDs survive ledger trimming, reloads and retries.
  if (save.purchaseIds.includes(key)) return save;
  if (kind !== "slots" && kind !== "drop") throw Error("Unknown arcade game");
  if (save.coins < ARCADE_STAKE)
    throw Error("Not enough coins. Try Collector’s Eye for free.");
  function draw(size: number) {
    const value = rng();
    if (!Number.isFinite(value) || value < 0 || value >= 1)
      throw Error("Random source unavailable");
    return Math.floor(value * size);
  }
  const values = Array.from({ length: kind === "slots" ? 3 : 4 }, () =>
    draw(kind === "slots" ? 3 : 2),
  );
  const unique = new Set(values).size;
  const payout =
    kind === "slots"
      ? unique === 1
        ? 15
        : unique === 2
          ? 6
          : 0
      : [12, 8, 0, 8, 12][values.reduce((a, b) => a + b, 0)];
  const result: ArcadeResult = { kind, values, payout };
  const entry: ArcadeLedgerEntry = {
    id: key,
    delta: payout - ARCADE_STAKE,
    reason: `${kind === "slots" ? "Lucky reels" : "Coin drop"} · ${payout} payout / ${ARCADE_STAKE} stake`,
    at: now,
    arcade: result,
  };
  return {
    ...save,
    coins: save.coins - ARCADE_STAKE + payout,
    purchaseIds: [...save.purchaseIds, key],
    ledger: [entry, ...save.ledger].slice(0, 300),
  };
}
export function arcadeResult(save: Save, id: string): ArcadeResult | undefined {
  const row = save.ledger.find((entry) => entry.id === prefix + id) as
    ArcadeLedgerEntry | undefined;
  return row?.arcade;
}
