# PKSM Gen I–VIII format audit

PKSM exposes generation-specific Pokémon containers `PK1` through `PK8` and save classes including `Sav1` through `Sav8`, plus game-specific classes such as `SavRS`, `SavE`, `SavFRLG`, `SavDP`, `SavPT`, `SavHGSS`, `SavBW`, `SavB2W2`, `SavXY`, `SavORAS`, `SavSUMO`, `SavUSUM`, `SavLGPE`, and `SavSWSH`.

The source also contains `SaveRecognition.cpp`, which recognizes physical save layouts by byte length and emulator/dumper padding/trailers. This means “Gen I–VIII support” is not one uniform format: each generation has multiple game-family layouts and generation-specific record encodings.

The current browser app is a React static frontend and does not yet contain binary parsers or serializers. Existing file import is inspection-only and existing workspace export is a versioned JSON application format. Any binary support added here must be claimed per format and validated through round-trip fixtures; unsupported binary files must not be exported as if they were safe game saves.

Initial implementation recommendation: add a format-aware compatibility registry and truthful status UI first, then implement one adapter at a time with fixtures. A complete Gen I–VIII binary implementation cannot be responsibly represented by the current mock record model alone.
