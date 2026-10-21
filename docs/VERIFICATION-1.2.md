# PACKVERSE 1.2 verification — 21 October 2026

- Production TypeScript/Vite build: passed.
- Pure engine/network/pricing tests: 40 passed.
- Trade service browser regressions: 8 passed, including incompatible confirmations, durable declines, terminal packet replay, and profile switches during network/local writes.
- Two independent browser profiles with a real local HTTP/WebSocket fixture: automatic presence, chat dedupe/history, profiles, rankings, friends, confirmed exchange, partner reload before confirmation, completed inventory reload, and synchronized rare pull passed. Uses Game 2 paths only.
- Phone browser checks at 280×530 and 390×700: splash dismissal, direct Earn Coins, four-column binder, 12 matching cards/three-life loss, default sensor rotation and changing glare passed.
- Focused opening checks at 280×470 and 390×700: both image-resolution requests, full card/control bounds, left swipe next, right swipe showcase and explicit feedback passed.
- Standalone production bundle at 320×530: purchase, reveal and reload recovery passed.
- Supplied Aippy host: normal importer downloaded and promoted 166/166 commit-pinned GitHub files, all checksum-verified; original Vite 8 build with SDK plugins, CSS scoping, single-file output and unchanged ImportedGame adapter passed. Host replacements matched 4/4 pinned checksums. Actual production host loaded with one active game root. Settings temp save is code-gated and the floating recovery button is removed.

The local protocol fixture exercises actual independent clients and actual WebSocket messages. It is not a replacement production backend. Live config/schema were previously fetched from the supplied temporary tunnel; live two-player transport to that external tunnel was not verified from this environment. On-device iOS orientation permission and actual Aippy account identity require the platform environment. Market values/images depend on external providers; missing data is presented as unavailable. Trades use cooperative client-asserted ownership and per-device settlement as documented in UPDATE-1.2.
