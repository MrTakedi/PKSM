# Source-derived move and item catalogs

- [x] Locate PKSM localized move, item, and key-item string resources and identify their identifier order.
- [x] Parse the source strings into normalized generation-aware catalog records with descriptions.
- [x] Replace abbreviated move and item arrays while preserving generation boundaries and source provenance.
- [x] Add catalog browsing/details to the loaded-game context and editor without overwhelming the workspace.
- [x] Validate counts, duplicate identifiers, missing descriptions, TypeScript/build output, and responsive presentation.
- [ ] Commit and push the expanded catalog milestone to the GitHub feature branch.
- [x] Replace raw GitHub sprite URLs with the CORS-compatible Sashimi PokeAPI mirror.

## Sources and regeneration

The checked-in `parse_pksm_catalogs.mjs` script reads the PKSM English string files from the local PKSM source checkout, joins move names to PokeAPI’s `moves.csv` and English `move_flavor_text.csv`, and joins item names to `items.csv` and English `item_prose.csv`. It writes `client/src/lib/catalogs.generated.ts`; rerun it after updating the source checkout, then run `pnpm run check && pnpm run build`.

The generated catalogs preserve PKSM’s generation-specific move boundaries (I–VIII), retain the per-generation item arrays, and include source descriptions where PokeAPI provides them. Key-item arrays remain curated generation metadata because the PKSM string resources do not expose the same stable item-description join used for regular items.
