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

export type HarmonyTextRun = {
  text: string;
  harmony: boolean;
  start: number;
  end: number;
};

export type HarmonyRenderRun = HarmonyTextRun & {
  styled: boolean;
};

export type HarmonyRenderModel = {
  text: string;
  runs: HarmonyRenderRun[];
  hasHarmony: boolean;
  showIcon: boolean;
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

export function harmonyTextRuns(input: string): HarmonyTextRun[] {
  const parsed = parseHarmonyText(input);
  return harmonyRunsFromParsed(parsed.text, parsed.ranges);
}

export function harmonyRunsFromParsed(text: string, ranges: HarmonyRange[]): HarmonyTextRun[] {
  const runs: HarmonyTextRun[] = [];
  const boundaries = Array.from(new Set([
    0,
    text.length,
    ...ranges.flatMap((range) => [
      Math.max(0, Math.min(text.length, range.start)),
      Math.max(0, Math.min(text.length, range.end))
    ])
  ])).sort((left, right) => left - right);

  for (let index = 0; index < boundaries.length - 1; index += 1) {
    const start = boundaries[index];
    const end = boundaries[index + 1];
    if (start >= end) continue;
    runs.push({
      text: text.slice(start, end),
      harmony: ranges.some((range) => start >= range.start && start < range.end),
      start,
      end
    });
  }

  return runs;
}

export function lyricHarmonyRenderModel(
  input: string,
  options: { showHarmonyCues: boolean; harmonyIconVisible?: boolean } = { showHarmonyCues: true, harmonyIconVisible: true }
): HarmonyRenderModel {
  const parsed = parseHarmonyText(input);
  return lyricHarmonyRenderModelFromParsed(parsed.text, parsed.ranges, options);
}

export function lyricHarmonyRenderModelFromParsed(
  text: string,
  ranges: HarmonyRange[],
  options: { showHarmonyCues: boolean; harmonyIconVisible?: boolean } = { showHarmonyCues: true, harmonyIconVisible: true }
): HarmonyRenderModel {
  const runs = harmonyRunsFromParsed(text, ranges).map((run) => ({
    ...run,
    styled: options.showHarmonyCues && run.harmony
  }));
  const hasHarmony = ranges.some((range) => range.end > range.start);
  return {
    text,
    runs,
    hasHarmony,
    showIcon: options.showHarmonyCues && (options.harmonyIconVisible ?? true) && hasHarmony
  };
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
