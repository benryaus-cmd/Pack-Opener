# BUILD THIS — PACKVERSE
## Premium Mobile Pack-Ripping, Collecting & Multiplayer Game

**Project type:** React / TypeScript / Vite mobile web game  
**Primary orientation:** Portrait  
**Primary platform:** Aippy embedded mobile webview, also playable in normal mobile and desktop browsers  
**Target quality:** AAA-inspired visual polish, satisfying tactile interactions, complete game systems  
**Development goal:** Build a playable, polished prototype immediately.

---

# 1. YOUR MISSION

Build **PACKVERSE**, a premium Pokémon-inspired digital trading-card collecting game.

Players open booster packs, collect cards across generations, discover increasingly rare cards, complete collections, earn coins, purchase different booster products, inspect beautiful holographic cards, and trade with other players.

This should feel like a dedicated mobile collecting game, not a website with Pokémon images.

Imagine combining:

- The pack-opening excitement of Pokémon TCG Pocket.
- The visual spectacle of rare pulls in modern gacha and collection games.
- The addictive collecting progression of a sticker album.
- The physical satisfaction of peeling open a real booster pack.
- The social excitement of showing friends an exceptionally rare card.

**The opening experience is the centrepiece of the entire game.**

This is a game about collecting, not battling. Do not spend development time building a combat system.

For now, use available Pokémon TCG data and artwork as temporary local prototype content. Architect the game so these assets and identifiers can later be replaced with original IP.

Do not assume that an open-source database license grants permission to redistribute Pokémon artwork in a public commercial product.

You are the implementation agent. Build the application, not a project proposal.

---

# 2. MOBILE-FIRST — CRITICAL DESIGN REQUIREMENT

This game will often run inside a portrait-oriented Aippy webview rather than occupying the entire phone screen.

**Assume an approximate visible gameplay area of 3 inches wide × 5 inches tall.**

This is a physical design reference, not a fixed CSS pixel size.

The actual viewing area can be smaller or larger depending on device, browser and embedding.

Design against the *available container*, not assumed hardware dimensions.

## Supported layouts

- Compact phone viewport: approximately 280–359 CSS pixels wide.
- Standard phone viewport: 360–430 CSS pixels.
- Large phone: 431–600 CSS pixels.
- Tablet: larger available widths.
- Desktop browser: a beautiful portrait game shell centred on screen, with useful peripheral content where appropriate.

Test especially at:

- 280 × 470
- 320 × 530
- 360 × 600
- 375 × 667
- 390 × 700
- 430 × 800
- 768 × 1024

These are **game viewport dimensions**, not necessarily the device's physical screen resolution.

## Layout principles

Use a hybrid layout strategy:

- `100%` of the available app container for the main game shell.
- `100dvh` only when the app truly owns the viewport; support embedded parent layouts with explicit container sizing.
- CSS Grid for major screens.
- Flexbox for adaptive toolbars.
- Container queries and container query units (`cqw`, `cqh`) where appropriate.
- `clamp()` for scalable text, cards, spacing and controls.
- `minmax()` for collection grids.
- `aspect-ratio` to preserve card proportions.
- Safe-area insets for phones with notches and gesture bars.
- `ResizeObserver` for changing embedded viewport dimensions.
- Visual viewport detection where required for keyboards.

Example sizing system:

```css
.game-root {
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
  overflow: hidden;
  container-type: size;
  isolation: isolate;
}

.game-shell {
  --space-1: clamp(3px, 0.8cqw, 6px);
  --space-2: clamp(6px, 1.6cqw, 10px);
  --space-3: clamp(9px, 2.4cqw, 15px);

  --text-xs: clamp(9px, 2.5cqw, 12px);
  --text-sm: clamp(11px, 2.9cqw, 14px);
  --text-md: clamp(12px, 3.4cqw, 16px);
  --text-lg: clamp(17px, 4.5cqw, 23px);

  --card-radius: clamp(6px, 1.7cqw, 12px);
}

.collection-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-2);
}

button {
  touch-action: manipulation;
}
```

Provide a fallback for browsers without CSS container query units. Don't let `container-type: size` cause the root to collapse when its parent lacks explicit height.

## Small-screen usability

Do not attempt to display desktop levels of information at once.

Use progressive disclosure:

- Small thumbnails in card grids.
- Tap to enlarge.
- Tap a collection set to open its contents.
- Tap a card for full-screen inspection.
- Tap information icons for descriptions.
- Use compact filters and expandable drawers.
- Use short labels on primary controls.
- Keep secondary information hidden until requested.

Small text is acceptable for secondary details, card identifiers, tiny counts and rarity metadata.

But primary navigation, coin totals, confirmation buttons and pack-opening instructions must remain legible.

Aim for 44 × 44 CSS pixel touch targets where space permits; use invisible expanded hit areas for compact visible icons.

Never use actual tiny touch targets simply because an icon looks small.

Avoid horizontal page scrolling, sideways clipping or UI elements overlapping card art.

## Game shell

Create a persistent bottom navigation with five destinations:

1. HOME
2. SHOP
3. RIP
4. CARDS
5. SOCIAL

On very compact viewports, use an icon with a short label for each.

The navigation should occupy as little height as practical while preserving touch usability.

During immersive pack-opening moments, hide the bottom navigation.

Do not stack multiple large headers, breadcrumbs and navigation bars.

Every pixel counts.

The game must work using touch alone. Hover is an optional enhancement.

---

# 3. VISUAL IDENTITY

Make the game look premium, modern and immediately recognisable.

Working title: **PACKVERSE**

The aesthetic is premium collector culture.

Use:

- Dark charcoal backgrounds.
- Subtle navy and graphite gradients.
- Metallic gold for exceptional rewards.
- Soft cyan for interactive highlights.
- Rich purple for elite rarity effects.
- Tasteful holographic reflections.
- Realistic pack foil.
- Glossy card surfaces.
- Crisp contemporary typography.
- Soft background glows.
- Layered depth and shadows.
- Controlled sparks and light streaks.
- Satisfying spring animations.

Do not make the UI look like a generic SaaS dashboard.

No giant empty panels, oversized headings or uniform card grids without visual hierarchy.

It should resemble a polished mobile game.

The interface should feel lively before the player even touches anything.

Use subtle idle animation, shimmering premium packs, animated backgrounds and pulsing interactive elements without creating unnecessary GPU load.

---

# 4. GITHUB REPOSITORIES — REQUIRED RESEARCH

You have been given specific GitHub repositories to use as implementation references.

**Inspect their actual source code before implementing the relevant systems.**

Do not simply link them in a README.

Determine what can be reused, adapted or improved.

Evaluate package compatibility, maintenance, licenses and whether the technique performs well on mobile.

Avoid importing a complete unrelated application when only one component or architectural pattern is needed.

## 4.1 Card catalogue — primary data source

https://github.com/tcgdex/cards-database

Documentation:

https://github.com/tcgdex/documentation

https://tcgdex.dev

Use TCGdex as the authoritative reference for card definitions.

Import and normalise:

- Generations and eras.
- Series.
- Sets and expansions.
- Card identifiers.
- Card names.
- Card numbers and collector numbers.
- Rarity.
- Images.
- Variants when provided.
- Card types and supporting metadata.
- Set totals and available cards.
- Release dates when available.

Use a supported TypeScript SDK or documented API endpoints.

Never fabricate card identifiers or image URLs.

Provide graceful handling for missing card images and incomplete metadata.

Cache normalised results locally.

Avoid thousands of API requests whenever a collection grid opens.

**Important:** A card set's actual contents should determine what can be obtained from its booster products.

Not every generation uses identical rarities or pack configurations.

Support these differences through data-driven configuration.

## 4.2 Holographic card effects

https://github.com/simeydotme/pokemon-cards-css

This is the primary reference for holographic surfaces.

Study:

- Foil patterns.
- Rainbow reflections.
- Glitter.
- Specular lighting.
- Directional highlights.
- CSS masking.
- Pointer-based transformations.
- Holographic special-card styling.

Adapt its best effects into reusable React card components.

Create finishes such as:

- Standard matte.
- Glossy.
- Reverse holo.
- Holo.
- Textured foil.
- Full-art shimmer.
- Rainbow refractive.
- Gold metallic.
- Premium animated finish.

Map these finishes to actual card characteristics when possible rather than treating every card as equally holographic.

Do not apply multiple expensive effects to every collection thumbnail.

Use lightweight static treatments in grids and activate full effects only for focused or enlarged cards.

## 4.3 Alternative card animation

https://github.com/fito-cheol/Card-Animation-React

Review as an alternative approach to card motion, holographics and interactions.

Compare visual quality and performance.

Reuse specific techniques only if they improve the primary implementation.

Do not introduce a second heavy rendering system unnecessarily.

## 4.4 Pack-opening reference A

https://github.com/hongyime/pokemonpacks

Inspect:

- Pack-opening flow.
- Card-stack presentation.
- Dragging and swiping.
- Reveal timing.
- Adding cards to collections.
- Interaction choreography.

Use as a structural reference.

Do not inherit its older API or session-storage limitations.

Use our own data layer and persistent ownership model.

## 4.5 Pack-opening reference B

https://github.com/vitorwtavares/pokebooster-sim

Inspect:

- Pack idle animation.
- Swipe-to-open interaction.
- Set-selection carousel.
- Sequential card reveals.
- Parallax card effects.
- Full-screen card inspection.
- Rarity presentation.

Compare both pack-opening projects and combine their strongest techniques.

Our implementation must improve upon them with richer sound, more polished motion, physical foil ripping, rarity-specific reveal effects and game progression.

## 4.6 Premium card tilt

https://github.com/gfazioli/react-tilt

Study:

- Interactive perspective.
- Card tilting.
- Glare.
- Spring return.
- Layered parallax.
- Device orientation support.

Integrate selective techniques into the full-screen card inspector.

Tilt should be bounded and believable.

Pointer dragging must work without gyroscope permission.

Gyroscope control should be optional and respect browser permission rules.

## 4.7 Collection and missions

https://github.com/marcelpanse/tcg-pocket-collection-tracker

Inspect:

- Collection browser structure.
- Set completion.
- Missing-card tracking.
- Duplicate management.
- Search and filters.
- Missions and completion objectives.
- Pack recommendations.
- Trading and social concepts.

Build a visually richer mobile-first version.

Do not copy the entire UI unmodified.

## 4.8 Drag-and-drop

https://github.com/clauderic/dnd-kit

Use for appropriate interactions such as:

- Binder reordering.
- Showcase card organisation.
- Trade-slot selection.
- Dragging owned cards into offers.

Maintain tap-based alternatives to drag-and-drop.

Touch interfaces must never depend exclusively on precise dragging.

## 4.9 Animation choreography

https://github.com/greensock/react

Use GSAP for cinematic sequences:

- Booster wrapper opening.
- Foil tearing.
- Cards rising from packs.
- Sequential flipping.
- Ultra-rare reveal buildup.
- Particle synchronization.
- Collection reward celebrations.

Use timelines to orchestrate events rather than creating dozens of unrelated timers.

Implement proper cleanup and avoid stale React references.

## 4.10 Interface motion

https://github.com/motiondivision/motion

Use for:

- Navigation transitions.
- Animated modals.
- Card-grid reorganising.
- Expanding drawers.
- Shop panel transitions.
- Spring-based UI interactions.

Assign responsibilities clearly between Motion and GSAP.

Avoid both libraries animating the same properties on the same element.

## 4.11 Particles

https://github.com/tsparticles/tsparticles

Use for:

- Card reveal sparkles.
- Coin reward bursts.
- Confetti.
- Rare pull flashes.
- Floating dust.
- Background atmosphere.

Only render particle systems when required.

Limit particle counts according to device performance.

Advanced option:

https://github.com/pixijs-userland/particle-emitter

Investigate for complex premium effects only if the existing rendering approach cannot achieve the intended result efficiently.

Do not add PixiJS solely to create ordinary confetti.

## 4.12 Audio engine

https://github.com/goldfire/howler.js

Use Howler.js for:

- Background music.
- UI sounds.
- Pack crinkling.
- Foil tearing.
- Card swipes.
- Card flipping.
- Coin jingles.
- Rare-card reveal sounds.
- Large celebration effects.

Support volume categories and sound layering.

Account for mobile autoplay restrictions and unlock audio after the first valid user interaction.

Avoid replaying or reinitialising audio objects on every React render.

## 4.13 Multiplayer economy and trading

https://github.com/akorwash/QuizBattle

This is an important architecture reference.

Study:

- Server-authoritative coin balances.
- Persistent card ownership.
- Marketplace transactions.
- Direct trades.
- Card locking.
- Escrow.
- Atomic transfers.
- Anti-farming limits.
- Player identity.
- Real-time player interactions.

We are not copying its quiz or battle gameplay.

We want to understand its collecting economy, trading and consistency safeguards.

## 4.14 Marketplace reference

https://github.com/julkascript/cardflow

Study:

- Selling cards.
- Marketplace listings.
- Buying cards.
- Trading cards.
- Inventory management.
- Listing interfaces.

Adapt what is appropriate for a mobile-first collectible game.

## 4.15 Realtime multiplayer

https://github.com/colyseus/colyseus

Review for:

- Presence.
- Multiplayer rooms.
- Real-time events.
- Reconnection.
- Server-authoritative state.
- Reliable communication.

Use only if appropriate for the existing development environment.

If the platform already provides a functioning multiplayer transport, prefer reusing it over installing an unnecessary competing system.

Never pretend that local browser storage synchronises multiple real players.

## 4.16 Game state

https://github.com/pmndrs/zustand

Use Zustand for client-side game state:

- Active screen.
- Currently selected pack.
- Opening animation state.
- Collection filters.
- Modals.
- Notification queue.
- Current user session.
- Cached wallet display.

Keep unrelated state isolated to avoid excessive React rerenders.

## 4.17 Local persistence

https://github.com/dexie/Dexie.js

Use IndexedDB where appropriate for:

- Card catalogue caching.
- Loaded set metadata.
- Cached collection thumbnails.
- Local preferences.
- Offline-supporting data.
- Recoverable solo prototype progress.

The server must remain authoritative for multiplayer inventories, coins and completed transactions.

If no compatible backend is available, implement a complete, durable local prototype while keeping the multiplayer service contract clearly separated and ready to connect.

Never simulate a successful real multiplayer trade when no authoritative backend exists.

---

# 5. GAME HOME SCREEN

The player should immediately see a polished game home screen.

At minimum display:

**Top bar**

- Player avatar.
- Player name or nickname.
- Coin balance.
- Optional premium currency placeholder only if needed later.
- Settings.

**Hero area**

Feature the current promoted booster set.

Use a large, attractive pack render, animated foil sheen and a clear action:

**OPEN PACK**

Below the hero, display compact progression information:

- Daily rewards.
- Missions.
- Sets nearing completion.
- Recent rare pulls.
- Friend activity where multiplayer is available.

Provide an obvious first-time-player path.

New players should reach their first pack-opening interaction within a couple of taps.

The game should not begin with a wall of explanatory text.

---

# 6. PACK SHOP

Create a premium booster shop.

It should look like a collectible product store, not a plain list.

Organise sets by generation, era or series.

Each set tile displays:

- Authentic or provisional pack art.
- Set name.
- Era.
- Release information where available.
- Card count.
- Completion progress.
- Cost.
- A rarity highlight or chase-card preview.

Make the shop searchable and filterable.

## Different pack products

Implement at least:

| Product | Starting price | Contents |
|---|---:|---|
| Standard Booster | 100 coins | 5 cards |
| Collector Booster | 250 coins | 7 cards |
| Premium Booster | 500 coins | 10 cards |
| Generation Bundle | 900 coins | 3 standard packs |
| Daily Free Pack | Free | 5 cards |

These are **prototype economy values**, not claims about real Pokémon booster configurations.

Model the product separately from the underlying set.

Each product specifies its actual card count, eligible pool, guaranteed slots, rarity weights and cost.

A set's real card catalogue remains the source of the available cards.

Premium products may have different disclosed odds and guarantees but must not magically create cards outside the chosen pool.

The premium tiers should feel exciting without making standard packs pointless.

Show pack contents and odds in an accessible information panel.

Do not display misleading guarantees.

Make purchases feel satisfying with subtle sound and animation.

---

# 7. PHYSICAL PACK-OPENING EXPERIENCE

This is the highest-priority feature.

Do not implement it as a static pack image followed by an instant card grid.

Create a real interactive sequence.

## Stage A — Pack presentation

Display one large, beautifully rendered booster pack in the centre.

It should occupy a significant portion of the available portrait viewport without clipping.

The pack should have:

- Foil material.
- Crimped ends.
- Specular highlights.
- Fine creases.
- Dimensional shadow.
- Subtle idle movement.
- Responsive touch feedback.

The pack may use layered CSS, SVG, textures and animated masks.

Use actual image assets where available and procedurally construct the wrapper effects where necessary.

## Stage B — Rip the pack

Player swipes across the top of the pack.

A visible tear follows the gesture.

Accompany it with:

- Wrapper deformation.
- Foil peeling.
- Tear-line movement.
- Crinkling sounds.
- Small foil particles.
- Tactile vibration where supported.
- Two wrapper sections separating.

The gesture must be forgiving.

If the player releases partway through, either complete the tear naturally or return to a recoverable state.

Provide a tap-to-open alternative for accessibility and embedded webviews where complicated touch gestures are unreliable.

Do not block progress because a gesture was not performed precisely enough.

## Stage C — Cards emerge

The opened wrapper exposes a physical-looking stack of cards.

The stack slides upward.

Cards should have subtle depth and individual shadows.

The player advances through cards by swiping or tapping.

The animation should evoke handling physical trading cards.

Include slight rotation, card friction, spring movement and convincing deceleration.

## Stage D — Card reveal

Each card moves forward into focus.

Show the card face clearly.

Use a controlled flip animation where appropriate.

Display a small rarity indication that does not obstruct the artwork.

Normal cards should reveal quickly.

Rare cards should produce increasing anticipation.

## Stage E — Rare reveal

Use rarity-dependent animations.

Common: clean flip and subtle sound.

Uncommon: soft light pulse and bright audio accent.

Rare: glow, sparkle and stronger reveal sound.

Ultra Rare: dramatic card entrance, intensified holographics, camera-like movement and layered audio.

Secret / highest rarity: darkened environment, light bloom, gold or rainbow particles, dramatic sound cue and a distinctive reveal sequence.

These are presentation tiers. Map actual set-specific rarity categories to the appropriate tiers.

Do not force a 10-second cinematic sequence for every ordinary rare card.

Preserve the excitement of exceptional cards by using restraint with common reveals.

## Stage F — Pack summary

After all cards are revealed, show a polished summary.

All cards appear in a responsive grid.

Indicate:

- NEW
- DUPLICATE
- Rarity
- Collection progress
- Notable pull

Actions:

**ADD TO COLLECTION** (automatic, with visible confirmation)

**OPEN ANOTHER**

**VIEW CARDS**

**SHARE PULL**

The obtained cards must already have been recorded in the authoritative inventory before the reveal began. Animation completion must not be required for ownership to persist.

Closing the app mid-animation must never lose purchased cards.

---

# 8. RARITY AND PULL GENERATION

Build a real data-driven rarity engine.

Do not just select cards using `Math.random()` in a UI component.

Each pack product should reference an explicit drop table.

Represent pack contents as independently configured slots.

Example:

```ts
interface PackSlot {
  name: string;
  count: number;
  eligibleRarities: string[];
  weights: Record<string, number>;
  guaranteedMinimum?: string;
}

interface PackDefinition {
  id: string;
  setIds: string[];
  priceCoins: number;
  slots: PackSlot[];
  artworkUrl?: string;
}
```

The rarity engine should:

1. Determine eligible cards.
2. Resolve each pack slot.
3. Choose rarity using configured weights.
4. Select an actual eligible card.
5. Assign supported visual finishes or variants.
6. Create owned card instances.
7. Commit the result and wallet transaction.
8. Return the generated pack for animation.

Use a secure server-side randomness source for authoritative online pack generation.

Use a suitable cryptographic random source for local prototypes.

Store odds as configuration, not scattered constants.

## Set authenticity

Do not assume all sets have the same rarity structure.

Create an adapter from real TCGdex rarity metadata to the game's display tiers.

Keep the original rarity name.

If the database does not provide authentic pack slot odds, use clearly identified **prototype drop rates**.

Do not invent historical pack odds and present them as facts.

Include automated statistical tests to check actual pull distributions against configured weights.

---

# 9. COLLECTION AND BINDER

The collection needs to be beautiful enough that collecting cards feels worthwhile even when not opening packs.

## Main collection screen

Display:

- Total unique cards.
- Total owned copies.
- Total available cards.
- Completed sets.
- Overall completion percentage.
- Recently obtained cards.
- Current generation or series selection.

Create generation tabs or a compact selector.

Then show sets within that generation.

Tapping a set opens a binder-style collection.

## Binder view

Use a compact 3-column grid on narrow phones.

Card thumbnails may be small.

That is acceptable.

The player can tap any card to view it larger.

Missing cards appear as dark silhouettes or attractive empty binder slots.

Owned cards show actual art.

Duplicate counts appear in small badges.

Optional controls:

- Show owned only.
- Show missing only.
- Show duplicates.
- Sort by card number.
- Sort by rarity.
- Sort by recent pulls.
- Filter by type.
- Search by name.

On larger tablets, increase columns naturally.

Do not enlarge cards to the point that the binder feels empty.

## Card inspection

Tapping a card opens a premium full-screen inspector.

Show:

- Large card artwork.
- Holographic effect.
- Pointer-controlled tilt.
- Optional motion sensor tilt.
- Rarity.
- Set.
- Card number.
- Quantity owned.
- Date obtained.
- Variant or finish.
- Favourite button.
- Trade or showcase button.

Allow the user to rotate the card with a finger and observe the foil.

Double-tap may zoom.

Use high-resolution imagery where available.

This should be one of the most satisfying visual moments in the game.

---

# 10. COIN ECONOMY AND MISSIONS

Create an actual progression loop.

Players should earn coins through activities rather than needing a developer button to grant unlimited currency.

For the prototype, begin with:

**Starting balance: 500 coins**

## Daily rewards

Provide a daily claim reward of 100 coins.

Track the claim against a persistent day boundary.

## Missions

Examples:

| Mission | Reward |
|---|---:|
| Open 1 booster pack | 30 coins |
| Open 3 booster packs | 75 coins |
| Collect 5 previously unseen cards | 100 coins |
| Complete a set milestone | 150 coins |
| Inspect a card in 3D | 20 coins |
| Make a successful trade | 50 coins |

Use sensible reward limits and avoid easily exploitable infinite loops.

A player should always have a reasonable, understandable path towards another pack.

Create additional progression systems:

- Collector XP.
- Collector levels.
- Milestone achievements.
- Set completion rewards.
- Rare-pull achievements.
- Daily missions.
- Weekly missions.
- Login streaks.

The progression should be compelling without requiring combat gameplay.

## Duplicates

Duplicates should have value.

Initially support:

- Keeping copies.
- Trading copies.
- Displaying copies.
- Optional converting duplicates into a small number of coins.

Make conversion irreversible only after user confirmation.

Do not permit duplicate conversion to create an infinite coin-generation exploit.

---

# 11. MULTIPLAYER AND SOCIAL

Multiplayer is an important part of the game's intended identity.

Build the interface and appropriate data contracts now.

Implement actual online functionality where a compatible backend and persistent storage are available.

## Player profiles

Display:

- Avatar.
- Nickname.
- Collector level.
- Total cards.
- Completed sets.
- Favourite card.
- Showcase cards.
- Recent notable pulls.

If the Aippy runtime exposes user identity, use the supported SDK rather than fabricating an identity protocol.

## Friends

Players should be able to:

- Search for other players.
- View profiles.
- Add friends.
- Inspect public showcases.
- Initiate trades.
- See online status where supported.

## Direct trading

Create a two-player trade interface.

Each player has their own offer area.

Players may add cards and optional coins.

Both players can inspect each other's offered cards.

The final trade must require confirmation from both parties.

If an offer changes, both confirmations reset.

On completion, the backend performs a single atomic transfer.

Never permit:

- Trading cards a player does not own.
- Double-spending one card in several simultaneous trades.
- Negative coin balances.
- Duplicate ownership created by race conditions.
- Selling a card while it is locked in an accepted trade.
- Client-side manipulation of card ownership.

Implement idempotent transaction identifiers and reliable error recovery.

## Marketplace

Create a compact marketplace interface.

Players can browse:

- Cards for sale.
- Rarity.
- Set.
- Price.
- Seller.
- Available listings.

Support listing, purchasing and cancellation using authoritative transactions.

Provide filters and small thumbnails.

The mobile interface should remain easy to navigate.

## Social activity

Include a lightweight social feed showing significant pulls and set completions.

Allow players to share a rare pull through a native sharing action where supported.

Do not publish private account information.

If multiplayer infrastructure is unavailable, keep the online UI clearly labelled as unavailable, rather than simulating other human players.

Prioritise a fully functional solo game over fake multiplayer.

---

# 12. AUDIO AND HAPTICS

Create a proper sound design system.

Use Howler.js and the browser's available vibration APIs.

If a supported Aippy haptics API is available, use its documented interface.

Do not assume a native bridge exists.

Provide distinct sounds for:

- Buttons.
- Pack selection.
- Coins.
- Wrapper touching.
- Foil crinkle.
- Foil ripping.
- Pack burst.
- Card sliding.
- Card flip.
- New card.
- Duplicate.
- Rare pull.
- Ultra-rare pull.
- Mission completion.
- Set completion.
- Successful trade.

Rare reveals should use layered audio.

Example:

1. Low anticipation rumble.
2. Rising shimmer.
3. Brief silence or ducking.
4. Impact.
5. Resonating musical flourish.
6. Light particle sparkle.

Avoid excessively loud or unpleasant combinations.

Create volume controls for:

- Master.
- Music.
- Sound effects.

Support mute.

Default to conservative music volume, approximately 15%, with clear user controls.

Persist preferences.

Start audio only after a valid user gesture on mobile.

---

# 13. PERFORMANCE — MOBILE GPU BUDGET

The game must look impressive without destroying mobile frame rate.

Target 60 FPS on modern phones where feasible.

Maintain reasonable usability on lower-end devices.

## Rendering strategy

- Use normal DOM and CSS for the interface.
- Use CSS perspective and transforms for most card motion.
- Use selective canvas-based particles where useful.
- Avoid unnecessary full-screen WebGL.
- Avoid rendering every card with animated foil shaders.
- Limit active 3D effects to foreground cards.
- Prefer transform and opacity animations to layout-changing animations.
- Preload assets needed for the current pack reveal.
- Lazy-load collection thumbnails.
- Virtualise very large lists and inventories.
- Cancel offscreen animation loops.
- Reuse expensive visual resources where possible.
- Respect `prefers-reduced-motion`.
- Keep image loading graceful on slow connections.

## Graphics quality settings

Provide:

- AUTO
- HIGH
- LOW

AUTO should select an initial setting using a conservative device profile and, where practical, measured animation performance.

Do not rely on screen size alone to estimate GPU power.

HIGH enables more premium effects.

LOW limits particle count, background animation and expensive lighting.

Essential interactions must feel good in every mode.

## Runtime diagnostics

Add a compact developer diagnostics option.

Display:

- Current FPS estimate.
- Frame-time information.
- Active particle count.
- Loaded card image count.
- Network state.
- Current graphics mode.
- Viewport width and height.
- Current card rendering mode.

Keep diagnostics hidden during normal gameplay.

---

# 14. APP ARCHITECTURE

Use React, TypeScript and Vite unless the existing project has a compatible established structure that should be preserved.

Create clean reusable components and separate game logic from rendering.

Suggested structure:

```text
src/
  app/
    App.tsx
    navigation.ts
    layout/
  components/
    CardView.tsx
    CardInspector.tsx
    BoosterPack.tsx
    CoinDisplay.tsx
    RarityBadge.tsx
    Modal.tsx
    ParticleLayer.tsx
  features/
    home/
    shop/
    opening/
    collection/
    missions/
    social/
    trading/
    marketplace/
  game/
    catalogue/
    economy/
    rarity/
    packs/
    inventory/
    progression/
  services/
    tcgdex/
    persistence/
    multiplayer/
    audio/
    haptics/
  stores/
    uiStore.ts
    collectionStore.ts
    playerStore.ts
  styles/
    tokens.css
    layout.css
    cards.css
    effects.css
  assets/
```

Adapt this to the current environment as necessary.

## Data models

At minimum distinguish:

**CardDefinition**

An immutable catalogue entry identifying the printed card.

**CardVariant**

A version or finish associated with that card, using authentic metadata or explicitly defined prototype variants.

**OwnedCard**

A uniquely identified card copy owned by a player, referencing its definition and variant.

**SetDefinition**

A published card set with its available card IDs and metadata.

**PackProduct**

A purchasable booster configuration with costs, contents and drop rules.

**PackOpening**

A uniquely identified result representing an already committed purchase and the cards generated.

**Wallet**

Persistent currency balances.

**WalletLedgerEntry**

An immutable record explaining each coin credit or debit.

**MissionProgress**

Progress and claim status.

**TradeOffer**

Participants, offered card instance IDs, offered coins, states and revisions.

**MarketplaceListing**

Seller, card instance, asking price, listing status and timestamps.

Use versioned persistence schemas and migrations where required.

Avoid saving an enormous duplicate copy of every card's full catalogue metadata inside every owned card.

## Offline and online considerations

The game should remain usable locally.

Cache catalogue content.

Persist solo progress.

Keep asynchronous operations recoverable.

Online transactions must be idempotent.

On reopening the app, restore pending committed pack openings so a player can view unacknowledged pulls.

Never charge twice because a network request was retried.

---

# 15. IMPORTANT FIRST-TIME PLAYER EXPERIENCE

The game must be understandable immediately.

On first launch:

1. Show an attractive home screen.
2. Give the player 500 starting coins.
3. Highlight a starter booster.
4. Let the player purchase or claim it.
5. Launch directly into the premium pack-opening experience.
6. Teach ripping through a tiny animated gesture hint.
7. Reveal the cards.
8. Show a satisfying collection summary.
9. Show newly earned collector progress.
10. Introduce the collection binder.

Do not present a long tutorial.

Use contextual guidance only when needed.

The player should feel rewarded within the first minute.

---

# 16. POLISH REQUIREMENTS

Pay attention to details.

Examples:

- Coin values animate when changing.
- Cards have slight physical spring.
- Booster packs react to finger position.
- Cards cast directional shadows.
- Rare cards subtly illuminate surrounding UI.
- Collection completion bars animate.
- Missing binder slots feel intentionally designed.
- Buttons respond immediately to touch.
- Haptic feedback matches animation.
- Shop products show tasteful reflective highlights.
- New cards have a distinct marker.
- Loading states use elegant skeletons.
- Empty states look designed.
- The player can skip repeated animations.
- The back button behaves sensibly.
- Modal dismissal never discards committed rewards.
- Orientation changes and container resizing do not break the interface.
- App resume restores the exact relevant game state.
- Unavailable images show graceful placeholders.
- Sound and animation do not duplicate after React rerenders.

Every feature should share one coherent visual language.

---

# 17. IMPLEMENTATION ORDER

Build in this order, maintaining a working application throughout.

### Phase 1 — Core foundation
- Responsive portrait shell.
- Navigation.
- Visual design system.
- TCGdex integration.
- Local catalogue cache.
- Player profile and wallet.
- Persistent storage.

### Phase 2 — The main attraction
- Pack shop.
- Pack definitions.
- Purchase flow.
- Rarity engine.
- Physical rip animation.
- Card reveal.
- Sound.
- Holographic rendering.
- Pack summary.
- Inventory persistence.

### Phase 3 — Collection gameplay
- Binder.
- Set progress.
- Card inspector.
- Duplicates.
- Missions.
- Coin earning.
- Collector levels.
- Achievements.

### Phase 4 — Social systems
- Player profiles.
- Friend interface.
- Trading service.
- Marketplace.
- Realtime presence where supported.
- Server-side validation.

### Phase 5 — AAA polish
- Premium rarity sequences.
- Sound layering.
- Performance tuning.
- Graphics settings.
- Transition polish.
- Accessibility.
- Small-screen testing.
- Error and reconnection recovery.

Do not abandon earlier phases while working on later features.

Prioritise the complete playable loop over implementing every secondary feature superficially.

---

# 18. ACCEPTANCE TESTS

Before considering the prototype complete, verify the following.

## Small-screen tests

At a 320 × 530 viewport:

- All five navigation destinations can be reached.
- The coin balance remains visible where appropriate.
- The shop is usable without horizontal page scrolling.
- The pack can be purchased and opened.
- The rip gesture is achievable with one thumb.
- Cards can be revealed without being clipped.
- The binder is readable.
- Enlarged cards remain within viewport bounds.
- Modal buttons are accessible.
- The player can close or leave every overlay.

At 280 × 470, compact layouts should remain usable with appropriate scrolling inside content areas, not cropped essential controls.

## Gameplay tests

- Coins are deducted exactly once per purchase.
- Invalid purchases are rejected.
- Every resulting card belongs to the correct pool.
- Drop tables generate statistically plausible outcomes.
- Rarity guarantees work correctly.
- Cards remain owned after reload.
- Duplicate counts are correct.
- Completing a mission grants its reward only once.
- Cards are not lost if a reveal is interrupted.
- Missing artwork does not crash the game.
- Opening another pack works repeatedly.
- Old set rarities are handled without crashes.

## Multiplayer tests

Where a real backend is available:

- Two players see their own inventories.
- Offers cannot reference unowned cards.
- Trade revisions reset confirmation.
- Completed trades move ownership atomically.
- Cancelled trades release assets.
- Market purchases cannot double-sell.
- Reconnects restore current state correctly.

## Rendering tests

- No permanent black screens.
- No invisible overlays blocking touch.
- No uncontrolled memory growth from effects.
- No duplicated event listeners.
- No audio playing without the appropriate user interaction.
- No expensive holographic rendering on hundreds of offscreen thumbnails.

---

# 19. DEFINITION OF DONE

The prototype is ready when a player can:

1. Open the app in portrait mode.
2. See a premium collector-themed interface.
3. Browse booster packs across multiple generations.
4. Spend earned coins on a chosen pack.
5. Physically rip open the pack.
6. Reveal cards one at a time.
7. Experience appropriately dramatic rare pulls.
8. Inspect a beautiful animated holographic card.
9. Add and retain their cards automatically.
10. Browse a persistent binder of owned and missing cards.
11. Earn additional coins from functioning missions.
12. Purchase and open more packs.
13. Access real social/trading features wherever compatible infrastructure is available.

**Do not deliver static mockups disguised as completed features.**

Where external services are unavailable, make the solo gameplay fully functional and isolate integration boundaries rather than hiding missing functionality.

---

# 20. FINAL INSTRUCTIONS

You have permission to use your artistic and technical judgement to create an exceptional mobile game.

Make strong decisions rather than repeatedly asking for approval.

Inspect the provided repositories and reuse the best ideas. Do not blindly copy incompatible components.

Build the real game.

Concentrate effort on the pack-opening experience, holographic cards, tactile responsiveness, attractive shop, collectible progression and persistent inventory.

Do not waste time creating a battle system.

Do not make a boring collection database with a pack-opening button attached.

**Make opening a booster feel so satisfying that the player immediately wants to open another.**

The small portrait viewport is not a reason to reduce visual quality. It is a reason to build a carefully composed interface where each screen does one thing brilliantly.

Start implementation now. Deliver the strongest complete, working build supported by the environment, with no fake backend functionality, and ensure the complete opening → collecting → earning → reopening loop works from beginning to end.
