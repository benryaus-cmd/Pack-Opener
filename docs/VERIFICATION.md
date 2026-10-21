# PACKVERSE 1.0 verification

Date: 21 October 2026. Node 24; Chromium 143 headless. Production output compiled with Vite 6.4.4 and TypeScript.

## Results

- `npm test`: **23 passed, 0 failed**. Tests cover transactional purchases, invalid purchases, pool membership, rare guarantees, a seeded 100,000-draw probability check, UTC daily claims, one-time missions, duplicate protection, matching-game reward limits, product prices/counts, free-pack daily limits, bundle promotion, stale opening actions, malformed relay snapshots, UTF-8 headers, chat deduplication, stale room/discovery/publish responses, HTTP 401/429/507 handling and bounded queued relay bursts.
- `npm run build`: **passed**. The current Vite build reports a non-fatal bundle-size advisory: the main JS chunk is approximately 852 KB / 225 KB gzip including React, animations, SDK and the bundled nine-era catalogue. No mobile hardware frame-rate claim is made from this headless run.
- `npm run test:browser`: **passed** at 280×470, 320×530, 360×600, 375×667, 390×700, 430×800 and 768×1024. Every size exercised all navigation destinations, tap and drag ripping, single card reveal, reload recovery, binder filtering/inspection, daily rewards, mission claims and a second pack. No horizontal page overflow or clipped essential reveal controls.
- The same browser suite verified simultaneous purchases in two tabs result in one debit and one set of cards. Separate product cases verified Collector (7), Premium (10), Daily Free (5), and Generation Bundle (15) ownership. Bundle recovery continued all three wrappers, including a reload between pack summaries.
- `npm run test:social`: **passed** with two independent browser contexts and a real local HTTP/WebSocket fixture matching the supplied Game 2 contract. Verified peer presence, disconnect/reconnect recovery, Unicode chat, one-copy echo/history merging, record publication, score submission, saved collectors, independent local wallets/inventories and synchronized rare-pull feed. These fixtures exist only in tests.
- `npm run test:production`: **passed** against compiled `dist/` at 320×530, including official SDK standalone fallback, embedded local artwork/fonts, purchase, reveal and reload recovery. No browser page errors.
- Visual inspection: first-launch portrait home, compact card reveal and stable full-screen card inspector. Screenshots: `docs/screenshots/`.

## Real tunnel limitation

`npm run test:live` tried the supplied host, with game2 throughout:

- Config: HTTP **403**, body `Your request was blocked.`
- Schema: HTTP **403**, body `Your request was blocked.`
- Two-client live relay test: socket connection failed before welcome.

These responses came from this execution environment's access path. They do not independently establish whether the temporary tunnel is currently running or whether its 10× upgrade was deployed. No live multiplayer success is claimed. The API adapter, discovery/recovery and error handling must still be checked inside actual Aippy clients on a reachable network.

## Service boundary

The current relay does not supply authoritative purchase/trade/market transactions. Solo coins, inventories and committed openings therefore remain device-local, protected by IndexedDB transaction ordering. Public showcase records and collection scores are labelled as client-asserted. The Exchange screen clearly marks atomic transfers unavailable. It never pretends two local writes are an authoritative trade.

Original Pokémon artwork remains temporary prototype content, with credits and replacement seams documented in `ASSET-CREDITS.md` and `docs/RESEARCH.md`.
