// Cartridge Lab style: an asymmetric local-first workbench with indexed labels, technical metadata, and teal selection signals.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Archive,
  AlertTriangle,
  ArrowDownToLine,
  ChevronDown,
  CircleHelp,
  Download,
  FileArchive,
  FileUp,
  FolderOpen,
  HardDrive,
  Info,
  LayoutGrid,
  Library,
  LockKeyhole,
  Menu,
  Moon,
  MoreHorizontal,
  PanelRight,
  Pencil,
  Save,
  Search,
  Sun,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { nationalPokedex } from "@/lib/pokedex";
import { detectSaveFormat, formatStatusLabel, type SaveFormat } from "@/lib/saveFormats";
import { layoutLabel, recognizeSaveLayout, type SaveLayout } from "@/lib/saveLayouts";
import { applyGen1RecordEdit, isGen1International, parseGen1Save, serializeGen1Save, type Gen1BinarySave } from "@/lib/gen1Adapter";
import { catalogForGeneration, generationCatalogs, type GameDefinition } from "@/lib/gameData";

type PokemonRecord = {
  id: number;
  box: number;
  slot: number;
  species: string;
  nickname: string;
  level: number;
  type: string;
  nature: string;
  ability: string;
  heldItem: string;
  gender?: "male" | "female" | "unknown";
  stats?: { hp: number; attack: number; defense: number; spAtk: number; spDef: number; speed: number };
  moves?: string[];
  shiny: boolean;
  color: string;
  initials: string;
  status: "ready" | "edited" | "empty";
  spriteId?: number;
  binarySource?: { box: number; slot: number; sourceOffset: number; nicknameOffset: number };
};

const seedRecords: Omit<PokemonRecord, "box" | "slot">[] = [
  { id: 1, species: "Pikachu", nickname: "SPARK", level: 42, type: "Electric", nature: "Jolly", ability: "Static", heldItem: "Light Ball", shiny: false, color: "#e9b83f", initials: "PI", status: "ready" },
  { id: 2, species: "Gardevoir", nickname: "SAGE", level: 58, type: "Psychic / Fairy", nature: "Modest", ability: "Synchronize", heldItem: "—", shiny: true, color: "#9b7eb2", initials: "GA", status: "ready" },
  { id: 3, species: "Gyarados", nickname: "TIDAL", level: 37, type: "Water / Flying", nature: "Adamant", ability: "Intimidate", heldItem: "Mystic Water", shiny: false, color: "#4f83bd", initials: "GY", status: "edited" },
  { id: 4, species: "Umbreon", nickname: "NOCTURNE", level: 61, type: "Dark", nature: "Careful", ability: "Synchronize", heldItem: "Leftovers", shiny: false, color: "#4e5969", initials: "UM", status: "ready" },
  { id: 5, species: "Lucario", nickname: "AURA", level: 50, type: "Fighting / Steel", nature: "Timid", ability: "Inner Focus", heldItem: "Focus Sash", shiny: false, color: "#50758b", initials: "LU", status: "ready" },
  { id: 6, species: "Dragonite", nickname: "SKYLINE", level: 73, type: "Dragon / Flying", nature: "Careful", ability: "Multiscale", heldItem: "Lum Berry", shiny: false, color: "#d48a42", initials: "DR", status: "ready" },
  { id: 7, species: "Bulbasaur", nickname: "MOSS", level: 16, type: "Grass / Poison", nature: "Calm", ability: "Overgrow", heldItem: "—", shiny: false, color: "#6b9a6c", initials: "BU", status: "ready" },
  { id: 8, species: "Eevee", nickname: "PATCH", level: 24, type: "Normal", nature: "Bashful", ability: "Run Away", heldItem: "—", shiny: false, color: "#ad815f", initials: "EE", status: "ready" },
];

const genderForIndex: PokemonRecord["gender"][] = ["male", "female", "male", "male", "male", "male", "female", "unknown"];
const firstBoxRecords = seedRecords.map((record, index) => ({ ...record, box: 1, slot: index + 1, gender: genderForIndex[index], spriteId: [25, 282, 130, 197, 448, 149, 1, 133][index] }));
const allSlots = Array.from({ length: 24 * 30 }, (_, index) => {
  const box = Math.floor(index / 30) + 1;
  const slot = (index % 30) + 1;
  return { id: index + 1, box, slot, species: "Empty slot", nickname: "", level: 0, type: "—", nature: "—", ability: "—", heldItem: "—", shiny: false, color: "#d9d3c5", initials: "", status: "empty" as const };
});
const emptyRecords: PokemonRecord[] = allSlots;
const dummyRecords: PokemonRecord[] = allSlots.map((slot) => firstBoxRecords.find((record) => record.slot === slot.slot && record.box === slot.box) || slot);
const dummyDataEnabled = import.meta.env.VITE_DUMMY_DATA === "true";

type LegalityIssue = { field: string; message: string; severity: "warning" | "error" };

function getLegalityIssues(record: PokemonRecord, generation = "VIII"): LegalityIssue[] {
  const issues: LegalityIssue[] = [];
  if (record.level < 1 || record.level > 100) issues.push({ field: "level", message: "Level must be between 1 and 100.", severity: "error" });
  const stats = record.stats || { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 };
  Object.entries(stats).forEach(([key, value]) => {
    if (value < 0 || value > 255) issues.push({ field: key, message: `${key.toUpperCase()} exceeds the 0–255 stat limit.`, severity: "error" });
  });
  const moves = (record.moves || []).filter(Boolean);
  const legalMovesForGeneration = new Set(catalogForGeneration(generation).moves.map((move) => move.name));
  moves.forEach((move) => {
    if (!legalMovesForGeneration.has(move)) issues.push({ field: "moves", message: `${move} is not in the ${generation} move catalog.`, severity: "warning" });
  });
  const duplicates = moves.filter((move, index) => moves.indexOf(move) !== index);
  if (duplicates.length) issues.push({ field: "moves", message: "A Pokémon cannot have duplicate moves in this editor.", severity: "error" });
  return issues;
}

function formatBytes(bytes: number) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

function drawSummaryCard(canvas: HTMLCanvasElement, record: PokemonRecord) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const width = 1200;
  const height = 720;
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = "#f5f0e7";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#147d78";
  ctx.fillRect(0, 0, 18, height);
  ctx.fillStyle = "#e3dbcc";
  ctx.fillRect(18, 0, width - 18, 12);
  ctx.fillStyle = "#26332f";
  ctx.font = "600 27px IBM Plex Mono, monospace";
  ctx.fillText("PKSM / BROWSER", 64, 65);
  ctx.fillStyle = "#8a8378";
  ctx.font = "18px IBM Plex Mono, monospace";
  ctx.fillText(`BOX ${String(record.box).padStart(2, "0")}  /  SLOT ${String(record.slot).padStart(2, "0")}`, 64, 98);
  ctx.fillStyle = record.color || "#d7e6dc";
  ctx.beginPath();
  ctx.arc(160, 248, 104, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#147d78";
  ctx.font = "700 54px Space Grotesk, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(record.initials, 160, 266);
  ctx.textAlign = "left";
  ctx.fillStyle = "#29322e";
  ctx.font = "700 54px Space Grotesk, sans-serif";
  ctx.fillText(record.nickname || record.species, 310, 190);
  ctx.fillStyle = "#6e746d";
  ctx.font = "22px IBM Plex Mono, monospace";
  ctx.fillText(`${record.species}  ·  LEVEL ${record.level}`, 310, 229);
  ctx.fillText(`${record.type}  ·  ${record.nature}  ·  ${record.ability}`, 310, 264);
  const badges = [record.shiny ? "SHINY" : "STANDARD", record.gender && record.gender !== "unknown" ? record.gender.toUpperCase() : "GENDER —", record.heldItem && record.heldItem !== "—" ? `ITEM: ${record.heldItem}` : "NO HELD ITEM"];
  badges.forEach((badge, index) => { ctx.fillStyle = index === 0 && record.shiny ? "#fbf3d9" : "#e0eee6"; ctx.fillRect(310 + index * 170, 300, 155, 34); ctx.fillStyle = index === 0 && record.shiny ? "#946b13" : "#147d78"; ctx.font = "600 13px IBM Plex Mono, monospace"; ctx.fillText(badge.slice(0, 21), 321 + index * 170, 322); });
  ctx.fillStyle = "#d6cdbd";
  ctx.fillRect(64, 390, 1070, 1);
  ctx.fillStyle = "#147d78";
  ctx.font = "600 16px IBM Plex Mono, monospace";
  ctx.fillText("BASE STATS", 64, 430);
  const stats = record.stats || { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 };
  const statEntries: [string, number][] = [["HP", stats.hp], ["ATK", stats.attack], ["DEF", stats.defense], ["SP. ATK", stats.spAtk], ["SP. DEF", stats.spDef], ["SPEED", stats.speed]];
  statEntries.forEach(([label, value], index) => { const x = 64 + (index % 3) * 220; const y = 470 + Math.floor(index / 3) * 78; ctx.fillStyle = "#8a8378"; ctx.font = "14px IBM Plex Mono, monospace"; ctx.fillText(label, x, y); ctx.fillStyle = "#414740"; ctx.font = "600 18px IBM Plex Mono, monospace"; ctx.fillText(String(value), x + 145, y); ctx.fillStyle = "#ddd4c4"; ctx.fillRect(x, y + 15, 180, 6); ctx.fillStyle = "#147d78"; ctx.fillRect(x, y + 15, Math.max(0, Math.min(180, (value / 255) * 180)), 6); });
  ctx.fillStyle = "#147d78";
  ctx.font = "600 16px IBM Plex Mono, monospace";
  ctx.fillText("MOVESET", 760, 430);
  (record.moves || []).filter(Boolean).forEach((move, index) => { const y = 470 + index * 38; ctx.fillStyle = "#e0eee6"; ctx.fillRect(760, y - 18, 350, 27); ctx.fillStyle = "#147d78"; ctx.font = "600 12px IBM Plex Mono, monospace"; ctx.fillText(`0${index + 1}`, 775, y); ctx.fillStyle = "#414740"; ctx.font = "15px IBM Plex Mono, monospace"; ctx.fillText(move, 820, y); });
  ctx.fillStyle = "#9b9487";
  ctx.font = "12px IBM Plex Mono, monospace";
  ctx.fillText("LOCAL SUMMARY  ·  GENERATED IN BROWSER  ·  PKSM BROWSER", 64, 674);
}

function AppMark() {
  return <img className="brand-mark" src="/manus-storage/pksm-browser-mark_6ffe51d8.png" alt="" />;
}

export default function Home() {
  const fileInput = useRef<HTMLInputElement>(null);
  const storageFileInput = useRef<HTMLInputElement>(null);
  const [records, setRecords] = useState<PokemonRecord[]>(() => dummyDataEnabled ? dummyRecords : emptyRecords);
  const [selectedId, setSelectedId] = useState(1);
  const [activeArea, setActiveArea] = useState("Save editor");
  const [box, setBox] = useState(1);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  const [moveSourceId, setMoveSourceId] = useState<number | null>(null);
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState<number[]>([]);
  const [saveFile, setSaveFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<SaveFormat | null>(null);
  const [detectedLayout, setDetectedLayout] = useState<SaveLayout | null>(null);
  const [gen1Save, setGen1Save] = useState<Gen1BinarySave | null>(null);
  const [gameContext, setGameContext] = useState<GameDefinition | null>(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [shinyOnly, setShinyOnly] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("pksm-browser-theme") === "dark");
  const [showReleaseConfirm, setShowReleaseConfirm] = useState(false);
  const [showPokedex, setShowPokedex] = useState(false);
  const [pokedexQuery, setPokedexQuery] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [showSummaryCard, setShowSummaryCard] = useState(false);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const [dirty, setDirty] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<PokemonRecord | null>(null);
  const [autoFixMessage, setAutoFixMessage] = useState("");

  const selected = records.find((record) => record.id === selectedId) || records[0];
  const currentBoxRecords = useMemo(() => records.filter((record) => record.box === box), [records, box]);
  const hasGlobalFilters = query.trim().length > 0 || typeFilter !== "all" || shinyOnly;
  const matchingRecords = useMemo(() => records.filter((record) => {
    if (record.status === "empty") return false;
    const haystack = `${record.species} ${record.nickname}`.toLowerCase();
    const matchesText = !query.trim() || haystack.includes(query.trim().toLowerCase()) || record.type.toLowerCase().includes(query.trim().toLowerCase());
    const matchesType = typeFilter === "all" || record.type.toLowerCase().includes(typeFilter.toLowerCase());
    const matchesShiny = !shinyOnly || record.shiny;
    return matchesText && matchesType && matchesShiny;
  }), [records, query, typeFilter, shinyOnly]);
  const matchingIds = useMemo(() => new Set(matchingRecords.map((record) => record.id)), [matchingRecords]);
  const filteredRecords = useMemo(() => currentBoxRecords.filter((record) => !hasGlobalFilters || matchingIds.has(record.id)), [currentBoxRecords, hasGlobalFilters, matchingIds]);
  const availableTypes = useMemo(() => Array.from(new Set(records.filter((record) => record.status !== "empty").flatMap((record) => record.type.split(" / ")))).sort(), [records]);
  const capturedSpecies = useMemo(() => new Map(records.filter((record) => record.status !== "empty").map((record) => [record.species.toLowerCase(), record])), [records]);
  const completedPokedexCount = nationalPokedex.filter((species) => capturedSpecies.has(species.name)).length;
  const pokedexPercent = Math.round((completedPokedexCount / nationalPokedex.length) * 1000) / 10;
  const missingSpecies = useMemo(() => nationalPokedex.filter((species) => !capturedSpecies.has(species.name) && (!pokedexQuery.trim() || species.name.includes(pokedexQuery.trim().toLowerCase()))), [capturedSpecies, pokedexQuery]);
  const matchedSpecies = useMemo(() => nationalPokedex.filter((species) => capturedSpecies.has(species.name) && (!pokedexQuery.trim() || species.name.includes(pokedexQuery.trim().toLowerCase()))), [capturedSpecies, pokedexQuery]);
  const activeCatalog = catalogForGeneration(detectedFormat?.generation || (gen1Save ? "I" : undefined));
  const legalityIssues = draft ? getLegalityIssues(draft, activeCatalog.generation) : [];
  const hasLegalityErrors = legalityIssues.some((issue) => issue.severity === "error");

  useEffect(() => {
    if (showSummaryCard && selected?.status !== "empty" && cardCanvas.current) drawSummaryCard(cardCanvas.current, selected);
  }, [showSummaryCard, selected]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark-mode", darkMode);
    localStorage.setItem("pksm-browser-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  function jumpToPokedexRecord(speciesName: string) {
    const record = capturedSpecies.get(speciesName);
    if (record) jumpToMatch(record);
  }

  function jumpToMatch(record: PokemonRecord) {
    setBox(record.box);
    setSelectedId(record.id);
    toast("Match located", { description: `${record.nickname || record.species} · Box ${String(record.box).padStart(2, "0")} · Slot ${String(record.slot).padStart(2, "0")}` });
  }

  function clearFilters() {
    setQuery("");
    setTypeFilter("all");
    setShinyOnly(false);
  }

  function toggleBulkSelection(record: PokemonRecord) {
    if (record.status === "empty") return;
    setBulkSelectedIds((current) => current.includes(record.id) ? current.filter((id) => id !== record.id) : [...current, record.id]);
  }

  function selectAllInBox() {
    const ids = currentBoxRecords.filter((record) => record.status !== "empty").map((record) => record.id);
    setBulkSelectedIds(ids);
  }

  function clearBulkSelection() {
    setBulkSelectedIds([]);
    setMultiSelectMode(false);
  }

  function emptyRecord(record: PokemonRecord): PokemonRecord {
    return { ...record, species: "Empty slot", nickname: "", level: 0, type: "—", nature: "—", ability: "—", heldItem: "—", gender: "unknown", stats: undefined, moves: undefined, shiny: false, color: "#d9d3c5", initials: "", status: "empty" };
  }

  function bulkMoveRecords(destinationBox: number) {
    const selectedRecords = records.filter((record) => bulkSelectedIds.includes(record.id) && record.status !== "empty");
    if (!selectedRecords.length) return;
    const destinationSlots = records.filter((record) => record.box === destinationBox && record.status === "empty").slice(0, selectedRecords.length);
    if (destinationSlots.length < selectedRecords.length) {
      toast.error("Not enough open slots", { description: `Box ${String(destinationBox).padStart(2, "0")} has ${destinationSlots.length} open slot${destinationSlots.length === 1 ? "" : "s"} for ${selectedRecords.length} selected records.` });
      return;
    }
    setRecords((current) => current.map((record) => {
      const sourceIndex = selectedRecords.findIndex((source) => source.id === record.id);
      if (sourceIndex >= 0) return emptyRecord(record);
      const destinationIndex = destinationSlots.findIndex((slot) => slot.id === record.id);
      if (destinationIndex >= 0) return { ...selectedRecords[destinationIndex], id: record.id, box: record.box, slot: record.slot, status: "edited" as const };
      return record;
    }));
    setDirty(true);
    toast.success("Records moved", { description: `${selectedRecords.length} record${selectedRecords.length === 1 ? "" : "s"} moved to Box ${String(destinationBox).padStart(2, "0")}.` });
    clearBulkSelection();
  }

  function releaseSelectedRecords() {
    const selectedRecords = records.filter((record) => bulkSelectedIds.includes(record.id) && record.status !== "empty");
    if (!selectedRecords.length) return;
    setShowReleaseConfirm(true);
  }

  function confirmReleaseSelectedRecords() {
    const selectedRecords = records.filter((record) => bulkSelectedIds.includes(record.id) && record.status !== "empty");
    if (!selectedRecords.length) { setShowReleaseConfirm(false); return; }
    setRecords((current) => current.map((record) => bulkSelectedIds.includes(record.id) ? emptyRecord(record) : record));
    setDirty(true);
    setSelectedId(records.find((record) => !bulkSelectedIds.includes(record.id) && record.status !== "empty")?.id || 1);
    setShowReleaseConfirm(false);
    toast.success("Records released", { description: `${selectedRecords.length} storage slot${selectedRecords.length === 1 ? "" : "s"} cleared.` });
    clearBulkSelection();
  }

  function moveRecord(sourceId: number, targetId: number) {
    if (sourceId === targetId) return;
    const source = records.find((record) => record.id === sourceId);
    const target = records.find((record) => record.id === targetId);
    if (!source || !target || source.status === "empty") return;
    setRecords((current) => current.map((record) => {
      if (record.id === sourceId) return { ...target, id: sourceId, box: source.box, slot: source.slot, status: target.status === "empty" ? "empty" : "edited" };
      if (record.id === targetId) return { ...source, id: targetId, box: target.box, slot: target.slot, status: "edited" };
      return record;
    }));
    setSelectedId(targetId);
    setDirty(true);
    setMoveSourceId(null);
    setDropTargetId(null);
    toast.success("Record moved", { description: `${source.nickname || source.species} moved to Box ${String(target.box).padStart(2, "0")}, slot ${String(target.slot).padStart(2, "0")}.` });
  }

  function openEditor(record: PokemonRecord) {
    if (record.status === "empty") return;
    setEditingId(record.id);
    setAutoFixMessage("");
    setDraft({
      ...record,
      stats: record.stats || { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
      moves: record.moves || ["Thunderbolt", "Quick Attack", "Electro Ball", "Protect"],
    });
  }

  function updateDraftStats(key: keyof NonNullable<PokemonRecord["stats"]>, value: number) {
    setDraft((current) => current ? { ...current, stats: { ...(current.stats || { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 }), [key]: value } } : current);
  }

  function autoFixDraft() {
    if (!draft) return;
    const originalStats = draft.stats || { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 };
    const fixedStats = Object.fromEntries(Object.entries(originalStats).map(([key, value]) => [key, Math.min(255, Math.max(0, value))])) as NonNullable<PokemonRecord["stats"]>;
    const fixedMoves: string[] = [];
    let removedDuplicates = 0;
    let clearedInvalid = 0;
    (draft.moves || []).forEach((move) => {
      if (!move) { fixedMoves.push(""); return; }
      if (!activeCatalog.moves.some((catalogMove) => catalogMove.name === move)) { fixedMoves.push(""); clearedInvalid += 1; return; }
      if (fixedMoves.includes(move)) { fixedMoves.push(""); removedDuplicates += 1; return; }
      fixedMoves.push(move);
    });
    while (fixedMoves.length < 4) fixedMoves.push("");
    const fixedLevel = Math.min(100, Math.max(1, draft.level));
    const changedStats = Object.keys(originalStats).filter((key) => originalStats[key as keyof typeof originalStats] !== fixedStats[key as keyof typeof fixedStats]).length;
    const changes = [changedStats ? `${changedStats} stat${changedStats === 1 ? "" : "s"} clamped` : "", fixedLevel !== draft.level ? "level normalized" : "", removedDuplicates ? `${removedDuplicates} duplicate move${removedDuplicates === 1 ? "" : "s"} cleared` : "", clearedInvalid ? `${clearedInvalid} unknown move${clearedInvalid === 1 ? "" : "s"} cleared` : ""].filter(Boolean);
    setDraft({ ...draft, level: fixedLevel, stats: fixedStats, moves: fixedMoves });
    setAutoFixMessage(changes.length ? `Auto-Fix applied: ${changes.join(", ")}.` : "No basic fixes were needed.");
  }

  function saveEditor() {
    if (!draft || editingId === null) return;
    if (hasLegalityErrors) {
      toast.error("Fix legality errors first", { description: "Stats and duplicate moves must be corrected before applying this draft." });
      return;
    }
    setRecords((current) => current.map((record) => record.id === editingId ? { ...draft, status: "edited" } : record));
    setSelectedId(editingId);
    setEditingId(null);
    setDraft(null);
    setAutoFixMessage("");
    setDirty(true);
    toast.success("Record changes applied", { description: "Save locally or export the updated record when ready." });
  }

  function updateSelected(patch: Partial<PokemonRecord>) {
    setRecords((current) => current.map((record) => record.id === selectedId ? { ...record, ...patch, status: "edited" } : record));
    setDirty(true);
  }

  function saveWorkspace() {
    localStorage.setItem("pksm-browser-box", JSON.stringify(records));
    setDirty(false);
    toast.success("Workspace saved locally", { description: "Your box changes stay in this browser." });
  }

  function exportWorkspace() {
    const payload = { format: "pksm-browser-storage", version: 1, exportedAt: new Date().toISOString(), records };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `pksm-browser-storage-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setDirty(false);
    toast.success("Storage exported", { description: "Your boxes and edits were downloaded as a portable workspace file." });
  }

  async function handleStorageFile(file: File) {
    try {
      const payload = JSON.parse(await file.text()) as { format?: string; version?: number; records?: unknown };
      const importedRecords = payload.format === "pksm-browser-storage" && payload.version === 1 && Array.isArray(payload.records) ? payload.records : null;
      const valid = importedRecords && importedRecords.length === 24 * 30 && importedRecords.every((record) => {
        if (!record || typeof record !== "object") return false;
        const candidate = record as Partial<PokemonRecord>;
        return typeof candidate.id === "number" && typeof candidate.box === "number" && typeof candidate.slot === "number" && (candidate.status === "ready" || candidate.status === "edited" || candidate.status === "empty");
      });
      if (!valid) throw new Error("This is not a valid PKSM Browser workspace export.");
      setRecords(importedRecords as PokemonRecord[]);
      setGen1Save(null);
      setGameContext(null);
      setSaveFile({ name: file.name, size: file.size, type: file.type || "application/json" });
      setDetectedFormat(null);
      setDetectedLayout(null);
      setSelectedId((importedRecords as PokemonRecord[]).find((record) => record.status !== "empty")?.id || 1);
      setBox(1);
      setDirty(false);
      toast.success("Workspace loaded", { description: `${file.name} restored 24 boxes locally.` });
    } catch (error) {
      toast.error("Workspace load failed", { description: error instanceof Error ? error.message : "Choose a PKSM Browser storage export." });
    }
  }

  function exportActiveFile() {
    if (!gen1Save || detectedFormat?.id !== "gen1-gb") {
      exportWorkspace();
      return;
    }
    const movedRecord = records.find((record) => record.binarySource && (record.box !== record.binarySource.box || record.slot !== record.binarySource.slot));
    if (movedRecord) {
      toast.error("Move not ready for binary export", { description: "Gen I binary export currently supports in-place edits only. Return the loaded record to its original slot before exporting." });
      return;
    }
    const nextSave: Gen1BinarySave = { bytes: new Uint8Array(gen1Save.bytes), currentBox: gen1Save.currentBox, records: gen1Save.records };
    records.filter((record) => record.status !== "empty" && record.binarySource).forEach((record) => {
      const source = nextSave.records.find((candidate) => candidate.box === record.binarySource?.box && candidate.slot === record.binarySource?.slot);
      if (source) applyGen1RecordEdit(nextSave, source, record);
    });
    const output = serializeGen1Save(nextSave);
    const url = URL.createObjectURL(new Blob([output], { type: "application/octet-stream" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${saveFile?.name.replace(/\.[^.]+$/, "") || "pokemon-red"}-edited.sav`;
    anchor.click();
    URL.revokeObjectURL(url);
    setGen1Save(nextSave);
    setDirty(false);
    toast.success("Gen I save exported", { description: "Updated in-place records and PKSM checksum bytes were written to a new 32 KiB .sav file." });
  }

  async function handleFile(file: File) {
    if (file.name.toLowerCase().endsWith(".json")) {
      void handleStorageFile(file);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const layout = recognizeSaveLayout(bytes);
    const format = detectSaveFormat(file.name, layout?.dataSize || file.size);
    const parsedGen1 = isGen1International(bytes) ? parseGen1Save(bytes, (nationalId) => nationalPokedex.find((species) => species.id === nationalId)?.name || "Unknown species") : null;
    setSaveFile({ name: file.name, size: file.size, type: file.type || "application/octet-stream" });
    setDetectedFormat(format);
    setDetectedLayout(layout);
    setGen1Save(parsedGen1);
    setGameContext(format ? catalogForGeneration(format.generation).games[0] || null : null);
    if (parsedGen1) {
      const parsedBySlot = new Map(parsedGen1.records.map((record) => [`${record.box}-${record.slot}`, record]));
      setRecords(emptyRecords.map((empty) => {
        const parsed = parsedBySlot.get(`${empty.box}-${empty.slot}`);
        if (!parsed) return empty;
        const species = nationalPokedex.find((entry) => entry.id === parsed.nationalId);
        return { ...empty, species: species?.name || `Species ${parsed.nationalId}`, nickname: parsed.nickname || species?.name?.toUpperCase() || "POKEMON", level: parsed.level, type: "Gen I record", nature: "—", ability: "—", heldItem: "—", gender: "unknown", stats: parsed.stats, moves: parsed.moves, shiny: false, color: "#b9d8cf", initials: (parsed.nickname || species?.name || "PK").slice(0, 2).toUpperCase(), status: "ready", binarySource: { box: parsed.box, slot: parsed.slot, sourceOffset: parsed.sourceOffset, nicknameOffset: parsed.nicknameOffset } };
      }));
      setSelectedId(parsedGen1.records[0] ? (parsedGen1.records[0].box - 1) * 30 + parsedGen1.records[0].slot : 1);
      setBox(parsedGen1.records[0]?.box || 1);
    }
    setShowImport(false);
    toast.success(format ? `${format.label} detected` : "File loaded for inspection", { description: parsedGen1 ? "Gen I adapter verified for in-place record edits and binary export. Held items, abilities, and modern metadata are not present in Gen I saves." : format ? `${formatStatusLabel(format.status)}${layout ? ` · ${layoutLabel(layout.kind)}` : ""} · ${format.reader}. Binary editing/export is not enabled until the adapter is verified.` : `${file.name} is available locally. No source-backed format family matched its name or size.` });
  }

  function downloadSummaryCard() {
    if (!cardCanvas.current || !selected || selected.status === "empty") return;
    const anchor = document.createElement("a");
    anchor.href = cardCanvas.current.toDataURL("image/png");
    anchor.download = `${selected.nickname || selected.species || "pokemon"}-summary.png`;
    anchor.click();
    toast.success("Summary card downloaded", { description: "A shareable PNG was generated locally in your browser." });
  }

  function exportSelected() {
    const blob = new Blob([JSON.stringify(selected, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${selected.nickname || selected.species || "pokemon"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Record exported", { description: "A portable JSON record was downloaded from this browser." });
  }

  function clearWorkspace() {
    setSaveFile(null);
    setDetectedFormat(null);
    setDetectedLayout(null);
    setGen1Save(null);
    setGameContext(null);
    setRecords(dummyDataEnabled ? dummyRecords : emptyRecords);
    setDirty(false);
    toast("Workspace reset", { description: "No local files were deleted." });
  }

  const navItems = [
    { icon: FileArchive, label: "Save editor", count: saveFile ? "01" : "—" },
    { icon: LayoutGrid, label: "Storage boxes", count: "24" },
    { icon: Library, label: "Pokédex", count: `${completedPokedexCount}/${nationalPokedex.length}` },
    { icon: Archive, label: "Wondercards", count: "—" },
    { icon: ShieldCheck, label: "Verify & legalize", count: "β" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><AppMark /><div><div className="brand-name"><span className="wordmark-pksm">PKSM</span><span className="wordmark-browser">BROWSER</span></div><div className="brand-caption">LOCAL SAVE WORKBENCH</div></div></div>
        <div className="rail-section-label">WORKSPACES</div>
        <nav className="workspace-nav" aria-label="Workspaces">
          {navItems.map((item) => <button key={item.label} onClick={() => { setActiveArea(item.label); setShowPokedex(item.label === "Pokédex"); }} className={activeArea === item.label ? "nav-item active" : "nav-item"}><item.icon size={17} strokeWidth={1.8} /><span>{item.label}</span><b>{item.count}</b></button>)}
        </nav>
        <div className="sidebar-spacer" />
        <div className="privacy-card"><LockKeyhole size={16} /><div><strong>Browser local</strong><p>Files never leave this device unless you export them.</p></div></div>
        <button className="help-link" onClick={() => toast("Browser scope", { description: "Use Open save to inspect a local file, then export individual records as JSON." })}><CircleHelp size={16} /> How this works</button>
        <div className="version-line">PKSM Browser <span>v0.1.0</span></div>
      </aside>

      <main className="main-canvas">
        <header className="topbar"><div className="mobile-brand"><AppMark /><span>PKSM Browser</span></div><div className="breadcrumbs"><span>Workspace</span><ChevronDown size={13} /><strong>{activeArea}</strong></div><div className="top-actions"><button className="icon-button theme-toggle" onClick={() => setDarkMode((current) => !current)} aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}>{darkMode ? <Sun size={17} /> : <Moon size={17} />}</button><button className="icon-button mobile-only" onClick={() => setShowInspector(!showInspector)} aria-label="Toggle inspector"><PanelRight size={18} /></button><button className="quiet-button" onClick={() => storageFileInput.current?.click()}><HardDrive size={15} /> Load workspace</button><button className="quiet-button" onClick={() => setShowImport(true)}><Upload size={15} /> Import save</button><button className="primary-button" onClick={exportActiveFile}><Download size={15} /> {gen1Save ? (dirty ? "Export edited .sav" : "Export .sav") : (dirty ? "Export changes" : "Export storage")}</button><button className="icon-button" onClick={() => toast("More tools", { description: "Backups, scripts, and QR tools are planned extension points for this browser build." })}><MoreHorizontal size={19} /></button></div></header>

        <div className="content-wrap">
          <section className="page-intro"><div><div className="eyebrow"><span className="status-dot" /> LOCAL WORKSPACE / SAVE 01</div><h1>{showPokedex ? "Pokédex tracker" : gameContext?.title || "Save editor"}</h1><p>{showPokedex ? "Compare your current storage against the National Pokédex and locate every captured species." : gameContext ? `${gameContext.platform} · ${gameContext.description}` : "Load a local save, organize its boxes, and make careful edits before exporting."}</p></div><div className="intro-meta"><span className="meta-label">FORMAT</span><strong>{saveFile ? (detectedFormat ? `GEN ${detectedFormat.generation} · ${formatStatusLabel(detectedFormat.status)}` : saveFile.name.split(".").pop()?.toUpperCase()) : "NOT LOADED"}</strong><span className="meta-divider" /><span className="meta-label">STATE</span><strong className={dirty ? "text-yellow" : "text-teal"}>{dirty ? "UNSAVED" : "READY"}</strong></div></section>

          {showPokedex ? <section className="pokedex-panel panel-cut"><div className="pokedex-header"><div><div className="section-index">02 / COMPLETION</div><h2>National Pokédex</h2><p>Species are counted when a matching record exists anywhere in the current 24-box workspace.</p></div><button className="outline-button" onClick={() => { setShowPokedex(false); setActiveArea("Save editor"); }}><LayoutGrid size={15} /> Back to storage</button></div><div className="pokedex-progress"><div className="pokedex-progress-copy"><strong>{completedPokedexCount} <span>/ {nationalPokedex.length}</span></strong><span>species recorded · {pokedexPercent}% complete</span></div><div className="pokedex-track"><span style={{ width: `${pokedexPercent}%` }} /></div><div className="pokedex-stats"><span><b>{completedPokedexCount}</b> captured</span><span><b>{nationalPokedex.length - completedPokedexCount}</b> missing</span><span><b>{records.filter((record) => record.status !== "empty").length}</b> occupied slots</span></div></div><div className="pokedex-search"><Search size={15} /><input value={pokedexQuery} onChange={(event) => setPokedexQuery(event.target.value.toLowerCase())} placeholder="Search species catalog" aria-label="Search Pokédex species" /></div><div className="pokedex-columns"><section><div className="pokedex-section-title"><span>MISSING SPECIES</span><small>{missingSpecies.length} matches</small></div><div className="species-list">{missingSpecies.slice(0, 30).map((species) => <div className="species-chip missing" key={species.id}><span className="species-number">#{String(species.id).padStart(4, "0")}</span><strong>{species.name.replace(/-/g, " ")}</strong><span className="missing-dot" /></div>)}{missingSpecies.length > 30 && <div className="species-more">+{missingSpecies.length - 30} more missing · refine your search to browse</div>}{missingSpecies.length === 0 && <div className="species-empty">No missing species match this search.</div>}</div></section><section><div className="pokedex-section-title"><span>RECORDED SPECIES</span><small>{matchedSpecies.length} matches</small></div><div className="species-list">{matchedSpecies.slice(0, 16).map((species) => <button className="species-chip captured" key={species.id} onClick={() => jumpToPokedexRecord(species.name)}><span className="species-number">#{String(species.id).padStart(4, "0")}</span><strong>{species.name.replace(/-/g, " ")}</strong><small>{capturedSpecies.get(species.name)?.nickname || "Recorded"} · B{String(capturedSpecies.get(species.name)?.box || 0).padStart(2, "0")}</small></button>)}{matchedSpecies.length > 16 && <div className="species-more">+{matchedSpecies.length - 16} more recorded · refine your search to browse</div>}{matchedSpecies.length === 0 && <div className="species-empty">No recorded species match this search.</div>}</div></section></div><div className="pokedex-note"><Info size={14} /> This tracker uses a bundled National Pokédex species catalog. Forms, regional variants, and game-specific availability are not separated yet.</div></section> : <>

          <section className="file-strip"><div className="file-icon"><span className="notch-glyph" /><FileUp size={18} /></div><div className="file-copy"><strong>{saveFile ? saveFile.name : "No save file loaded"}</strong><span>{saveFile ? `${formatBytes(saveFile.size)} · ${saveFile.type}${detectedFormat ? ` · ${detectedFormat.label} · ${detectedFormat.reader}${gen1Save ? " · BINARY EXPORT ENABLED" : ""}` : " · inspection only"}` : "Open a .sav, .dat, or supported Pokémon file to begin"}</span></div>{gameContext && <div className="game-context-inline"><img src={gameContext.spriteUrl} alt="" /><span><strong>GEN {gameContext.generation} · {gameContext.title}</strong><small>{gameContext.platform} · {activeCatalog.moves.length} moves · {activeCatalog.items.length} items · {activeCatalog.keyItems.length} key items</small></span></div>}<div className="file-strip-actions">{saveFile && <button className="text-button" onClick={clearWorkspace}><X size={14} /> Clear</button>}<button className="outline-button" onClick={() => setShowImport(true)}>{saveFile ? "Replace file" : "Open save"} <ArrowDownToLine size={15} /></button><button className="text-button" onClick={() => storageFileInput.current?.click()}><HardDrive size={14} /> Load workspace</button></div>          </section>
          {gameContext && <section className="game-context-panel panel-cut"><div className="game-context-art"><img src={gameContext.spriteUrl} alt={`${gameContext.title} representative sprite`} /></div><div className="game-context-copy"><div className="section-index">LOADED GAME CONTEXT</div><h2>{gameContext.title}</h2><p>{gameContext.description}</p><div className="game-context-meta"><span><b>GEN</b> {gameContext.generation}</span><span><b>PLATFORM</b> {gameContext.platform}</span><span><b>FORMATS</b> {gameContext.saveFormats.join(" · ")}</span><span><b>BOXES</b> {gameContext.boxCount}</span><span><b>SPECIES</b> {gameContext.speciesCount}</span></div><div className="catalog-ribbon"><span><b>{activeCatalog.moves.length}</b> moves</span><span><b>{activeCatalog.items.length}</b> items</span><span><b>{activeCatalog.keyItems.length}</b> key items</span></div></div></section>}

          </>}

          {!showPokedex && <div className="workspace-grid">
            <section className="box-panel panel-cut"><div className="panel-header"><div><div className="section-index">02 / STORAGE</div><h2>Box {String(box).padStart(2, "0")} <span className="muted-title">— Meadow</span></h2></div><div className="panel-tools">{multiSelectMode && <><button className="outline-button compact" onClick={selectAllInBox}>Select box</button><button className="quiet-button compact" onClick={clearBulkSelection}>Clear</button></>}<button className={multiSelectMode ? "filter-toggle active" : "filter-toggle"} onClick={() => { setMultiSelectMode((current) => !current); if (multiSelectMode) setBulkSelectedIds([]); }} aria-pressed={multiSelectMode}>Select</button><div className="global-search-field"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search every box" aria-label="Search every box by Pokémon name, species, or type" /><span className="search-count">{hasGlobalFilters ? `${matchingRecords.length} found` : "24 boxes"}</span></div><select className="filter-select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter by type"><option value="all">All types</option>{availableTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><button className={`filter-toggle ${shinyOnly ? "active" : ""}`} onClick={() => setShinyOnly((current) => !current)} aria-pressed={shinyOnly}>✦ Shiny</button>{hasGlobalFilters && <button className="icon-button" onClick={clearFilters} aria-label="Clear search and filters"><X size={15} /></button>}<button className="outline-button compact" onClick={() => toast("Sort options", { description: "Sort by slot is active. Species, level, and type sorting are coming soon." })}><SlidersHorizontal size={14} /> Sort</button></div></div>{hasGlobalFilters && <div className="search-results-strip"><span className="search-results-label">SEARCH RESULTS</span><div className="search-results-list">{matchingRecords.slice(0, 8).map((record) => <button key={record.id} className={record.id === selectedId ? "match-chip selected" : "match-chip"} onClick={() => jumpToMatch(record)}><span>{record.shiny ? "✦ " : ""}{record.nickname || record.species}</span><small>B{String(record.box).padStart(2, "0")} · {String(record.slot).padStart(2, "0")}</small></button>)}{matchingRecords.length > 8 && <span className="search-overflow">+{matchingRecords.length - 8} more</span>}{matchingRecords.length === 0 && <span className="search-empty">No records match these filters.</span>}</div></div>}<div className="box-tabs"><button onClick={() => setBox(Math.max(1, box - 1))}>‹</button>{[1,2,3,4,5,6].map((number) => <button key={number} className={box === number ? "box-tab selected" : "box-tab"} onClick={() => setBox(number)} onDragOver={(event) => { if (draggedId !== null) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); if (draggedId !== null) { const firstOpen = records.find((record) => record.box === number && record.status === "empty"); if (firstOpen) moveRecord(draggedId, firstOpen.id); else toast("Box is full", { description: `Box ${String(number).padStart(2, "0")} has no open slots.` }); } }}>BOX {String(number).padStart(2, "0")}</button>)}<button onClick={() => setBox(Math.min(24, box + 1))}>›</button><span className="box-total">24 BOXES</span></div><div className="box-grid">{currentBoxRecords.map((record) => { const visible = filteredRecords.some((item) => item.id === record.id); const bulkSelected = bulkSelectedIds.includes(record.id); return <button key={record.id} draggable={record.status !== "empty"} onDragStart={() => { setDraggedId(record.id); setMoveSourceId(record.id); }} onDragEnd={() => { setDraggedId(null); setDropTargetId(null); }} onDragOver={(event) => { event.preventDefault(); setDropTargetId(record.id); }} onDragLeave={() => setDropTargetId(null)} onDrop={(event) => { event.preventDefault(); if (draggedId !== null) moveRecord(draggedId, record.id); }} aria-label={record.status === "empty" ? `Empty slot ${record.slot}` : `${record.nickname}, ${record.species}${record.shiny ? ", shiny" : ""}${record.gender && record.gender !== "unknown" ? `, ${record.gender}` : ""}${record.heldItem && record.heldItem !== "—" ? `, holding ${record.heldItem}` : ""}`} onClick={() => { if (multiSelectMode) { toggleBulkSelection(record); setSelectedId(record.id); return; } if (record.status === "empty" && moveSourceId === null) return; if (moveSourceId !== null) moveRecord(moveSourceId, record.id); else { setSelectedId(record.id); openEditor(record); } }} onKeyDown={(event) => { if (event.key !== "Enter" && event.key !== " ") return; event.preventDefault(); if (multiSelectMode) { toggleBulkSelection(record); setSelectedId(record.id); return; } if (record.status === "empty" && moveSourceId === null) return; if (moveSourceId !== null) moveRecord(moveSourceId, record.id); else { setMoveSourceId(record.id); setSelectedId(record.id); toast("Move mode enabled", { description: "Choose another slot in this or another box to place the record." }); } }} className={`slot ${selectedId === record.id ? "selected" : ""} ${record.status === "empty" ? "empty" : ""} ${!visible ? "filtered-out" : ""} ${moveSourceId === record.id ? "move-source" : ""} ${dropTargetId === record.id ? "drop-target" : ""} ${bulkSelected ? "bulk-selected" : ""}`}><span className="slot-number">{String(record.slot).padStart(2, "0")}</span>{multiSelectMode && record.status !== "empty" && <span className="bulk-marker" aria-hidden="true">{bulkSelected ? "✓" : ""}</span>}{record.status !== "empty" ? <><span className="mon-silhouette" style={{ background: record.color }}>{record.spriteId ? <img className="box-sprite" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${record.spriteId}.png`} alt="" /> : record.initials}<span className="sprite-badges">{record.shiny && <span className="sprite-badge shiny-badge" title="Shiny Pokémon" aria-label="Shiny Pokémon">✦</span>}{record.gender && record.gender !== "unknown" && <span className={`sprite-badge gender-badge ${record.gender}`} title={`${record.gender} Pokémon`} aria-label={`${record.gender} Pokémon`}>{record.gender === "female" ? "♀" : "♂"}</span>}{record.heldItem && record.heldItem !== "—" && <span className="sprite-badge item-badge" title={`Held item: ${record.heldItem}`} aria-label={`Held item: ${record.heldItem}`}>▣</span>}</span></span><span className="slot-name">{record.nickname}</span><span className="slot-level">Lv. {record.level}</span></> : <span className="empty-plus">+</span>}</button>})}</div>{bulkSelectedIds.length > 0 && <div className="bulk-action-bar"><div><strong>{bulkSelectedIds.length} selected</strong><span>Choose an action for these records.</span></div><select value="" onChange={(event) => { const destination = Number(event.target.value); if (destination) bulkMoveRecords(destination); }} aria-label="Move selected records to a box"><option value="">Move to box…</option>{Array.from({ length: 24 }, (_, index) => index + 1).filter((number) => number !== box).map((number) => <option key={number} value={number}>Box {String(number).padStart(2, "0")}</option>)}</select><button className="danger-button bulk-release" onClick={releaseSelectedRecords}><Trash2 size={15} /> Release</button><button className="icon-button" onClick={clearBulkSelection} aria-label="Clear selected records"><X size={15} /></button></div>}<div className="box-footer"><span><span className="legend-dot filled" /> {currentBoxRecords.filter((record) => record.status !== "empty").length} occupied</span><span><span className="legend-dot open" /> {currentBoxRecords.filter((record) => record.status === "empty").length} open slots</span><span className="box-footer-hint">Drag to move · Enter selects, Enter again moves</span></div></section>

            {showInspector && <aside className="inspector panel-cut"><div className="panel-header inspector-header"><div><div className="section-index">03 / INSPECTOR</div><h2>Record details</h2></div><button className="icon-button" onClick={() => setShowInspector(false)} aria-label="Close inspector"><X size={16} /></button></div>{selected?.status !== "empty" ? <><div className="record-hero"><div className="record-avatar" style={{ background: selected.color }}>{selected.spriteId ? <img className="record-sprite" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${selected.spriteId}.png`} alt="" /> : selected.initials}</div><div><div className="record-slot">BOX {String(selected.box).padStart(2, "0")} / SLOT {String(selected.slot).padStart(2, "0")} <span className={selected.status === "edited" ? "edited-tag" : "ready-tag"}>{selected.status === "edited" ? "EDITED" : "READY"}</span></div><h3>{selected.species}</h3><p>{selected.nickname || "No nickname"} · Level {selected.level}</p></div><button className="icon-button edit-icon" onClick={() => selected && openEditor(selected)}><Pencil size={15} /></button></div><div className="field-group"><label htmlFor="nickname">Nickname</label><input id="nickname" value={selected.nickname} onChange={(event) => updateSelected({ nickname: event.target.value.toUpperCase() })} /></div><div className="field-row"><div className="field-group"><label htmlFor="level">Level</label><input id="level" type="number" min="1" max="100" value={selected.level} onChange={(event) => updateSelected({ level: Math.min(100, Math.max(1, Number(event.target.value))) })} /></div><div className="field-group"><label htmlFor="nature">Nature</label><select id="nature" value={selected.nature} onChange={(event) => updateSelected({ nature: event.target.value })}><option>Jolly</option><option>Modest</option><option>Adamant</option><option>Careful</option><option>Timid</option><option>Calm</option><option>Bashful</option></select></div></div><div className="field-group"><label htmlFor="ability">Ability</label><select id="ability" value={selected.ability} onChange={(event) => updateSelected({ ability: event.target.value })}><option>{selected.ability}</option><option>Static</option><option>Synchronize</option><option>Intimidate</option><option>Inner Focus</option><option>Multiscale</option><option>Overgrow</option><option>Run Away</option></select></div><div className="field-group"><label htmlFor="held-item">Held item</label><input id="held-item" value={selected.heldItem} onChange={(event) => updateSelected({ heldItem: event.target.value })} /></div><div className="record-stats"><div><span>TYPE</span><strong>{selected.type}</strong></div><div><span>SHINY</span><strong>{selected.shiny ? "YES" : "NO"}</strong></div><div><span>GENDER</span><strong>{selected.gender === "unknown" ? "—" : selected.gender?.toUpperCase()}</strong></div></div><div className="record-catalog-detail"><div><span>MOVES</span><strong>{(selected.moves || []).filter(Boolean).join(" · ") || "No moves recorded"}</strong></div><div><span>HELD ITEM</span><strong>{selected.heldItem || "—"}</strong></div></div><div className="inspector-actions"><button className="outline-button" onClick={() => setShowSummaryCard(true)}><Share2 size={15} /> Summary card</button><button className="outline-button" onClick={exportSelected}><Download size={15} /> Export record</button><button className="danger-button" onClick={() => { updateSelected({ status: "empty", species: "Empty slot", nickname: "", level: 0, initials: "" }); toast("Slot cleared", { description: "Save locally to keep the change." }); }}><Trash2 size={15} /></button></div></> : <div className="empty-inspector"><Sparkles size={22} /><strong>Empty storage slot</strong><p>Import a Pokémon file or use this slot as a future destination.</p><button className="outline-button" onClick={() => toast("Import a record", { description: "Use Open save to load a local Pokémon file." })}><FileUp size={15} /> Import record</button></div>}<div className="inspector-footnote"><Info size={14} /> Edits are held in memory until you save or export.</div></aside>}
          </div>}
        </div>
      </main>

      {showSummaryCard && selected?.status !== "empty" && <div className="modal-backdrop" onClick={() => setShowSummaryCard(false)}><div className="summary-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="summary-card-title"><button className="modal-close icon-button" onClick={() => setShowSummaryCard(false)} aria-label="Close summary card preview"><X size={17} /></button><div className="modal-kicker">05 / SHARE CARD</div><h2 id="summary-card-title">{selected.nickname || selected.species} summary</h2><p className="summary-modal-copy">A local PNG card with this record’s identity, status, stats, and moves.</p><canvas ref={cardCanvas} className="summary-canvas" aria-label={`Summary card for ${selected.nickname || selected.species}`} /><div className="summary-modal-actions"><button className="quiet-button" onClick={() => setShowSummaryCard(false)}>Close</button><button className="primary-button" onClick={downloadSummaryCard}><Download size={15} /> Download PNG</button></div></div></div>}

      {editingId !== null && draft && <div className="modal-backdrop" onClick={() => { setEditingId(null); setDraft(null); }}><div className="edit-modal" onClick={(event) => event.stopPropagation()}><div className="edit-modal-header"><div><div className="modal-kicker">04 / RECORD EDITOR</div><h2>Edit {draft.species}</h2><p>Changes stay in a draft until you apply them to this storage slot.</p></div><div className={`legality-badge ${hasLegalityErrors ? "invalid" : legalityIssues.length ? "review" : "legal"}`}><span className="legality-dot" />{hasLegalityErrors ? "INVALID DRAFT" : legalityIssues.length ? "REVIEW NEEDED" : "WITHIN LIMITS"}<small>{legalityIssues.length ? `${legalityIssues.length} issue${legalityIssues.length === 1 ? "" : "s"}` : "Local rules"}</small></div><button className="modal-close icon-button" onClick={() => { setEditingId(null); setDraft(null); }} aria-label="Close editor"><X size={17} /></button></div><div className="edit-modal-body"><section className="edit-section"><div className="edit-section-title"><span>IDENTITY</span><small>{draft.nickname || "NO NICKNAME"} · BOX {String(draft.box).padStart(2, "0")} / SLOT {String(draft.slot).padStart(2, "0")}</small></div><div className="edit-grid three"><div className="field-group"><label htmlFor="edit-nickname">Nickname</label><input id="edit-nickname" value={draft.nickname} onChange={(event) => setDraft({ ...draft, nickname: event.target.value.toUpperCase() })} /></div><div className="field-group"><label htmlFor="edit-level">Level</label><input id="edit-level" type="number" min="1" max="100" value={draft.level} onChange={(event) => setDraft({ ...draft, level: Number(event.target.value) })} /></div><div className="field-group"><label htmlFor="edit-held-item">Held item</label><input id="edit-held-item" list="generation-items" value={draft.heldItem} onChange={(event) => setDraft({ ...draft, heldItem: event.target.value })} placeholder="None" /><datalist id="generation-items">{activeCatalog.items.map((item) => <option key={item.id} value={item.name} />)}</datalist></div></div></section><section className="edit-section"><div className="edit-section-title"><span>BASE STATS</span><small>0—255 · local draft</small></div><div className="stats-grid">{([['hp', 'HP'], ['attack', 'ATTACK'], ['defense', 'DEFENSE'], ['spAtk', 'SP. ATTACK'], ['spDef', 'SP. DEFENSE'], ['speed', 'SPEED']] as const).map(([key, label]) => <div className="stat-field" key={key}><label htmlFor={`stat-${key}`}>{label}</label><input id={`stat-${key}`} className={(draft.stats?.[key] ?? 100) > 255 ? "field-invalid" : ""} type="number" min="0" max="255" value={draft.stats?.[key] ?? 100} onChange={(event) => updateDraftStats(key, Number(event.target.value))} /><div className="stat-track"><span style={{ width: `${Math.min(100, ((draft.stats?.[key] ?? 100) / 255) * 100)}%` }} /></div>{(draft.stats?.[key] ?? 100) > 255 && <small className="field-warning">Exceeds 255</small>}</div>)}</div></section><section className="edit-section"><div className="edit-section-title"><span>MOVES</span><small>4 slots · choose or type a move</small></div><div className="moves-grid">{[0, 1, 2, 3].map((index) => <div className="move-row" key={index}><span className="move-index">0{index + 1}</span><select className={draft.moves?.[index] && (!activeCatalog.moves.some((catalogMove) => catalogMove.name === draft.moves?.[index]) || (draft.moves || []).filter((move) => move === draft.moves?.[index]).length > 1) ? "field-invalid" : ""} value={draft.moves?.[index] || ""} onChange={(event) => { const moves = [...(draft.moves || ["", "", "", ""])]; moves[index] = event.target.value; setDraft({ ...draft, moves }); }}><option value="">— Empty move slot —</option>{activeCatalog.moves.map((move) => <option value={move.name} key={move.id}>{move.name}</option>)}</select></div>)}</div>{legalityIssues.length > 0 && <div className="legality-list">{legalityIssues.map((issue, index) => <div className={`legality-issue ${issue.severity}`} key={`${issue.field}-${index}`}><span>{issue.severity === "error" ? "!" : "i"}</span><strong>{issue.field}</strong>{issue.message}</div>)}</div>}</section></div><div className="edit-modal-footer"><div className="modal-note"><LockKeyhole size={14} /> Local rules cover stat bounds, move catalog membership, and duplicates.</div><div className="modal-actions">{legalityIssues.length > 0 && <button className="outline-button auto-fix-button" onClick={autoFixDraft}><Sparkles size={15} /> Auto-Fix</button>}<button className="quiet-button" onClick={() => { setEditingId(null); setDraft(null); }}>Cancel</button><button className="primary-button" onClick={saveEditor} disabled={hasLegalityErrors}><Save size={15} /> Apply changes</button>{autoFixMessage && <span className="auto-fix-message">{autoFixMessage}</span>}</div></div></div></div>}

      {showReleaseConfirm && <div className="modal-backdrop" onClick={() => setShowReleaseConfirm(false)}><div className="confirm-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="release-confirm-title"><div className="confirm-icon"><AlertTriangle size={22} /></div><div className="modal-kicker">DESTRUCTIVE ACTION</div><h2 id="release-confirm-title">Release selected records?</h2><p>This will clear <strong>{bulkSelectedIds.length} selected Pokémon</strong> from their storage slots. The change stays local until you export, but it cannot be undone from this dialog.</p><div className="confirm-modal-actions"><button className="quiet-button" onClick={() => setShowReleaseConfirm(false)}>Cancel</button><button className="danger-button confirm-release-button" onClick={confirmReleaseSelectedRecords}><Trash2 size={15} /> Release {bulkSelectedIds.length}</button></div></div></div>}

      {showImport && <div className="modal-backdrop" onClick={() => setShowImport(false)}><div className="import-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close icon-button" onClick={() => setShowImport(false)} aria-label="Close import dialog"><X size={17} /></button><div className="modal-kicker">01 / LOCAL FILE</div><h2>Open a save file</h2><p>Select a file from your device. PKSM Browser reads it in your browser session and does not upload it.</p><button className="drop-zone" onClick={() => fileInput.current?.click()}><FolderOpen size={28} /><strong>Choose a file</strong><span>.sav, .dat, .pk*, .wc* or any binary file to inspect</span></button><input ref={fileInput} className="hidden-input" type="file" onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} /><input ref={storageFileInput} className="hidden-input" type="file" accept="application/json,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void handleStorageFile(file); event.currentTarget.value = ""; }} /><div className="modal-note"><LockKeyhole size={14} /> No server required. You can self-host this app as static files. Default workspaces are empty; preview data requires the documented dummy-data build flag.</div></div></div>}
    </div>
  );
}
