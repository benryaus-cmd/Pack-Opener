# Assets and dependencies

- Card catalogue: [TCGdex cards-database](https://github.com/tcgdex/cards-database) and [TCGdex API](https://tcgdex.dev), snapshot retrieved 21 October 2026. 124 real expansions, 16,977 printed definitions. Exact IDs and image bases are retained from API responses; printed rarities are normalized separately for prototype display tiers.
- Temporary Pokémon Trading Card Game images: Pokémon / Nintendo / Creatures / GAME FREAK and respective card artists. Used as explicitly requested prototype content. No commercial artwork rights are claimed. Replace with original licensed content for an original-IP release.
- Official international Pokémon card reverse: Pokémon TCG API, `https://images.pokemontcg.io/card-back.png`.
- Cached card images: 102 Base Set cards plus eight featured cards from other eras, obtained from the API-returned TCGdex asset bases.
- Barlow Condensed: The Barlow Project Authors, SIL Open Font License 1.1. Self-hosted Latin normal weights 500–800, distributed via Fontsource. License: `public/fonts/BARLOW-LICENSE.txt`.
- DM Sans: DM Sans Project Authors, SIL Open Font License 1.1. Self-hosted Latin normal weights 400–700, distributed via Fontsource. License: `public/fonts/DM-SANS-LICENSE.txt`.
- Icons: Lucide, ISC License.
- Sound effects and ambient bed: original synthesized WAV generation in `src/services/audio.ts`, played by Howler.js (MIT). No external audio samples are required.
- Motion for React: MIT. GSAP: its distributed standard license. React, Vite and TypeScript retain their upstream licenses. The package lock records exact installed dependencies.
- Foil surfaces, pack visuals, layout and animations: new React/CSS implementation inspired by the cited references. No GPL Svelte application or reference visual assets were copied. See `docs/RESEARCH.md` for actual source review and implementation decisions.
- Aippy SDK compatibility transform adapted from the user-provided `benryaus-cmd/fidget` project; the official `@aippy/runtime` handles native/iframe identity.

Prototype finish names and drop rates are design configuration, not authentic pack collation claims. The original printed rarity remains visible in each inspector.
