Update the CURRENT PACKVERSE game using its existing build-time GitHub importer.

MANIFEST:
https://raw.githubusercontent.com/benryaus-cmd/Pack-Opener/main/updates/packverse-1.2.0.json

Expected version: packverse-1.2.0
Game slot: game2

Read the manifest, then download its four hostFiles using manifest.baseUrl + source and replace their exact host target paths. They update:
- vite-plugin-github-import.ts
- packverse-host-patches.ts
- vite-plugin-packverse-css.ts
- src/App.tsx

These are adapted from this game's downloaded Aippy project. Keep the current Vite configuration and plugin order, Aippy SDK plugins, aippyUserCompatibility loader, single-file bundling, ProjectFileViewer, game boundary, and ImportedGame adapter. The outer App keeps its existing startup, SDK music/score and viewer integration while removing the floating Project Files overlay. Settings now says “temp save”; code 1234 unlocks the viewer.

During the normal Vite build, use the updated importer to download all 166 manifest.files using manifest.baseUrl + source as bytes, check their hashes, and promote them to src/games/importedGame/upstream/ using the manifest's relative targets. Sync public assets through the existing importer. Keep the host's one React root and render ImportedGame → upstream/src/App.tsx. Preserve saved coins, XP, purchases, card instances, showcases, settings, unfinished packs and all unrelated host files.

Build and load PACKVERSE. Verify compact returning Home, direct Earn Coins, four-column era binders, 4x3 matching/three lives, slots and coin drop, preloaded card art, larger swipe reveals, right-swipe showcase feedback, price references, default tilt/glare, automatic Game 2 presence/chat, and mutually confirmed live card trades. Verify Settings → temp save rejects an incorrect code and opens the viewer with 1234; the floating overlay button is gone.

Report host replacements 4/4, game downloads 166/166, replacements 166/166, actual build/loading result, one active game root, and any live-server limitations observed. Test two independent collectors for chat, trade offers, matching confirmations and reload recovery.
