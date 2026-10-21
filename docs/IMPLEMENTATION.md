# PACKVERSE implementation

The attached brief is the design authority. User explicitly requests immediate implementation and delegates design decisions. Work in the fresh repository on build/packverse; execute inline.

1. Foundation: React/TS/Vite, official Aippy user hook and Fidget compatibility build plugin. Container-aware portrait shell. Bundle validated TCGdex catalogue across nine eras, fetch/cache optional set refreshes. Separate immutable definitions, variants, owned instances, wallet ledger and committed openings.
2. Game engine: persistent atomic local purchase and ownership grant, idempotent opening IDs, recoverable reveal cursor, weighted prototype slots, guaranteed rare, UTC missions, daily rewards, XP, favourites and duplicate conversion. Test correctness and weighted distributions before UI.
3. Experience: gold/cyan collector identity, foil packs with drag rip and tap alternative, GSAP wrapper choreography, CSS layered card foil, selective tilt, sequential reveals and summary. Motion handles page/dialog transitions. Howler audio generated locally with separate volume preferences and mobile unlock.
4. Collection: multi-era shop, set binder with silhouettes, filters, inspector, duplicate recycling confirmation, achievements, daily/weekly earning.
5. Social: one Game 2 relay manager, direct-profile identity from SDK with persistent browser fallback, chat/history dedupe, hello/snapshot recovery, showcase events, public profile storage, leaderboards, discovery and retry. No server-authoritative transfer endpoint exists: display trading/market boundaries honestly rather than transferring local cards as if atomic.
6. Verification: engine tests, production build, compact browser flow through purchase/rip/reveal/reload/rewards at supplied sizes, two independent clients with protocol fixture; attempt real tunnel tests separately and report inaccessible service. Add Aippy pinned importer manifest and handover; commit and push repository.

Review focus: quota errors preserve local progress; no unverified limits assumed; cross-tab purchase collision; interrupted reveals; UTC claim duplication; unknown remote event validation; identity changes do not upload another player's save; bounded snapshots and payload sizes.

## Final review and verification ledger

- Foundation, catalogue, durable local economy, opening experience, binder, missions and social adapter implemented.
- Authorised scope: user supplied detailed brief and immediate implementation direction; native inline execution on fresh repository branch.
- Ruling: the latest direct-profile identity contract supersedes the older guest-token section. Cost if wrong: change the adapter after inspecting the live schema.
- Ruling: generic shared records cannot provide atomic cross-player trading. Exchange explicitly reports unavailable transfers; no fake marketplace completion is shipped. Cost: transactions require backend capability beyond this relay.
- Independent whole-project review found three Important issues: stale reveal callbacks, stale HTTP scope, and missing product variants. All addressed in one fix pass with failing regression tests followed by the green suite.
- Expected opening ID and cursor are checked in readwrite transactions. Summary/finish cannot alter a newer pack. Bundle grants are committed upfront and subsequent wrappers remain queued durably.
- HTTP requests are aborted and response state is scoped to host, connection generation and player ID. Publish rechecks scope between record and score writes. Small public records respect a discovered budget or conservatively fall back to 512 bytes.
- Product definitions now include Standard, Collector, Premium, Generation Bundle and Daily Free Pack; per-slot pools/weights and legacy fallbacks are disclosed in Odds.
- Live tunnel: config/schema returned HTTP 403 “Your request was blocked”; WebSocket failed from this environment. This is not evidence of the tunnel's actual capacity or live compatibility.
- No deferred review minors.

- Final integrated tests also found a rate limiter that discarded a rare-pull event immediately after a hello update. A bounded 10-per-second outbound queue now coalesces profile refreshes and preserves discrete pull events; regression reproduced RED then GREEN.
- Final suite: 23/23 unit/protocol/lifecycle tests; all seven viewport flows; four additional product cases; two-context social fixture; compiled production smoke test. Full evidence and service limits: `docs/VERIFICATION.md`.

## Version 1.1 continuation

The user's “continue” request extends the published build within the original brief. Added set milestones at 25/50/100 percent (50/100/150 coins), four rare-pull achievements, claim-state persistence in the existing ledger/claims schema, summary progress and duplicate indicators, native sharing/copy fallback, binder routing, and one-transaction repeat purchases. Daily free repeats use the standard product; bundle promotion retains already granted cards.

Actual live discovery was read externally and exposed `store` as an array; the record budget reader now supports that format. The full relay probe was not performed because the remote browser lacked JavaScript execution. No authoritative trade operation appeared in the live schema.

Independent follow-up review found one Important callback regression: a mouse event could be passed as an exit destination. The navigation assertion failed before the fix and passed afterward. No other actionable review findings. Final update checks: 29 unit tests, seven-size browser suite, three-size focused summary/achievement suite, two-player fixture and fresh compiled production smoke. The previous schema/limit uncertainty is narrowed to actual relay exchange and client integration; live discovery fields are now confirmed.
