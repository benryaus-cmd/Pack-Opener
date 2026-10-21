# PACKVERSE 1.2 — experience update

The supplied Aippy ZIP runs `src/games/importedGame/ImportedGame.tsx`, which renders `./upstream/src/App`. The outer `src/App.tsx` owns the host root, loading boundary, SDK music, score observer, and Project Files. The update replaces the upstream snapshot and preserves that adapter and host.

## Implemented

- Compact returning Home; dismissible first-visit hero, recent pulls, rewards, and direct Earn Coins.
- Four-column phone binder; nine era binders with chronological expansion sections and filters. 124 English expansions / 16,977 printed cards. Original nine set records and all IDs preserved. Kanto covers species 1–151 through Base, Jungle, Fossil, Team Rocket and era releases.
- Reliable remote compressed TCGdex thumbnails, low/high preloading when a purchased opening mounts, larger reveals, official Pokémon reverse, emerging/shuffling deck, swipe next, right-swipe showcase with saved feedback, rarity/foil/price celebration, and informational USD/EUR market references where supplied by TCGdex.
- Default sensor tilt with up to 30° rotation and sensor-driven glare. iOS grants orientation permission from its explicit button; touch/mouse control remains available.
- Collector’s Eye: 12 cards, six pairs, four columns, three lives. Existing reward cooldown/limits remain.
- Lucky Reels and Coin Drop: five-coin stakes, bounded payouts, exact visible odds, atomic debit/settlement, replay protection. Virtual coins only.
- Automatic Game 2 connection/reconnection using Aippy identity. Compact social UI, top-layer chat shortcut, online collectors, trade invitations in chat, saved latest notable-pull feeds.
- Live cards-only trades, 1–3 cards per collector. Both collectors confirm identical terms. Local reservations prevent recycling/trading a confirmed outgoing instance. Durable per-player trading records and local journals recover interrupted confirmation; terminal journals prevent replay.

## Trading scope

The existing server relays client events and stores client-asserted JSON. Each device applies its own exchange exactly once after observing matching durable confirmations. This is a practical cooperative live-trade protocol, not an authoritative cross-device database transaction. Local saves remain device-specific. A confirmed trade waits for its peer or peer decline and attempts recovery while connected; server record expiry or cleared device saves can prevent recovery. No ownership/security claim beyond the supplied framework is made.

## Import integration

The original importer hard-coded version 1.1, 150 files, and source-string patches. Those patches no longer match the updated components. Replacement host helper sources are supplied in `build/aippy-host/`:

1. `vite-plugin-github-import.ts` — same staged, hash-checked importer, updated release/count.
2. `packverse-host-patches.ts` — validates the now-native host callback and UUID helper, without rewriting tested source.
3. `vite-plugin-packverse-css.ts` — scopes every new game stylesheet as well as app.css.

The fourth host source, `App.tsx.txt`, targets the outer `src/App.tsx`: it removes the floating viewer overlay and routes the Settings **temp save** button through code **1234**. Copy these four files to the same exact root host filenames. Existing Vite imports and plugin order continue to work. Preserve the host’s `ImportedGame.tsx`, outer App, SDK plugins, single-file bundling, compatibility loader, music, score integration and Project Files. The manifest targets are relative to the upstream snapshot; the existing importer promotes them to `src/games/importedGame/upstream/` and syncs public assets. Standalone `src/main.tsx` remains a bootstrap file in the snapshot, not an executed host entry point.
