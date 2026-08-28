# PKSM Browser compatibility architecture

PKSM Browser now carries a source-aligned format registry and a browser port of PKSM’s save-layout recognition boundary. The registry maps the PKSM reader families `Sav1` through `Sav8`, the game-specific readers, and the Pokémon containers `PK1` through `PK8` into explicit generation labels. The layout recognizer handles PKSM’s canonical GB/GBC, GBA, and DS raw sizes, known DeSmuME trailers, RTC trailers, and repeated-byte dumper padding.

The current browser editor remains a local workspace editor. Binary files are read locally and classified when their name or physical layout matches a source-backed family, but binary mutation and serialization are not claimed until a generation adapter has been ported and validated against fixtures. The portable `pksm-browser-storage` JSON format remains the safe round-trip export for the current UI model.

This boundary is deliberate: PKSM’s 3DS and Switch readers include game-specific encrypted blocks, checksums, and versioned layouts. A future adapter should expose `read(bytes) -> normalized records + metadata` and `write(normalized records + metadata) -> bytes`, preserve unknown blocks, recalculate checksums, and ship with fixture-based round-trip tests before its `binaryExport` flag is enabled.

The interface terminology follows the 3DS application’s editor vocabulary and source string families: local save, storage, editor, stats, moves, held item, verify/legalize, save invalid, wrong size, and inspection-only states. The current Cartridge Lab visual system keeps that information hierarchy while remaining browser-first and self-hostable.
