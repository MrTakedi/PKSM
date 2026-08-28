// Cartridge Lab style: generation-scoped metadata stays explicit while large move/item catalogs are generated from PKSM strings.
import {
  itemsGenI as generatedItemsGen1,
  itemsGenII as generatedItemsGen2,
  itemsGenIII as generatedItemsGen3,
  itemsGenIV as generatedItemsGen4,
  itemsGenV as generatedItemsGen5,
  itemsGenVI as generatedItemsGen6,
  itemsGenVII as generatedItemsGen7,
  itemsGenVIII as generatedItemsGen8,
  movesGenI as generatedMovesGen1,
  movesGenII as generatedMovesGen2,
  movesGenIII as generatedMovesGen3,
  movesGenIV as generatedMovesGen4,
  movesGenV as generatedMovesGen5,
  movesGenVI as generatedMovesGen6,
  movesGenVII as generatedMovesGen7,
  movesGenVIII as generatedMovesGen8,
} from "./catalogs.generated";

export type GameDefinition = {
  id: string;
  generation: string;
  title: string;
  platform: string;
  saveFormats: string[];
  boxCount: number;
  speciesCount: number;
  spriteId: number;
  spriteUrl: string;
  description: string;
};

export type CatalogEntry = { id: string; name: string; description?: string; category?: string };
export type GenerationCatalog = {
  generation: string;
  games: GameDefinition[];
  moves: CatalogEntry[];
  items: CatalogEntry[];
  keyItems: CatalogEntry[];
};

const spriteUrl = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const games = (generation: string, title: string, platform: string, saveFormats: string[], boxCount: number, speciesCount: number, spriteId: number, description: string): GameDefinition => ({ id: `${generation}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, generation, title, platform, saveFormats, boxCount, speciesCount, spriteId, spriteUrl: spriteUrl(spriteId), description });
const entries = (names: string[], category: string): CatalogEntry[] => names.map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, category }));

export const gamesGen1 = [games("I", "Red / Blue / Yellow", "Game Boy / Game Boy Color", [".sav", ".dsv"], 12, 151, 25, "International 32 KiB cartridge saves with PKSM Sav1 / PK1 record layout.")];
export const movesGen1: CatalogEntry[] = [...generatedMovesGen1];
export const itemsGen1: CatalogEntry[] = [...generatedItemsGen1];
export const keyItemsGen1 = entries(["Bicycle", "Town Map", "Pokédex", "S.S. Ticket", "Itemfinder", "Coin Case", "Old Rod", "Good Rod", "Super Rod"], "Gen I key item");

export const gamesGen2 = [games("II", "Gold / Silver / Crystal", "Game Boy Color", [".sav", ".dsv"], 14, 251, 196, "GB/GBC cartridge saves with PKSM Sav2 / PK2 structures and RTC-aware wrappers.")];
export const movesGen2: CatalogEntry[] = [...generatedMovesGen2];
export const itemsGen2: CatalogEntry[] = [...generatedItemsGen2];
export const keyItemsGen2 = entries(["Bicycle", "Coin Case", "Itemfinder", "Radio Card", "Map Card", "SquirtBottle", "Clear Bell", "Silver Wing", "Rainbow Wing"], "Gen II key item");

export const gamesGen3 = [games("III", "Ruby / Sapphire / Emerald", "Game Boy Advance", [".sav"], 14, 386, 252, "GBA flash saves using PKSM Sav3 family layouts."), games("III", "FireRed / LeafGreen", "Game Boy Advance", [".sav"], 14, 386, 6, "GBA flash saves using PKSM SavFRLG layout family.")];
export const movesGen3: CatalogEntry[] = [...generatedMovesGen3];
export const itemsGen3: CatalogEntry[] = [...generatedItemsGen3];
export const keyItemsGen3 = entries(["PokéNav", "Mach Bike", "Acro Bike", "Devon Scope", "Go-Goggles", "Old Rod", "Good Rod", "Super Rod", "AuroraTicket"], "Gen III key item");

export const gamesGen4 = [games("IV", "Diamond / Pearl / Platinum", "Nintendo DS", [".sav", ".dsv"], 18, 493, 448, "DS EEPROM saves using PKSM SavDP / SavPT layout families."), games("IV", "HeartGold / SoulSilver", "Nintendo DS", [".sav", ".dsv"], 18, 493, 249, "DS EEPROM saves using PKSM SavHGSS layout family.")];
export const movesGen4: CatalogEntry[] = [...generatedMovesGen4];
export const itemsGen4: CatalogEntry[] = [...generatedItemsGen4];
export const keyItemsGen4 = entries(["Pokétch", "Vs. Seeker", "Explorer Kit", "Works Key", "SecretPotion", "Old Charm", "Red Chain", "Legendary Orb"], "Gen IV key item");

export const gamesGen5 = [games("V", "Black / White", "Nintendo DS", [".sav", ".dsv"], 24, 649, 643, "DS saves using PKSM SavBW layout family."), games("V", "Black 2 / White 2", "Nintendo DS", [".sav", ".dsv"], 24, 649, 646, "DS saves using PKSM SavB2W2 layout family.")];
export const movesGen5: CatalogEntry[] = [...generatedMovesGen5];
export const itemsGen5: CatalogEntry[] = [...generatedItemsGen5];
export const keyItemsGen5 = entries(["Xtransceiver", "C-Gear", "Bicycle", "Shiny Charm", "Oval Charm", "Permit", "Plasma Card", "DNA Splicers"], "Gen V key item");

export const gamesGen6 = [games("VI", "X / Y", "Nintendo 3DS", [".sav", ".bin"], 31, 721, 658, "3DS saves using PKSM SavXY block and checksum structures."), games("VI", "Omega Ruby / Alpha Sapphire", "Nintendo 3DS", [".sav", ".bin"], 31, 721, 719, "3DS saves using PKSM SavORAS block and checksum structures.")];
export const movesGen6: CatalogEntry[] = [...generatedMovesGen6];
export const itemsGen6: CatalogEntry[] = [...generatedItemsGen6];
export const keyItemsGen6 = entries(["Roller Skates", "Holo Caster", "Mega Ring", "Dowsing Machine", "PSS", "Mach Bike", "Acro Bike", "Eon Flute"], "Gen VI key item");

export const gamesGen7 = [games("VII", "Sun / Moon", "Nintendo 3DS", [".sav", ".bin"], 32, 802, 791, "3DS saves using PKSM SavSUMO blocks."), games("VII", "Ultra Sun / Ultra Moon", "Nintendo 3DS", [".sav", ".bin"], 32, 807, 800, "3DS saves using PKSM SavUSUM blocks."), games("VII", "Let’s Go Pikachu / Eevee", "Nintendo Switch", [".sav", ".bin"], 32, 809, 133, "Switch-era saves using PKSM SavLGPE structures.")];
export const movesGen7: CatalogEntry[] = [...generatedMovesGen7];
export const itemsGen7: CatalogEntry[] = [...generatedItemsGen7];
export const keyItemsGen7 = entries(["Rotom Pokédex", "Z-Ring", "Ride Pager", "Island Scan", "Fishing Rod", "Nebby", "S.S. Anne Ticket", "Poké Finder"], "Gen VII key item");

export const gamesGen8 = [games("VIII", "Sword / Shield", "Nintendo Switch", [".sav", ".bin"], 32, 905, 887, "Switch saves using PKSM SavSWSH block and encryption-aware structures.")];
export const movesGen8: CatalogEntry[] = [...generatedMovesGen8];
export const itemsGen8: CatalogEntry[] = [...generatedItemsGen8];
export const keyItemsGen8 = entries(["Rotom Bike", "Flying Taxi", "Dynamax Band", "Wishing Piece", "Armor Pass", "Crown Pass", "Sonia's Book", "Master Dojo Card"], "Gen VIII key item");

export const generationCatalogs: GenerationCatalog[] = [
  { generation: "I", games: gamesGen1, moves: movesGen1, items: itemsGen1, keyItems: keyItemsGen1 },
  { generation: "II", games: gamesGen2, moves: movesGen2, items: itemsGen2, keyItems: keyItemsGen2 },
  { generation: "III", games: gamesGen3, moves: movesGen3, items: itemsGen3, keyItems: keyItemsGen3 },
  { generation: "IV", games: gamesGen4, moves: movesGen4, items: itemsGen4, keyItems: keyItemsGen4 },
  { generation: "V", games: gamesGen5, moves: movesGen5, items: itemsGen5, keyItems: keyItemsGen5 },
  { generation: "VI", games: gamesGen6, moves: movesGen6, items: itemsGen6, keyItems: keyItemsGen6 },
  { generation: "VII", games: gamesGen7, moves: movesGen7, items: itemsGen7, keyItems: keyItemsGen7 },
  { generation: "VIII", games: gamesGen8, moves: movesGen8, items: itemsGen8, keyItems: keyItemsGen8 },
];

export function catalogForGeneration(generation?: string) {
  return generationCatalogs.find((catalog) => catalog.generation === generation) || generationCatalogs[0];
}

export function catalogEntryForName(entriesList: CatalogEntry[], name?: string) {
  return entriesList.find((entry) => entry.name === name);
}
