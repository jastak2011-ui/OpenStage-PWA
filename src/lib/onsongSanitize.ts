import { stripHarmonyMarkup } from './harmony';

export function sanitizeChartForOnSong(chartText: string) {
  return sanitizeOnSongExportText(chartText).strippedLyrics;
}

export type OnSongExportSuspiciousCharacter = {
  index: number;
  character: string;
  codePoint: string;
  reason: 'control' | 'zero-width' | 'private-use';
};

export type OnSongExportTextReport = {
  originalLyrics: string;
  strippedLyrics: string;
  remainingHarmonyTokens: string[];
  controlCharacters: OnSongExportSuspiciousCharacter[];
  importSafe: boolean;
};

export function sanitizeOnSongExportText(chartText: string): OnSongExportTextReport {
  const originalLyrics = chartText ?? '';
  const strippedHarmony = stripHarmonyMarkup(originalLyrics);
  const remainingHarmonyTokens = strippedHarmony.match(/\[\/?HARMONY\]/gi) ?? [];
  const suspiciousCharacters: OnSongExportSuspiciousCharacter[] = [];
  let strippedLyrics = '';

  for (let index = 0; index < strippedHarmony.length; index += 1) {
    const codePoint = strippedHarmony.codePointAt(index);
    if (codePoint === undefined) continue;
    const character = String.fromCodePoint(codePoint);
    if (codePoint > 0xffff) index += 1;
    const reason = unsupportedOnSongCharacterReason(codePoint);
    if (reason) {
      suspiciousCharacters.push({
        index,
        character,
        codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
        reason
      });
      continue;
    }
    strippedLyrics += character;
  }

  strippedLyrics = strippedLyrics
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .trim();

  return {
    originalLyrics,
    strippedLyrics,
    remainingHarmonyTokens,
    controlCharacters: suspiciousCharacters,
    importSafe: remainingHarmonyTokens.length === 0 && strippedLyrics.trim().length > 0
  };
}

function unsupportedOnSongCharacterReason(codePoint: number): OnSongExportSuspiciousCharacter['reason'] | null {
  if ((codePoint >= 0x0000 && codePoint <= 0x0008) || codePoint === 0x000b || codePoint === 0x000c || (codePoint >= 0x000e && codePoint <= 0x001f) || codePoint === 0x007f) return 'control';
  if (
    codePoint === 0x200b ||
    codePoint === 0x200c ||
    codePoint === 0x200d ||
    codePoint === 0x2060 ||
    codePoint === 0xfeff ||
    (codePoint >= 0xfe00 && codePoint <= 0xfe0f)
  ) return 'zero-width';
  if ((codePoint >= 0xe000 && codePoint <= 0xf8ff) || (codePoint >= 0xf0000 && codePoint <= 0xffffd) || (codePoint >= 0x100000 && codePoint <= 0x10fffd)) return 'private-use';
  return null;
}
