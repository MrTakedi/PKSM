import { mkdir, readFile, writeFile } from "node:fs/promises";

const sourceRoot = "/home/ubuntu/pksm-source";
const outputPath = "/home/ubuntu/pksm-browser/client/src/lib/catalogs.generated.ts";
const englishRoot = `${sourceRoot}/core/strings/eng`;

async function fetchText(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}
function parseCsvRecords(text) {
  const records = [];
  let record = [];
  let current = "";
  let quoted = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index];
    if (char === '"') {
      if (quoted && normalized[index + 1] === '"') { current += '"'; index++; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) {
      record.push(current); current = "";
    } else if (char === "\n" && !quoted) {
      record.push(current); current = "";
      if (record.some((value) => value.length > 0)) records.push(record);
      record = [];
    } else {
      current += char;
    }
  }
  record.push(current);
  if (record.some((value) => value.length > 0)) records.push(record);
  return records;
}
function csvRows(text) {
  const records = parseCsvRecords(text.trim());
  const header = records.shift() || [];
  return records.map((values) => Object.fromEntries(header.map((key, index) => [key, values[index] ?? ""])));
}
function cleanSourceLines(text) { return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean); }
function normalize(value) { return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, ""); }
function parseIntOr(value, fallback = 0) { const parsed = Number.parseInt(value, 10); return Number.isFinite(parsed) ? parsed : fallback; }
function escape(value) { return JSON.stringify(value); }

const [movesCsv, moveFlavorCsv, itemsCsv, itemProseCsv] = await Promise.all([
  fetchText("https://sashimi.storehex.com/PokeAPI/pokeapi/master/data/v2/csv/moves.csv"),
  fetchText("https://sashimi.storehex.com/PokeAPI/pokeapi/master/data/v2/csv/move_flavor_text.csv"),
  fetchText("https://sashimi.storehex.com/PokeAPI/pokeapi/master/data/v2/csv/items.csv"),
  fetchText("https://sashimi.storehex.com/PokeAPI/pokeapi/master/data/v2/csv/item_prose.csv"),
]);
const movesApi = csvRows(movesCsv).filter((row) => row.language_id === undefined || row.language_id === "");
const moveProse = new Map();
for (const row of csvRows(moveFlavorCsv).filter((row) => row.language_id === "9")) {
  if (!moveProse.has(row.move_id)) moveProse.set(row.move_id, (row.flavor_text || "").replace(/[\n\f]+/g, " ").replace(/\s+/g, " ").trim());
}
const itemsApi = csvRows(itemsCsv).filter((row) => row.cost !== undefined);
const itemProse = new Map(csvRows(itemProseCsv).filter((row) => row.local_language_id === "9").map((row) => [row.item_id, row.effect || row.short_effect || ""]));
const moveByName = new Map(movesApi.map((row) => [normalize(row.identifier), row]));
const itemByName = new Map(itemsApi.map((row) => [normalize(row.identifier), row]));

function entry(name, id, description, generation, category) { return `{ id: ${JSON.stringify(id)}, name: ${escape(name)}, description: ${escape(description || "No source description available.")}, generation: ${JSON.stringify(generation)}, category: ${JSON.stringify(category)} }`; }
function parseMoveFile(generation, maxId) {
  return cleanSourceLines(requireText(`${englishRoot}/moves.txt`)).slice(1, maxId + 1).map((name, index) => {
    const id = index + 1;
    const api = moveByName.get(normalize(name));
    return entry(name, `move-${generation.toLowerCase()}-${id}`, api ? moveProse.get(String(api.id)) : "", generation, "move");
  });
}
function requireText(path) { return requireCache.get(path); }
const requireCache = new Map();
for (const path of [`${englishRoot}/moves.txt`, `${englishRoot}/items.txt`, `${englishRoot}/items1.txt`, `${englishRoot}/items2.txt`, `${englishRoot}/items3.txt`]) requireCache.set(path, await readFile(path, "utf8"));
function parseItemFile(fileName, generation) {
  return cleanSourceLines(requireText(`${englishRoot}/${fileName}`)).map((name, index) => {
    const api = itemByName.get(normalize(name.replace(/^\((.*)\)$/, "$1")));
    return entry(name, `item-${generation.toLowerCase()}-${index}`, api ? itemProse.get(String(api.id)) : "", generation, "item");
  });
}
const moveCaps = { I: 165, II: 251, III: 354, IV: 467, V: 559, VI: 728, VII: 826, VIII: 919 };
const generationBlocks = Object.entries(moveCaps).map(([generation, maxId]) => `export const movesGen${generation} = [\n${parseMoveFile(generation, maxId).join(",\n")}\n] as const;`).join("\n\n");
const itemBlocks = [
  ["I", "items1.txt"], ["II", "items2.txt"], ["III", "items3.txt"],
].map(([generation, fileName]) => `export const itemsGen${generation} = [\n${parseItemFile(fileName, generation).join(",\n")}\n] as const;`).join("\n\n");
const modernItems = parseItemFile("items.txt", "IV");
const modernBlocks = ["IV", "V", "VI", "VII", "VIII"].map((generation) => `export const itemsGen${generation} = [\n${parseItemFile("items.txt", generation).join(",\n")}\n] as const;`).join("\n\n");
const sourceMeta = {
  movesSource: "PKSM core/strings/eng/moves.txt",
  itemsSource: "PKSM core/strings/eng/items.txt and items1.txt through items3.txt",
  descriptionsSource: "PokeAPI move_flavor_text.csv and item_prose.csv, English language 9",
  generatedAt: new Date().toISOString(),
};
const output = `// Generated from PKSM string files. Do not hand-edit; rerun parse_pksm_catalogs.mjs.\n// ${JSON.stringify(sourceMeta)}\nexport type GeneratedCatalogEntry = { id: string; name: string; description: string; generation: string; category: string };\n\n${generationBlocks}\n\n${itemBlocks}\n\n${modernBlocks}\n`;
await mkdir("/home/ubuntu/pksm-browser/client/src/lib", { recursive: true });
await writeFile(outputPath, output);
console.log(JSON.stringify({ outputPath, moveCounts: Object.fromEntries(Object.entries(moveCaps).map(([generation, maxId]) => [generation, maxId])), itemCounts: { I: parseItemFile("items1.txt", "I").length, II: parseItemFile("items2.txt", "II").length, III: parseItemFile("items3.txt", "III").length, IV: modernItems.length, V: modernItems.length, VI: modernItems.length, VII: modernItems.length, VIII: modernItems.length }, descriptions: { moves: [...moveProse.values()].filter(Boolean).length, items: [...itemProse.values()].filter(Boolean).length } }));
