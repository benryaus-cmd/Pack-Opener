# Import PACKVERSE into Aippy

Use this repository as the source. The entry component is `src/App.tsx` (default export). This project already includes the official Aippy runtime package and a Vite build transform adapted from Fidget.

## Full standalone import

1. Download the complete snapshot listed in `updates/packverse-1.0.0.json`, using its pinned `baseUrl`.
2. Preserve `src`, `build`, `public`, package configuration, TypeScript and Vite files. Install dependencies from the lockfile.
3. Run `npm run build`. Serve `dist/` or let the Aippy preview/build pipeline serve the Vite project.
4. Keep the `aippyUserCompat()` plugin before React in Vite. It corrects Vite's optimization of the SDK's awaited dynamic-import namespace; it preserves the SDK's existing iframe/native identity handling.
5. Check the imported snapshot version/SHA against the manifest, not a stale staged folder.

## Import into an existing Aippy host application

Use the same staging → validated upstream promotion workflow as Fidget. Suggested destination: `src/games/importedGame/upstream/`.

- Render the upstream default `App` from the existing host's adapter. Keep exactly the host's existing React root; upstream `src/main.tsx` is the standalone entry and is not called by the adapter.
- Import upstream `src/styles/app.css` once. It contains the scoped game shell plus standalone page/desktop styles. For a host with its own outer UI, mount the game into a wrapper with explicit width/height and scope the global `html,body,#root`/`.desktop-scene` rules to the host game surface as needed.
- The full game expects a real available container. Its `game-root` is 100% height with container queries; ensure the adapter and parent each have `height:100%`, `min-height:0` or an explicit game region height. Do not let a flex parent's automatic min-height expand beyond the iframe.
- Copy upstream `public/cards` and `public/fonts` into the host's public directory. Preserve all image/font bytes. Text files use UTF-8; `.webp` and `.woff2` downloads must use binary bytes (`arrayBuffer`/Buffer), not `response.text()`.
- `src/game/catalogue.ts` enumerates `/public/cards/*.webp` at build time and uses `import.meta.env.BASE_URL` for local assets. Keep that public-directory layout or adjust the adapter's asset resolver.
- Upstream source uses relative imports. Preserve the parent application's own `@/` alias for its files. If later adding upstream aliases, resolve them to upstream `src`, following Fidget's importer separation.
- Install `@aippy/runtime`, React/ReactDOM, `lucide-react`, `gsap`, `motion` and `howler` in the host if needed. Use one shared React installation.
- Keep the upstream SDK compatibility plugin in the host Vite pipeline if that Vite/runtime combination requires it.

## Game 2 integration

The slot is hard-coded as `game2` in `src/services/protocol.ts`. Initial server:

`https://particular-gasoline-corrected-declared.trycloudflare.com`

Change the host in Social → Server & room when the tunnel rotates. Game 2 remains unchanged.

The latest supplied identity flow takes precedence over the older `/guest` example. The game waits for `useUserInfo().isLoading === false`, hashes the UID into a stable `a_` application ID (or retains a standalone `b_` ID), and sends the server's documented UTF-8 base64url profile header. These are unverified client-asserted profiles. No bearer generation or external authentication service is added.

The client requests `/config` and `/api/v1/schema`. It uses small relay payloads and publishes compact showcase records, never full inventory blobs. Local IndexedDB owns solo wallet/inventory; the generic server schemas are not treated as an atomic trading backend.

## Acceptance in the actual Aippy webview

Test two separate Aippy accounts/devices in the same host and room:

1. Each shows its own nickname/avatar and its own collection.
2. Presence shows both collectors; reconnect restores the peer profile.
3. A chat message appears once on both sides and remains after reconnect.
4. A rare reveal appears in the other player's feed.
5. Publishing stores the real showcase under Game 2 and submits the unique-card score.
6. Restarting the webview restores local currency, cards and an unfinished reveal.
7. Confirm ripping, modal dismissal and the five navigation destinations at 280×470 and 320×530 available game-area sizes.
8. Verify the actual live schema/config limits and error behavior. This build's automated local contract tests do not certify the temporary tunnel.

## Suggested Aippy build instruction

Import the complete pinned PACKVERSE snapshot from this repository and render its default App using the existing imported-game adapter. Preserve the current host root, identity/runtime integration and staging promotion flow. Copy binary public card/font assets intact, install the listed dependencies and keep the SDK compatibility Vite plugin. Use game2 and the current tunnel in Social settings. Validate both players, chat, rare-pull synchronization, profile publication, rankings and reload recovery on the live service. Keep the real solo opening/collecting/earning loop usable while offline. The Exchange screen accurately reflects the current server's unavailable atomic-transfer capability.
