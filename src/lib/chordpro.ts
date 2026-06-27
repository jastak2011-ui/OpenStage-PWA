import type { ParsedChordPro, ParsedChordProLine, ParsedChordToken, Song } from '../types';
import { createId, createSongUuid } from './ids';
import { isHarmonyTag } from './harmony';

const supportedChordProExtensions = ['.cho', '.crd', '.chordpro', '.chopro', '.pro', '.txt'];
const knownDirectives = new Set([
  'title',
  'subtitle',
  'artist',
  'album',
  'key',
  'capo',
  'tempo',
  'time',
  'comment',
  'midi',
  'new_song',
  'start_of_chorus',
  'end_of_chorus',
  'start_of_verse',
  'end_of_verse',
  'start_of_bridge',
  'end_of_bridge',
  'start_of_solo',
  'end_of_solo',
  'start_of_outro',
  'end_of_outro',
  'soc',
  'eoc',
  'sov',
  'eov',
  'sob',
  'eob',
  'sos',
  'eos',
  'soo',
  'eoo',
  't',
  'st',
  'c'
]);

export type ChordProImportResult = {
  fileName: string;
  song: Song;
  warnings: string[];
};

export type ChordProBundleImportResult = {
  fileName: string;
  songsFound: number;
  songs: ChordProImportResult[];
};

export function isChordProFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  return supportedChordProExtensions.some((extension) => lower.endsWith(extension));
}

export function parseChordProSong(rawText: string, fileName = 'ChordPro import'): ChordProImportResult {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const parsed = parseChordPro(normalized);
  const directives = parsed.directives;
  const fallbackTitle = titleFromFileName(fileName);
  const title = firstDirective(directives, 'title') || firstDirective(directives, 't') || fallbackTitle;
  const subtitle = firstDirective(directives, 'subtitle');
  const artist = firstDirective(directives, 'artist') || (!firstDirective(directives, 'artist') && subtitle ? subtitle : '');
  const album = firstDirective(directives, 'album');
  const genre = firstDirective(directives, 'genre');
  const durationSeconds = parseDuration(firstDirective(directives, 'duration'));
  const key = firstDirective(directives, 'key') || '';
  const capo = numberDirective(directives, 'capo', 0);
  const bpm = numberDirective(directives, 'tempo', 0);
  const timeSignature = firstDirective(directives, 'time') || '4/4';
  const comments = [...(directives.comment ?? []), ...(directives.c ?? [])];
  const now = new Date().toISOString();

  const song: Song = {
    id: createId('song'),
    songUuid: createSongUuid(),
    title,
    subtitle,
    artist,
    album,
    genre,
    originalKey: key,
    performanceKey: key,
    durationSeconds,
    difficulty: '',
    tuning: 'Standard',
    vocalRange: '',
    bandNotes: '',
    rehearsalNotes: [],
    favorite: false,
    referenceAudioUrl: '',
    key,
    capo,
    bpm,
    timeSignature,
    tags: ['chordpro'],
    notes: comments.join('\n'),
    chart: normalized,
    displayPreference: 'inline',
    rawChordPro: normalized,
    parsedChordPro: parsed,
    updatedAt: now
  };

  return { fileName, song, warnings: parsed.warnings };
}

export function parseChordProBundle(rawText: string, fileName = 'ChordPro import'): ChordProBundleImportResult {
  const normalized = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const chunks = normalized
    .split(/^\s*\{new_song\}\s*$/gim)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0);

  const songs = chunks.map((chunk, index) => parseChordProSong(chunk, `${fileName} #${index + 1}`));
  return {
    fileName,
    songsFound: songs.length,
    songs
  };
}

export function parseChordPro(rawText: string): ParsedChordPro {
  const directives: ParsedChordPro['directives'] = {};
  const warnings: string[] = [];
  const lines: ParsedChordProLine[] = rawText.split('\n').map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) return { type: 'blank', raw: line };

    const directiveMatch = trimmed.match(/^\{\s*([^:}]+)\s*(?::\s*([^}]*))?\}$/);
    if (directiveMatch) {
      const originalName = directiveMatch[1].trim();
      const name = normalizeDirective(originalName);
      const value = directiveMatch[2]?.trim() ?? '';

      if (!knownDirectives.has(name)) {
        warnings.push(`${lineLabel(index)} Unknown directive {${originalName}} preserved.`);
      }

      if (!directives[name]) directives[name] = [];
      directives[name]?.push(value);

      if (name === 'comment' || name === 'c') return { type: 'comment', raw: line, text: value };
      const section = sectionDirective(name);
      if (section) return { type: 'section', raw: line, section: section.section, boundary: section.boundary };

      return { type: 'directive', raw: line, name, value };
    }

    if (trimmed.startsWith('{') || trimmed.endsWith('}')) {
      warnings.push(`${lineLabel(index)} Malformed directive preserved as lyrics.`);
    }

    const tokens = parseInlineChordTokens(line, warnings, index);
    return { type: 'lyrics', raw: line, tokens };
  });

  return { directives, lines, warnings };
}

export function renderParsedChordProAsText(parsed: ParsedChordPro) {
  return parsed.lines
    .map((line) => {
      if (line.type === 'lyrics') return line.raw;
      if (line.type === 'blank') return '';
      if (line.type === 'comment') return `{comment: ${line.text}}`;
      if (line.type === 'section') return `{${line.boundary === 'start' ? 'start_of_' : 'end_of_'}${line.section}}`;
      return line.value ? `{${line.name}: ${line.value}}` : `{${line.name}}`;
    })
    .join('\n');
}

function parseInlineChordTokens(line: string, warnings: string[], lineIndex: number): ParsedChordToken[] {
  const tokens: ParsedChordToken[] = [];
  const regex = /\[([^\]]*)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) tokens.push({ type: 'text', value: line.slice(lastIndex, match.index) });

    const chord = match[1].trim();
    if (!chord) warnings.push(`${lineLabel(lineIndex)} Empty chord marker preserved.`);
    if (isHarmonyTag(chord)) {
      tokens.push({ type: 'text', value: match[0] });
      lastIndex = regex.lastIndex;
      continue;
    }
    tokens.push({ type: 'chord', value: chord });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) tokens.push({ type: 'text', value: line.slice(lastIndex) });
  return tokens.length > 0 ? tokens : [{ type: 'text', value: line }];
}

function normalizeDirective(name: string) {
  const lower = name.trim().toLowerCase();
  const aliases: Record<string, string> = {
    t: 'title',
    st: 'subtitle',
    soc: 'start_of_chorus',
    eoc: 'end_of_chorus',
    sov: 'start_of_verse',
    eov: 'end_of_verse',
    sob: 'start_of_bridge',
    eob: 'end_of_bridge',
    sos: 'start_of_solo',
    eos: 'end_of_solo',
    soo: 'start_of_outro',
    eoo: 'end_of_outro',
    c: 'comment'
  };
  return aliases[lower] ?? lower;
}

function sectionDirective(name: string) {
  const match = name.match(/^(start|end)_of_(verse|chorus|bridge|solo|outro)$/);
  if (!match) return null;
  return {
    boundary: (match[1] === 'start' ? 'start' : 'end') as 'start' | 'end',
    section: match[2] as 'verse' | 'chorus' | 'bridge' | 'solo' | 'outro'
  };
}

function parseDuration(value: string) {
  if (!value) return undefined;
  const parts = value.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return Number(value) || undefined;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(value) || undefined;
}

function firstDirective(directives: ParsedChordPro['directives'], name: string) {
  return directives[name]?.find((value) => value.length > 0) ?? '';
}

function numberDirective(directives: ParsedChordPro['directives'], name: string, fallback: number) {
  const value = Number(firstDirective(directives, name));
  return Number.isFinite(value) ? value : fallback;
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Untitled Song';
}

function lineLabel(index: number) {
  return `Line ${index + 1}:`;
}
