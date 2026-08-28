// Cartridge Lab style: this adapter is deliberately explicit about Gen I’s byte layout and the fields it can serialize safely.
export type Gen1EditableRecord = {
  species: string;
  nickname: string;
  level: number;
  moves?: string[];
  stats?: { hp: number; attack: number; defense: number; spAtk: number; spDef: number; speed: number };
};

export const GEN1_INT_SIZE = 0x8000;
const BOX_SIZE = 0x462;
const BOX_RECORD_LENGTH = 33;
const BOX_COUNT = 12;
const SLOTS_PER_BOX = 20;
const BOX_DATA_OFFSET = 22;
const NAMES_OFFSET = BOX_DATA_OFFSET + SLOTS_PER_BOX * BOX_RECORD_LENGTH;
const CURRENT_BOX_OFFSET = 0x30c0;
const CURRENT_BOX_INDEX_OFFSET = 0x284c;
const MAIN_CHECKSUM_OFFSET = 0x3523;
const MAIN_CHECKSUM_START = 0x2598;
const MAIN_CHECKSUM_LENGTH = 0xf8b;
const BANK2_CHECKSUM_OFFSET = 0x4000 + BOX_SIZE * 6;
const BANK3_CHECKSUM_OFFSET = 0x6000 + BOX_SIZE * 6;

const g1ToNational = [0,112,115,32,35,21,100,34,80,2,103,108,102,88,94,29,31,104,111,131,59,151,130,90,72,92,123,120,9,127,114,0,0,58,95,22,16,79,64,75,113,67,122,106,107,24,47,54,96,76,0,126,0,125,82,109,0,56,86,50,128,0,0,0,83,48,149,0,0,0,84,60,124,146,144,145,132,52,98,0,0,0,37,38,25,26,0,0,147,148,140,141,116,117,0,0,27,28,138,139,39,40,133,136,135,134,66,41,23,46,61,62,13,14,15,0,85,57,51,49,87,0,0,10,11,12,68,0,55,97,42,150,143,129,0,0,89,0,99,91,0,101,36,110,53,105,0,93,63,65,17,18,121,1,3,73,0,118,119,0,0,0,0,77,78,19,20,33,30,74,137,142,0,81,0,0,4,7,5,8,6,0,0,0,0,43,44,45,69,70,71];

const moveIds: Record<string, number> = {
  "Thunderbolt": 85, "Quick Attack": 98, "Protect": 182, "Psychic": 94, "Surf": 57, "Ice Beam": 58,
  "Toxic": 92, "Shadow Ball": 247, "Dragon Claw": 337, "Aura Sphere": 396, "Moonblast": 585, "Electro Ball": 521,
};
const moveNames: Record<number, string> = Object.fromEntries(Object.entries(moveIds).map(([name, id]) => [id, name]));

export type Gen1BinaryRecord = {
  box: number;
  slot: number;
  sourceOffset: number;
  nicknameOffset: number;
  speciesId: number;
  nationalId: number;
  nickname: string;
  level: number;
  moves: string[];
  stats: { hp: number; attack: number; defense: number; spAtk: number; spDef: number; speed: number };
  rawRecord: Uint8Array;
};

export type Gen1BinarySave = {
  bytes: Uint8Array;
  currentBox: number;
  records: Gen1BinaryRecord[];
};

function boxBankOffset(box: number) {
  return box < 6 ? 0x4000 + box * BOX_SIZE : 0x6000 + (box - 6) * BOX_SIZE;
}
function boxStart(box: number, currentBox: number) {
  return box === currentBox ? CURRENT_BOX_OFFSET : boxBankOffset(box);
}
function decodeText(bytes: Uint8Array) {
  let output = "";
  for (let index = 0; index < bytes.length; index++) {
    const value = bytes[index];
    if (value === 0x50 || value === 0xff || value === 0x00) break;
    if (value >= 0x80 && value <= 0x99) output += String.fromCharCode(65 + value - 0x80);
    else if (value >= 0xa0 && value <= 0xb9) output += String.fromCharCode(97 + value - 0xa0);
    else if (value === 0x7f) output += " ";
    else if (value === 0xe0) output += "?";
  }
  return output.trim();
}
function encodeText(value: string, length: number) {
  const output = new Uint8Array(length).fill(0x50);
  const normalized = value.toUpperCase();
  let index = 0;
  for (const character of normalized) {
    if (index >= length - 1) break;
    const code = character.charCodeAt(0);
    if (code >= 65 && code <= 90) output[index++] = 0x80 + code - 65;
    else if (character === " ") output[index++] = 0x7f;
  }
  return output;
}
function readU16BE(bytes: Uint8Array, offset: number) { return (bytes[offset] << 8) | bytes[offset + 1]; }
function writeU16BE(bytes: Uint8Array, offset: number, value: number) { bytes[offset] = (value >> 8) & 0xff; bytes[offset + 1] = value & 0xff; }
function scaleEv(value: number) { return Math.max(0, Math.min(255, Math.round((value / 0xffff) * 255))); }
function unscaleEv(value: number) { return Math.max(0, Math.min(0xffff, Math.round((value / 255) * 0xffff))); }

export function isGen1International(bytes: Uint8Array) {
  if (bytes.length !== GEN1_INT_SIZE) return false;
  const partyCount = bytes[0x2f2c];
  const currentCount = bytes[CURRENT_BOX_OFFSET];
  const partyListValid = partyCount <= 6 && bytes[0x2f2c + 1 + partyCount] === 0xff;
  const currentBoxListValid = currentCount <= SLOTS_PER_BOX && bytes[CURRENT_BOX_OFFSET + 1 + currentCount] === 0xff;
  return partyListValid && currentBoxListValid;
}

export function parseGen1Save(input: Uint8Array, speciesName: (nationalId: number) => string) : Gen1BinarySave | null {
  if (!isGen1International(input)) return null;
  const bytes = new Uint8Array(input);
  const currentBox = Math.min(11, bytes[CURRENT_BOX_INDEX_OFFSET] & 0x7f);
  const records: Gen1BinaryRecord[] = [];
  for (let box = 0; box < BOX_COUNT; box++) {
    const start = boxStart(box, currentBox);
    const count = Math.min(SLOTS_PER_BOX, bytes[start]);
    for (let slot = 0; slot < count; slot++) {
      const sourceOffset = start + BOX_DATA_OFFSET + slot * BOX_RECORD_LENGTH;
      const rawRecord = bytes.slice(sourceOffset, sourceOffset + BOX_RECORD_LENGTH);
      const speciesId = rawRecord[0];
      const nationalId = g1ToNational[speciesId] || 0;
      if (!nationalId) continue;
      const nicknameOffset = start + NAMES_OFFSET + SLOTS_PER_BOX * 11 + slot * 11;
      const stats = {
        hp: scaleEv(readU16BE(rawRecord, 17)), attack: scaleEv(readU16BE(rawRecord, 19)), defense: scaleEv(readU16BE(rawRecord, 21)),
        speed: scaleEv(readU16BE(rawRecord, 23)), spAtk: scaleEv(readU16BE(rawRecord, 25)), spDef: scaleEv(readU16BE(rawRecord, 25)),
      };
      records.push({ box: box + 1, slot: slot + 1, sourceOffset, nicknameOffset, speciesId, nationalId, nickname: decodeText(bytes.slice(nicknameOffset, nicknameOffset + 11)), level: rawRecord[3] || 1, moves: Array.from(rawRecord.slice(8, 12)).filter(Boolean).map((id) => moveNames[id] || `Move ${id}`), stats, rawRecord });
    }
  }
  return { bytes, currentBox: currentBox + 1, records };
}

export function applyGen1RecordEdit(save: Gen1BinarySave, source: Gen1BinaryRecord, record: Gen1EditableRecord) {
  const target = save.bytes.slice(source.sourceOffset, source.sourceOffset + BOX_RECORD_LENGTH);
  target[3] = Math.max(1, Math.min(100, Math.round(record.level)));
  (record.moves || []).slice(0, 4).forEach((move, index) => { target[8 + index] = moveIds[move] || 0; });
  const stats = record.stats || source.stats;
  writeU16BE(target, 17, unscaleEv(stats.hp)); writeU16BE(target, 19, unscaleEv(stats.attack)); writeU16BE(target, 21, unscaleEv(stats.defense));
  writeU16BE(target, 23, unscaleEv(stats.speed)); writeU16BE(target, 25, unscaleEv(stats.spAtk));
  save.bytes.set(target, source.sourceOffset);
  save.bytes.set(encodeText(record.nickname || record.species, 11), source.nicknameOffset);
}

function diff8(bytes: Uint8Array, start: number, length: number) {
  let value = 0;
  for (let index = start; index < start + length; index++) value = (value - bytes[index]) & 0xff;
  return value;
}
function syncBoxHeaders(bytes: Uint8Array, box: number, currentBox: number) {
  const start = boxStart(box, currentBox);
  const count = Math.min(SLOTS_PER_BOX, bytes[start]);
  bytes[start + 1 + count] = 0xff;
  for (let index = count + 1; index < SLOTS_PER_BOX; index++) bytes[start + 1 + index] = 0;
  for (let index = 0; index < count; index++) bytes[start + 1 + index] = bytes[start + BOX_DATA_OFFSET + index * BOX_RECORD_LENGTH];
  if (box === currentBox) bytes.set(bytes.slice(start, start + BOX_SIZE), boxBankOffset(box));
}

export function serializeGen1Save(save: Gen1BinarySave) {
  const currentBox = save.currentBox - 1;
  for (let box = 0; box < BOX_COUNT; box++) syncBoxHeaders(save.bytes, box, currentBox);
  for (let box = 0; box < 6; box++) save.bytes[BANK2_CHECKSUM_OFFSET + 1 + box] = diff8(save.bytes, 0x4000 + box * BOX_SIZE, BOX_SIZE);
  for (let box = 0; box < 6; box++) save.bytes[BANK3_CHECKSUM_OFFSET + 1 + box] = diff8(save.bytes, 0x6000 + box * BOX_SIZE, BOX_SIZE);
  save.bytes[BANK2_CHECKSUM_OFFSET] = diff8(save.bytes, 0x4000, BOX_SIZE * 6);
  save.bytes[BANK3_CHECKSUM_OFFSET] = diff8(save.bytes, 0x6000, BOX_SIZE * 6);
  save.bytes[MAIN_CHECKSUM_OFFSET] = diff8(save.bytes, MAIN_CHECKSUM_START, MAIN_CHECKSUM_LENGTH);
  return save.bytes;
}
