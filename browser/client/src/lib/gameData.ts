// Cartridge Lab style: source-shaped generation catalogs keep game metadata and editable vocabulary explicit and easy to extend.
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

export type CatalogEntry = { id: string; name: string; category?: string };
export type GenerationCatalog = {
  generation: string;
  games: GameDefinition[];
  moves: CatalogEntry[];
  items: CatalogEntry[];
  keyItems: CatalogEntry[];
};

const spriteUrl = (id: number) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
const games = (generation: string, title: string, platform: string, saveFormats: string[], boxCount: number, speciesCount: number, spriteId: number, description: string): GameDefinition => ({ id: `${generation}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, generation, title, platform, saveFormats, boxCount, speciesCount, spriteId, spriteUrl: spriteUrl(spriteId), description });
const entries = (names: string[], category: string) => names.map((name) => ({ id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, category }));

export const gamesGen1 = [games("I", "Red / Blue / Yellow", "Game Boy / Game Boy Color", [".sav", ".dsv"], 12, 151, 25, "International 32 KiB cartridge saves with PKSM Sav1 / PK1 record layout.")];
export const movesGen1 = entries(["Tackle", "Quick Attack", "Thunderbolt", "Thunder Wave", "Surf", "Ice Beam", "Psychic", "Toxic", "Rest", "Slash", "Hyper Beam"], "Gen I move");
export const itemsGen1 = entries(["Potion", "Super Potion", "Hyper Potion", "Revive", "Antidote", "Paralyze Heal", "Burn Heal", "Ice Heal", "Full Heal", "Rare Candy", "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball"], "Gen I item");
export const keyItemsGen1 = entries(["Bicycle", "Town Map", "Pokédex", "S.S. Ticket", "Itemfinder", "Coin Case", "Old Rod", "Good Rod", "Super Rod"], "Gen I key item");

export const gamesGen2 = [games("II", "Gold / Silver / Crystal", "Game Boy Color", [".sav", ".dsv"], 14, 251, 196, "GB/GBC cartridge saves with PKSM Sav2 / PK2 structures and RTC-aware wrappers.")];
export const movesGen2 = entries(["Tackle", "Gust", "ThunderPunch", "Ice Punch", "Flamethrower", "Surf", "Psychic", "Shadow Ball", "Protect", "Hidden Power", "Return"], "Gen II move");
export const itemsGen2 = entries(["Berry", "Mint Berry", "Gold Berry", "Leftovers", "Quick Claw", "King's Rock", "Exp. Share", "Smoke Ball", "Amulet Coin", "Metal Coat"], "Gen II item");
export const keyItemsGen2 = entries(["Bicycle", "Coin Case", "Itemfinder", "Radio Card", "Map Card", "SquirtBottle", "Clear Bell", "Silver Wing", "Rainbow Wing"], "Gen II key item");

export const gamesGen3 = [games("III", "Ruby / Sapphire / Emerald", "Game Boy Advance", [".sav"], 14, 386, 252, "GBA flash saves using PKSM Sav3 family layouts."), games("III", "FireRed / LeafGreen", "Game Boy Advance", [".sav"], 14, 386, 6, "GBA flash saves using PKSM SavFRLG layout family.")];
export const movesGen3 = entries(["Aerial Ace", "Blaze Kick", "Dragon Claw", "Earthquake", "Facade", "Flamethrower", "Ice Beam", "Protect", "Psychic", "Surf", "Thunderbolt", "Rock Slide"], "Gen III move");
export const itemsGen3 = entries(["Macho Brace", "Choice Band", "Choice Specs", "Shell Bell", "Salac Berry", "Lum Berry", "TM01", "TM13", "TM26", "Poké Ball"], "Gen III item");
export const keyItemsGen3 = entries(["PokéNav", "Mach Bike", "Acro Bike", "Devon Scope", "Go-Goggles", "Old Rod", "Good Rod", "Super Rod", "AuroraTicket"], "Gen III key item");

export const gamesGen4 = [games("IV", "Diamond / Pearl / Platinum", "Nintendo DS", [".sav", ".dsv"], 18, 493, 448, "DS EEPROM saves using PKSM SavDP / SavPT layout families."), games("IV", "HeartGold / SoulSilver", "Nintendo DS", [".sav", ".dsv"], 18, 493, 249, "DS EEPROM saves using PKSM SavHGSS layout family.")];
export const movesGen4 = entries(["Close Combat", "Dark Pulse", "Draco Meteor", "Energy Ball", "Flash Cannon", "Nasty Plot", "Stealth Rock", "Stone Edge", "U-turn", "Waterfall"], "Gen IV move");
export const itemsGen4 = entries(["Choice Scarf", "Life Orb", "Expert Belt", "Focus Sash", "Wise Glasses", "Muscle Band", "Power Lens", "Razor Claw", "Reaper Cloth", "TM24"], "Gen IV item");
export const keyItemsGen4 = entries(["Pokétch", "Vs. Seeker", "Explorer Kit", "Works Key", "SecretPotion", "Old Charm", "Red Chain", "Legendary Orb"], "Gen IV key item");

export const gamesGen5 = [games("V", "Black / White", "Nintendo DS", [".sav", ".dsv"], 24, 649, 643, "DS saves using PKSM SavBW layout family."), games("V", "Black 2 / White 2", "Nintendo DS", [".sav", ".dsv"], 24, 649, 646, "DS saves using PKSM SavB2W2 layout family.")];
export const movesGen5 = entries(["Acrobatics", "Boomburst", "Dragon Tail", "Flame Charge", "Giga Drain", "Hurricane", "Scald", "Scrafty", "Volt Switch", "Wild Charge"], "Gen V move");
export const itemsGen5 = entries(["Eviolite", "Rocky Helmet", "Air Balloon", "Assault Vest", "Red Card", "Ring Target", "Power Herb", "Ability Capsule", "TM06", "Dusk Stone"], "Gen V item");
export const keyItemsGen5 = entries(["Xtransceiver", "C-Gear", "Bicycle", "Shiny Charm", "Oval Charm", "Permit", "Plasma Card", "DNA Splicers"], "Gen V key item");

export const gamesGen6 = [games("VI", "X / Y", "Nintendo 3DS", [".sav", ".bin"], 31, 721, 658, "3DS saves using PKSM SavXY block and checksum structures."), games("VI", "Omega Ruby / Alpha Sapphire", "Nintendo 3DS", [".sav", ".bin"], 31, 721, 719, "3DS saves using PKSM SavORAS block and checksum structures.")];
export const movesGen6 = entries(["Dazzling Gleam", "Fairy Wind", "Moonblast", "Play Rough", "Power-Up Punch", "Parabolic Charge", "Parting Shot", "Petal Blizzard", "Swords Dance", "Throat Chop"], "Gen VI move");
export const itemsGen6 = entries(["Assault Vest", "Fairy Gem", "Gengarite", "Mega Ring", "Safety Goggles", "Weakness Policy", "Pixie Plate", "Gardevoirite", "Key Stone", "TM99"], "Gen VI item");
export const keyItemsGen6 = entries(["Roller Skates", "Holo Caster", "Mega Ring", "Dowsing Machine", "PSS", "Mach Bike", "Acro Bike", "Eon Flute"], "Gen VI key item");

export const gamesGen7 = [games("VII", "Sun / Moon", "Nintendo 3DS", [".sav", ".bin"], 32, 802, 791, "3DS saves using PKSM SavSUMO blocks."), games("VII", "Ultra Sun / Ultra Moon", "Nintendo 3DS", [".sav", ".bin"], 32, 807, 800, "3DS saves using PKSM SavUSUM blocks."), games("VII", "Let’s Go Pikachu / Eevee", "Nintendo Switch", [".sav", ".bin"], 32, 809, 133, "Switch-era saves using PKSM SavLGPE structures.")];
export const movesGen7 = entries(["Behemoth Bash", "Moongeist Beam", "Photon Geyser", "Psychic Terrain", "Spirit Shackle", "Splintered Stormshards", "Sunsteel Strike", "Throat Chop", "Toxic Thread", "Zing Zap"], "Gen VII move");
export const itemsGen7 = entries(["Bottle Cap", "Gold Bottle Cap", "Mimikium Z", "Normalium Z", "Tapunium Z", "Ultranecrozium Z", "Terrain Extender", "Adrenaline Orb", "Comet Shard", "TM100"], "Gen VII item");
export const keyItemsGen7 = entries(["Rotom Pokédex", "Z-Ring", "Ride Pager", "Island Scan", "Fishing Rod", "Nebby", "S.S. Anne Ticket", "Poké Finder"], "Gen VII key item");

export const gamesGen8 = [games("VIII", "Sword / Shield", "Nintendo Switch", [".sav", ".bin"], 32, 905, 887, "Switch saves using PKSM SavSWSH block and encryption-aware structures.")];
export const movesGen8 = entries(["Body Press", "Drum Beating", "Fishious Rend", "Max Airstream", "Steel Beam", "Surging Strikes", "Thunder Cage", "Torch Song", "Triple Axel", "Wave Crash"], "Gen VIII move");
export const itemsGen8 = entries(["Ability Patch", "Armorite Ore", "Choice Band", "Dynamax Band", "Heavy-Duty Boots", "Rusty Sword", "Rusty Shield", "Sachet", "Sweet Apple", "TM00"], "Gen VIII item");
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
