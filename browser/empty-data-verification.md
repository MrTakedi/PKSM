# Empty-first verification

The default Vite workspace now initializes all 720 storage slots as empty and the inspector shows an empty-slot state until a save or explicit JSON workspace is loaded. The previous localStorage auto-restore behavior is intentionally removed from initialization so a clean build cannot appear populated from stale browser state.

Preview data is opt-in through `VITE_DUMMY_DATA=true pnpm build`, exposed as `pnpm build:dummy`. The dummy build completed successfully. Desktop and mobile screenshots show the empty storage state, import controls, and responsive box grid without seeded Pokémon. Loaded game context remains conditional on a save being loaded.
