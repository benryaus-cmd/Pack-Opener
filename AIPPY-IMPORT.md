# Update the existing Aippy PACKVERSE

Use [the complete update prompt](updates/AIPPY-PROMPT-1.2.md) and [the pinned 1.2 manifest](updates/packverse-1.2.0.json).

The supplied ZIP has one active imported game. Outer `src/App.tsx` renders `src/games/importedGame/ImportedGame.tsx`, which renders `src/games/importedGame/upstream/src/App.tsx`. Preserve that adapter and one React root.

The manifest's four `hostFiles` replace the existing root importer, patch validator, CSS scoper and outer App. They keep the existing Vite plugin integrations and SDK/audio/score/file-viewer callbacks. The outer App change removes the floating Project Files button and opens the viewer from Settings → **temp save** only after code **1234**. This is a local convenience lock.

The normal Vite build then downloads the 166 `files` as bytes using `manifest.baseUrl + source`, verifies sizes/hashes, stages and promotes the snapshot to `src/games/importedGame/upstream/`, and syncs public card/font assets. Manifest targets are relative to this upstream directory. The canonical source already includes host callbacks and browser UUID compatibility; old string-replacement patches are replaced by validation. All game CSS files are scoped by the updated host plugin. Keep the host Vite config and existing plugins, including single-file bundling and Aippy identity compatibility loader.

The game automatically connects to the supplied backend in **game2** after Aippy identity resolves. Browser preview uses a persistent browser ID. Direct-profile HTTP writes use `X-Player-Profile`; the official SDK handles Aippy identity. Social → Server & room changes a rotated tunnel address. Local IndexedDB save keys and currency/ownership remain compatible with 1.1.

Actual Aippy platform import remains a separate action performed in Aippy. Local verification recreates the supplied host and builds/loads its real adapter and single-file production output; the existing temporary relay itself remains an externally reachable dependency.

See [scope and integration](docs/UPDATE-1.2.md) and [verification](docs/VERIFICATION-1.2.md).
