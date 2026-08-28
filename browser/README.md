# PKSM Browser workspace

This directory contains the browser-first React workspace derived from PKSM’s generation-aware reader taxonomy and 3DS editor terminology. It is a static frontend and can be hosted independently.

The current release includes source-aligned layout recognition and family detection for Gen I–VIII file families, plus local workspace editing and JSON round-trip export. Binary editing and export remain explicitly disabled until each adapter has been ported and fixture-tested; see `COMPATIBILITY.md`.

Run `pnpm install` and `pnpm dev` from this directory to develop locally. The frontend does not require PHP or a server-side runtime.
