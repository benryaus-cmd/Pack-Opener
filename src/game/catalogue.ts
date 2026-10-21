import bundled from "./catalogue.json";
import type { SetDefinition, CardDefinition } from "./types.ts";
export const sets = bundled as SetDefinition[];
export const allCards = sets.flatMap((s) => s.cards);
export const cardById = new Map(allCards.map((c) => [c.id, c]));
export const setById = new Map(sets.map((s) => [s.id, s]));
export const totalCards = allCards.length;
export const heroCard = (s: SetDefinition) =>
  cardById.get(s.hero) ?? s.cards[0];
/** Remote catalogue artwork survives full-snapshot imports without bundled public assets. */
export const imageUrl = (c: CardDefinition, large = false) =>
  c.image ? `${c.image}/${large ? "high" : "low"}.webp` : "";
/** One set request, cached in IndexedDB by the service worker/browser cache. No per-card grid requests. */
export async function refreshSet(id: string, signal?: AbortSignal) {
  const response = await fetch(
    `https://api.tcgdex.net/v2/en/sets/${encodeURIComponent(id)}`,
    { signal },
  );
  if (!response.ok) throw Error("Catalogue refresh unavailable");
  const result = await response.json();
  if (result.id !== id || !Array.isArray(result.cards))
    throw Error("Invalid catalogue response");
  return result;
}
