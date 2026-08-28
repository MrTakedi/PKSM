# Gen I adapter verification

The supplied populated international Red fixture is recognized as a 32 KiB Gen I save. The browser adapter parsed one stored Box 01 record, preserved its source offset and nickname buffer, serialized an edited nickname (`TESTMON`), level (`25`), and Gen I move IDs (`Toxic`, `Quick Attack`), then reparsed the exported bytes successfully.

The adapter recalculated PKSM-style `diff8` checksum bytes for the main data and both box banks. Export remains guarded to in-place edits because cross-slot relocation and party synchronization are not yet serialized from the browser’s 24×30 workspace model. Held items, abilities, and modern metadata are not representable in Gen I saves and are explicitly omitted.

Desktop and mobile screenshots show the existing workbench remains stable; the export control collapses to the mobile header icon as designed.
