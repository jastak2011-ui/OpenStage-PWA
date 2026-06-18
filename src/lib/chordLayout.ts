import type { ParsedChordProLine, ParsedChordToken } from '../types';
import { parseHarmonyText, type HarmonyRange } from './harmony';

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
  const lyricLine: string[] = [];
  const anchors: ChordAnchor[] = [];
  const harmonyRanges: HarmonyRange[] = [];

  tokens.forEach((token) => {
    if (token.type === 'text') {
      const parsed = parseHarmonyText('display' in token ? token.display : token.value);
      const offset = lyricLine.length;
      appendText(lyricLine, parsed.text);
      parsed.ranges.forEach((range) => harmonyRanges.push({ start: offset + range.start, end: offset + range.end }));
      return;
    }

    anchors.push({
      chord: 'display' in token ? token.display : token.value,
      index: lyricLine.length
    });
  });

  return {
    lyricLine: lyricLine.join(''),
    anchors,
    harmonyRanges
  };
}

export function chordOverTextToAnchoredLine(chordLine: string, lyricLine: string): AnchoredChordLine {
  const parsedLyric = parseHarmonyText(lyricLine);
  const anchors = Array.from(chordLine.matchAll(/\S+/g))
    .filter((match) => isChordAnchorToken(match[0]))
    .map((match) => ({
      chord: match[0],
      index: match.index ?? 0
    }));

  return {
    lyricLine: parsedLyric.text,
    anchors,
    harmonyRanges: parsedLyric.ranges
  };
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
