// Cartridge Lab style: this is a direct browser-side port of PKSM's size/trailer recognition boundary.
export type SaveLayout = {
  dataOffset: number;
  dataSize: number;
  trailerSize: number;
  kind: "raw" | "desmume" | "rtc" | "padding";
};

const KNOWN_SIZES = [0x80000, 0x20000, 0x10000, 0x8000] as const;
const DESMUME_TRAILER = 0x7a;

function isKnownSize(size: number) {
  return KNOWN_SIZES.includes(size as (typeof KNOWN_SIZES)[number]);
}

function isPlausibleRtcTrailer(size: number) {
  if (size === 0x07) return true;
  return size % 2 === 0 && size >= 0x0c && size <= 0x30;
}

export function recognizeSaveLayout(bytes: Uint8Array): SaveLayout | null {
  const byteLength = bytes.byteLength;
  if (!byteLength) return null;
  if (byteLength > DESMUME_TRAILER && isKnownSize(byteLength - DESMUME_TRAILER)) {
    return { dataOffset: 0, dataSize: byteLength - DESMUME_TRAILER, trailerSize: DESMUME_TRAILER, kind: "desmume" };
  }
  const rtcTrailer = byteLength & 0x3f;
  const rtcDataSize = byteLength - rtcTrailer;
  if (isPlausibleRtcTrailer(rtcTrailer) && (rtcDataSize === 0x8000 || rtcDataSize === 0x10000 || rtcDataSize === 0x20000)) {
    return { dataOffset: 0, dataSize: rtcDataSize, trailerSize: rtcTrailer, kind: "rtc" };
  }
  for (const dataSize of KNOWN_SIZES) {
    if (dataSize >= byteLength) continue;
    const tail = bytes.subarray(dataSize);
    const filler = tail[0];
    if ((filler !== 0x00 && filler !== 0xff) || !tail.every((byte) => byte === filler)) continue;
    const data = bytes.subarray(0, dataSize);
    if (data.every((byte) => byte === filler)) continue;
    return { dataOffset: 0, dataSize, trailerSize: byteLength - dataSize, kind: "padding" };
  }
  if (isKnownSize(byteLength)) return { dataOffset: 0, dataSize: byteLength, trailerSize: 0, kind: "raw" };
  return null;
}

export function layoutLabel(kind: SaveLayout["kind"]) {
  return kind === "raw" ? "RAW SAVE LAYOUT" : kind === "desmume" ? "DESMUME WRAPPER" : kind === "rtc" ? "RTC TRAILER" : "DUMPER PADDING";
}
