export const harmonyStartTag = '[HARMONY]';
export const harmonyEndTag = '[/HARMONY]';

export type HarmonyRange = {
  start: number;
  end: number;
};

export type ParsedHarmonyText = {
  text: string;
  ranges: HarmonyRange[];
  hasHarmony: boolean;
};

const harmonyTagPattern = /\[\/?HARMONY\]/gi;

export function isHarmonyTag(value: string) {
  return /^\/?HARMONY$/i.test(value.trim());
}

export function parseHarmonyText(input: string): ParsedHarmonyText {
  const ranges: HarmonyRange[] = [];
  let text = '';
  let cursor = 0;
  let activeStart: number | null = null;
  let match: RegExpExecArray | null;
  harmonyTagPattern.lastIndex = 0;

  while ((match = harmonyTagPattern.exec(input)) !== null) {
    text += input.slice(cursor, match.index);
    const tag = match[0].toUpperCase();
    if (tag === harmonyStartTag) {
      if (activeStart === null) activeStart = text.length;
    } else if (activeStart !== null) {
      ranges.push({ start: activeStart, end: text.length });
      activeStart = null;
    }
    cursor = harmonyTagPattern.lastIndex;
  }

  text += input.slice(cursor);
  if (activeStart !== null) ranges.push({ start: activeStart, end: text.length });

  return {
    text,
    ranges: ranges.filter((range) => range.end > range.start),
    hasHarmony: ranges.some((range) => range.end > range.start)
  };
}

export function stripHarmonyMarkup(input: string) {
  return parseHarmonyText(input).text;
}

export function hasHarmonyMarkup(input: string) {
  return /\[\/?HARMONY\]/i.test(input);
}

export function markHarmonyRange(input: string, selectionStart: number, selectionEnd: number) {
  const range = normalizeHarmonyEditRange(input, selectionStart, selectionEnd);
  const selected = input.slice(range.start, range.end);
  if (!selected) return input;
  return `${input.slice(0, range.start)}${harmonyStartTag}${selected}${harmonyEndTag}${input.slice(range.end)}`;
}

export function removeHarmonyRange(input: string, selectionStart: number, selectionEnd: number) {
  const range = normalizeHarmonyEditRange(input, selectionStart, selectionEnd);
  const before = input.slice(0, range.start);
  const target = input.slice(range.start, range.end);
  const after = input.slice(range.end);
  return `${before}${target.replace(harmonyTagPattern, '')}${after}`;
}

export function normalizeHarmonyEditRange(input: string, selectionStart: number, selectionEnd: number) {
  if (selectionStart !== selectionEnd) {
    return {
      start: Math.max(0, Math.min(selectionStart, selectionEnd)),
      end: Math.min(input.length, Math.max(selectionStart, selectionEnd))
    };
  }

  const lineStart = input.lastIndexOf('\n', Math.max(0, selectionStart - 1)) + 1;
  const nextBreak = input.indexOf('\n', selectionStart);
  const lineEnd = nextBreak === -1 ? input.length : nextBreak;
  return { start: lineStart, end: lineEnd };
}
