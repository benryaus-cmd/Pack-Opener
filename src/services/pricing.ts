import { useEffect, useState } from "react";
import type { Finish } from "../game/types";

export interface CardPrice {
  amount: number;
  currency: "USD" | "EUR";
  source: "TCGplayer" | "Cardmarket";
  updated?: string;
  variant: string;
}
type Prices = Record<string, unknown>;
function record(value: unknown): Prices {
  return value && typeof value === "object" ? (value as Prices) : {};
}
/** TCGdex full card pricing schema: https://tcgdex.dev/reference/card */
export function parseCardPrice(
  value: unknown,
  finish: Finish,
): CardPrice | null {
  const pricing = record(record(value).pricing);
  const tcg = record(pricing.tcgplayer);
  // Synthetic finishes are presentation effects; never claim an exact physical variant price.
  const variants =
    finish === "reverse"
      ? ["reverse-holofoil"]
      : finish === "matte" || finish === "gloss"
        ? ["normal", "holofoil"]
        : ["holofoil", "normal"];
  for (const variant of variants) {
    const amount = record(tcg[variant]).marketPrice;
    if (typeof amount === "number" && Number.isFinite(amount) && amount > 0)
      return {
        amount,
        currency: "USD",
        source: "TCGplayer",
        variant,
        updated: typeof tcg.updated === "string" ? tcg.updated : undefined,
      };
  }
  const market = record(pricing.cardmarket);
  // Reverse foil must not silently inherit an unrelated normal or holo price.
  if (finish === "reverse") return null;
  const foil = !["matte", "gloss"].includes(finish);
  const amount =
    foil &&
    typeof market["trend-holo"] === "number" &&
    Number(market["trend-holo"]) > 0
      ? market["trend-holo"]
      : market.trend;
  return typeof amount === "number" && Number.isFinite(amount) && amount > 0
    ? {
        amount,
        currency: "EUR",
        source: "Cardmarket",
        variant: foil ? "foil trend" : "card trend",
        updated:
          typeof market.updated === "string" ? market.updated : undefined,
      }
    : null;
}
const cache = new Map<string, Promise<unknown>>();
export function fetchCardPricing(id: string) {
  if (!cache.has(id))
    cache.set(
      id,
      fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(id)}`, {
        signal: AbortSignal.timeout(10000),
      })
        .then((r) => {
          if (!r.ok) throw Error("Pricing unavailable");
          return r.json();
        })
        .catch(() => null),
    );
  return cache.get(id)!;
}
export function useCardPrice(id?: string, finish: Finish = "matte") {
  const [state, setState] = useState<{
    id?: string;
    finish: Finish;
    price: CardPrice | null;
    loading: boolean;
  }>({ id, finish, price: null, loading: Boolean(id) });
  useEffect(() => {
    let active = true;
    if (!id) return;
    setState({ id, finish, price: null, loading: true });
    void fetchCardPricing(id).then((value) => {
      if (active)
        setState({
          id,
          finish,
          price: parseCardPrice(value, finish),
          loading: false,
        });
    });
    return () => {
      active = false;
    };
  }, [id, finish]);
  return state.id === id && state.finish === finish
    ? state
    : { price: null, loading: Boolean(id) };
}
export function formatCardPrice(price: CardPrice) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency,
  }).format(price.amount);
}
