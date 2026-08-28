// Cartridge Lab style: source-aligned format metadata keeps binary support claims explicit instead of guessing from a filename.
export type SaveFormatStatus = "recognized-layout" | "family-detected" | "inspection-only";

export type SaveFormat = {
  id: string;
  generation: string;
  label: string;
  reader: string;
  extensions: string[];
  sizes: number[];
  status: SaveFormatStatus;
  editableModel: boolean;
  binaryExport: boolean;
  note: string;
};

export const saveFormats: SaveFormat[] = [
  { id: "gen1-gb", generation: "I", label: "Red / Blue / Yellow", reader: "Sav1 · PK1", extensions: [".sav", ".dsv"], sizes: [0x8000, 0x10000], status: "recognized-layout", editableModel: true, binaryExport: true, note: "International 32 KiB Red/Blue/Yellow saves support in-place box-record export; Japanese and 64 KiB variants remain inspection-only." },
  { id: "gen2-gbc", generation: "II", label: "Gold / Silver / Crystal", reader: "Sav2 · PK2", extensions: [".sav", ".dsv"], sizes: [0x8000, 0x10000], status: "recognized-layout", editableModel: true, binaryExport: false, note: "GB/GBC cartridge SRAM; emulator RTC trailers require preserving the original wrapper." },
  { id: "gen3-gba", generation: "III", label: "Ruby / Sapphire / Emerald / FireRed / LeafGreen", reader: "Sav3 · SavRS · SavE · SavFRLG · PK3", extensions: [".sav"], sizes: [0x20000], status: "recognized-layout", editableModel: true, binaryExport: false, note: "GBA flash layout; game-family recognition needs content validation beyond size." },
  { id: "gen4-ds", generation: "IV", label: "Diamond / Pearl / Platinum / HeartGold / SoulSilver", reader: "Sav4 · SavDP · SavPT · SavHGSS · PK4", extensions: [".sav", ".dsv"], sizes: [0x80000], status: "recognized-layout", editableModel: true, binaryExport: false, note: "DS EEPROM layout; PKSM also unwraps known emulator and dumper trailers." },
  { id: "gen5-ds", generation: "V", label: "Black / White / Black 2 / White 2", reader: "Sav5 · SavBW · SavB2W2 · PK5", extensions: [".sav", ".dsv"], sizes: [0x80000], status: "recognized-layout", editableModel: true, binaryExport: false, note: "DS layout shared by the generation; game-family validation is content-based." },
  { id: "gen6-3ds", generation: "VI", label: "X / Y / Omega Ruby / Alpha Sapphire", reader: "Sav6 · SavXY · SavORAS · PK6", extensions: [".sav", ".bin"], sizes: [], status: "family-detected", editableModel: true, binaryExport: false, note: "3DS save data is variable-sized and needs game-specific block/checksum handling." },
  { id: "gen7-3ds", generation: "VII", label: "Sun / Moon / Ultra Sun / Ultra Moon / LGPE", reader: "Sav7 · SavSUMO · SavUSUM · SavLGPE · PK7", extensions: [".sav", ".bin"], sizes: [], status: "family-detected", editableModel: true, binaryExport: false, note: "3DS/Switch-era layouts use game-specific blocks; LGPE has distinct save behavior." },
  { id: "gen8-switch", generation: "VIII", label: "Sword / Shield", reader: "Sav8 · SavSWSH · PK8", extensions: [".sav", ".bin"], sizes: [0x1716b3, 0x17195e, 0x180b19, 0x180ad0, 0x1876b1, 0x187693, 0x187668, 0x18764a], status: "family-detected", editableModel: true, binaryExport: false, note: "PKSM recognizes multiple versioned Switch save sizes; encrypted block serialization remains format-specific." },
];

export function formatBytes(bytes: number) {
  return `${(bytes / 1024).toFixed(bytes >= 1024 * 1024 ? 2 : 0)} ${bytes >= 1024 * 1024 ? "MiB" : "KiB"}`;
}

export function detectSaveFormat(fileName: string, byteLength: number): SaveFormat | null {
  const extension = `.${fileName.split(".").pop()?.toLowerCase() || ""}`;
  const exact = saveFormats.find((format) => format.sizes.includes(byteLength));
  if (exact) return exact;
  const lowerName = fileName.toLowerCase();
  if (lowerName.includes("swsh") || lowerName.includes("sword") || lowerName.includes("shield")) return saveFormats.find((format) => format.id === "gen8-switch") || null;
  if (lowerName.includes("lgpe") || lowerName.includes("sun") || lowerName.includes("moon") || lowerName.includes("usum")) return saveFormats.find((format) => format.id === "gen7-3ds") || null;
  if (lowerName.includes("oras") || lowerName.includes("omega") || lowerName.includes("alpha") || lowerName.includes("x") || lowerName.includes("y")) return saveFormats.find((format) => format.id === "gen6-3ds") || null;
  return saveFormats.find((format) => format.extensions.includes(extension)) || null;
}

export function formatStatusLabel(status: SaveFormatStatus) {
  return status === "recognized-layout" ? "LAYOUT RECOGNIZED" : status === "family-detected" ? "FAMILY DETECTED" : "INSPECTION ONLY";
}
