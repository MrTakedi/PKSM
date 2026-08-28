// Cartridge Lab offline fallback: intentionally small, dependency-free names for basic editing without the full generated chunk.
import type { CatalogEntry } from "./gameData";

const moveNames = ["Tackle", "Growl", "Tail Whip", "Leer", "Quick Attack", "Protect", "Thunderbolt", "Thunder Wave", "Surf", "Ice Beam", "Flamethrower", "Psychic", "Shadow Ball", "Earthquake", "Rock Slide", "Brick Break", "Swords Dance", "Calm Mind", "Recover", "Rest", "Substitute", "Bite", "Water Gun", "Vine Whip", "Ember", "Gust", "Double Team", "Hyper Beam"];
const itemNames = ["Potion", "Super Potion", "Hyper Potion", "Max Potion", "Full Restore", "Revive", "Max Revive", "Antidote", "Paralyze Heal", "Burn Heal", "Ice Heal", "Awakening", "Full Heal", "Rare Candy", "Poké Ball", "Great Ball", "Ultra Ball", "Master Ball", "Escape Rope", "Repel", "Max Repel", "Super Repel", "Leftovers", "Focus Sash", "Lum Berry", "Light Ball", "Mystic Water", "Charcoal", "Miracle Seed", "Never-Melt Ice"];

const entries = (names: string[], category: string): CatalogEntry[] => names.map((name, index) => ({ id: `offline-${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${index + 1}`, name, category }));

export const offlineCatalogs: Record<string, { moves: CatalogEntry[]; items: CatalogEntry[] }> = Object.fromEntries(
  ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"].map((generation) => [generation, {
    moves: entries(moveNames, `Gen ${generation} offline move`),
    items: entries(itemNames, `Gen ${generation} offline item`),
  }]),
);
