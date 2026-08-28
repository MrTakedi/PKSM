// Cartridge Lab performance boundary: generated move/item prose stays out of the initial bundle and is hydrated on demand.
import { hydrateGenerationCatalogs, hydrateOfflineCatalogs, type GeneratedCatalogSets } from "./gameData";
import { offlineCatalogs } from "./catalogs.offline";

let catalogPromise: Promise<void> | null = null;

export function loadOfflineCatalogs() {
  hydrateOfflineCatalogs(offlineCatalogs);
}

export function loadCatalogs(): Promise<void> {
  if (!catalogPromise) {
    catalogPromise = import("./catalogs.generated").then((generated) => {
      const catalogs: GeneratedCatalogSets = {
        I: { moves: generated.movesGenI, items: generated.itemsGenI },
        II: { moves: generated.movesGenII, items: generated.itemsGenII },
        III: { moves: generated.movesGenIII, items: generated.itemsGenIII },
        IV: { moves: generated.movesGenIV, items: generated.itemsGenIV },
        V: { moves: generated.movesGenV, items: generated.itemsGenV },
        VI: { moves: generated.movesGenVI, items: generated.itemsGenVI },
        VII: { moves: generated.movesGenVII, items: generated.itemsGenVII },
        VIII: { moves: generated.movesGenVIII, items: generated.itemsGenVIII },
      };
      hydrateGenerationCatalogs(catalogs);
    }).catch((error) => {
      catalogPromise = null;
      throw error;
    });
  }
  return catalogPromise;
}
