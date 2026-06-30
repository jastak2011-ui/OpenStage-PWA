import type { ParsedChordProLine, ParsedChordToken } from '../types';
import { parseHarmonyText, stripHarmonyMarkup, type HarmonyRange } from './harmony';

export type ChordAnchor = {
  chord: string;
  index: number;
};

export type AnchoredChordLine = {
  lyricLine: string;
  anchors: ChordAnchor[];
  harmonyRanges: HarmonyRange[];
};

export function inlineChordsToChordOverLyrics(rawText: string) {
  return rawText
    .split('\n')
    .map((line) => convertInlineChordLine(line))
    .join('\n');
}

export function convertInlineChordLine(line: string) {
  const directiveMatch = line.trim().match(/^\{.+\}$/);
  if (!line.trim() || directiveMatch || !/\[[^\]]+\]/.test(line)) return line;

  const chordLine: string[] = [];
  const lyricLine: string[] = [];
  const regex = /\[([A-G](?:#|b)?[^\]]*)\]/g;
  let sourceIndex = 0;
  let lyricIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    const textBefore = line.slice(sourceIndex, match.index);
    appendText(lyricLine, textBefore);
    lyricIndex += textBefore.length;
    placeText(chordLine, Math.max(lyricIndex, chordLine.length ? chordLine.length + 1 : 0), match[1]);
    sourceIndex = regex.lastIndex;
  }

  const textAfter = line.slice(sourceIndex);
  appendText(lyricLine, textAfter);

  return `${chordLine.join('').trimEnd()}\n${lyricLine.join('').trimEnd()}`;
}

export function chordTokensToChordOverLines(tokens: Array<ParsedChordToken | { type: 'text' | 'chord'; value: string; display: string }>) {
  const chordLine: string[] = [];
  const lyricLine: string[] = [];
  let lyricIndex = 0;

  tokens.forEach((token) => {
    if (token.type === 'text') {
      const text = 'display' in token ? token.display : token.value;
      appendText(lyricLine, text);
      lyricIndex += text.length;
      return;
    }
    const chord = 'display' in token ? token.display : token.value;
    placeText(chordLine, Math.max(lyricIndex, chordLine.length ? chordLine.length + 1 : 0), chord);
  });

  return {
    chordLine: chordLine.join('').trimEnd(),
    lyricLine: lyricLine.join('').trimEnd()
  };
}

export function chordTokensToAnchoredLine(tokens: Array<ParsedChordToken | { type: 'text' | 'chord'; value: string; display: string }>): AnchoredChordLine {
  let lyricMarkup = '';
  const anchors: ChordAnchor[] = [];

  tokens.forEach((token) => {
    if (token.type === 'text') {
      lyricMarkup += 'display' in token ? token.display : token.value;
      return;
    }

    anchors.push({
      chord: 'display' in token ? token.display : token.value,
      index: stripHarmonyMarkup(lyricMarkup).length
    });
  });

  const parsedLyric = parseHarmonyText(lyricMarkup);
  return {
    lyricLine: parsedLyric.text,
    anchors,
    harmonyRanges: parsedLyric.ranges
  };
}

export function chordOverTextToAnchoredLine(chordLine: string, lyricLine: string): AnchoredChordLine {
  const parsedLyric = parseHarmonyText(lyricLine);
  const anchors = Array.from(chordLine.matchAll(/\S+/g))
    .filter((match) => isChordAnchorToken(match[0]))
    .map((match) => ({
      chord: match[0],
      index: nearestLyricAnchorIndex(parsedLyric.text, match.index ?? 0)
    }));

  return {
    lyricLine: parsedLyric.text,
    anchors,
    harmonyRanges: parsedLyric.ranges
  };
}

export function nearestLyricAnchorIndex(lyricLine: string, index: number) {
  if (!lyricLine) return 0;
  if (index >= lyricLine.length) return finalLyricWordStart(lyricLine);
  const bounded = Math.max(0, Math.min(index, lyricLine.length - 1));
  if (!/\s/.test(lyricLine[bounded])) return bounded;

  for (let next = bounded; next < lyricLine.length; next += 1) {
    if (!/\s/.test(lyricLine[next])) return next;
  }

  for (let previous = lyricLine.length - 1; previous >= 0; previous -= 1) {
    if (!/\s/.test(lyricLine[previous])) {
      while (previous > 0 && !/\s/.test(lyricLine[previous - 1])) previous -= 1;
      return previous;
    }
  }

  return 0;
}

function finalLyricWordStart(lyricLine: string) {
  for (let previous = lyricLine.length - 1; previous >= 0; previous -= 1) {
    if (!/\s/.test(lyricLine[previous])) {
      while (previous > 0 && !/\s/.test(lyricLine[previous - 1])) previous -= 1;
      return previous;
    }
  }
  return 0;
}

function isChordAnchorToken(value: string) {
  if (/^(?:\|+|:+|\|:|:\||%|x\d+)$/i.test(value)) return false;
  return /^[|:({\[]*[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?(?:\/[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*)?[|:)}\]]*$/i.test(value);
}

function appendText(target: string[], text: string) {
  for (const char of text) target.push(char);
}

function placeText(target: string[], index: number, text: string) {
  while (target.length < index) target.push(' ');
  for (let offset = 0; offset < text.length; offset += 1) {
    target[index + offset] = text[offset];
  }
}

export function preservesNonChordLine(line: ParsedChordProLine) {
  return line.type === 'blank' || line.type === 'section' || line.type === 'comment' || line.type === 'directive';
}
