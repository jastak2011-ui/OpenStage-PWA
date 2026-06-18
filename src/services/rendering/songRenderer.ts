import { applyPerformanceChordTransform, chordToNashville } from '../../lib/chords';
import { isHarmonyTag, stripHarmonyMarkup } from '../../lib/harmony';
import type { ParsedChordProLine, RenderDiagnostics, Song } from '../../types';

export type RenderOptions = {
  transpose: number;
  capo: number;
  showNashvilleNumbers: boolean;
  songKey: string;
  activeProfile?: string;
  lyricFontSize?: number;
  lineSpacing?: number;
  chordFontSize?: number;
  headerFontSize?: number;
  songTitleFontSize?: number;
  songArtistFontSize?: number;
  sectionFontSize?: number;
  sectionSpacingBefore?: number;
  sectionSpacingAfter?: number;
  viewportWidth?: number;
  displayMode?: string;
};

export type RenderedLine =
  | { type: 'blank'; raw: string }
  | { type: 'comment'; raw: string; text: string }
  | { type: 'section'; raw: string; section: string; boundary: 'start' | 'end' }
  | { type: 'directive'; raw: string; name: string; value: string }
  | { type: 'song-title'; raw: string; value: string }
  | { type: 'song-artist'; raw: string; value: string }
  | { type: 'chord-over'; raw: string; chordLine: string; lyricLine: string }
  | { type: 'lyrics'; raw: string; tokens: Array<{ type: 'text' | 'chord'; value: string; display: string }> };

const renderCache = new Map<string, RenderedLine[]>();

export function renderSong(song: Song, options: RenderOptions) {
  const startedAt = performance.now();
  const chartSignature = hashString(song.chart ?? '');
  const cacheKey = [
    song.id,
    song.updatedAt,
    chartSignature,
    song.displayPreference ?? 'inline',
    options.transpose,
    options.capo,
    options.showNashvilleNumbers,
    options.songKey,
    options.activeProfile ?? '',
    options.lyricFontSize ?? '',
    options.lineSpacing ?? '',
    options.chordFontSize ?? '',
    options.headerFontSize ?? '',
    options.songTitleFontSize ?? '',
    options.songArtistFontSize ?? '',
    options.sectionFontSize ?? '',
    options.sectionSpacingBefore ?? '',
    options.sectionSpacingAfter ?? '',
    options.viewportWidth ?? '',
    options.displayMode ?? ''
  ].join(':');
  const cached = renderCache.get(cacheKey);
  if (cached) {
    return {
      lines: cached,
      diagnostics: diagnostics(startedAt, cached.length)
    };
  }

  const sourceLines = getSongDisplayLines(song);
  const renderedLines = sourceLines.map((line) => renderLine(line, options));
  const metadataLines = classifySongMetadataLines(song, renderedLines);
  const lines = song.displayPreference === 'chords-over' ? renderChordOverTextPairs(metadataLines, options) : metadataLines;
  renderCache.set(cacheKey, lines);

  if (renderCache.size > 80) {
    const oldestKey = renderCache.keys().next().value;
    if (oldestKey) renderCache.delete(oldestKey);
  }

  return {
    lines,
    diagnostics: diagnostics(startedAt, lines.length)
  };
}

function renderChordOverTextPairs(lines: RenderedLine[], options: RenderOptions): RenderedLine[] {
  const result: RenderedLine[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1];
    const text = line.type === 'lyrics' ? plainText(line) : '';

    if (line.type === 'lyrics' && nextLine?.type === 'lyrics' && isStandaloneChordLine(text)) {
      result.push({
        type: 'chord-over',
        raw: `${line.raw}\n${nextLine.raw}`,
        chordLine: transformChordTextLine(text, options),
        lyricLine: markupText(nextLine)
      });
      index += 1;
      continue;
    }

    if (line.type === 'lyrics' && isStandaloneChordLine(text)) {
      result.push({
        type: 'chord-over',
        raw: line.raw,
        chordLine: transformChordTextLine(text, options),
        lyricLine: ''
      });
      continue;
    }

    result.push(line);
  }

  return result;
}

function classifySongMetadataLines(song: Song, lines: RenderedLine[]): RenderedLine[] {
  const result: RenderedLine[] = [];
  const title = song.title?.trim() ?? '';
  const artist = song.artist?.trim() ?? '';
  const subtitle = song.subtitle?.trim() ?? '';
  const hasTitleDirective = lines.some((line) => line.type === 'directive' && line.name === 'title' && line.value.trim().length > 0);
  const hasArtistDirective = lines.some((line) => line.type === 'directive' && line.name === 'artist' && line.value.trim().length > 0);
  const leadingPlainHeaderTexts = collectLeadingPlainHeaderTexts(lines);
  const hasPlainHeaderPair = leadingPlainHeaderTexts.length >= 2;
  let titleRendered = false;
  let artistRendered = false;
  let leadingMetadataRegion = true;
  let leadingPlainHeaderLineCount = 0;

  lines.forEach((line) => {
    if (line.type === 'directive' && line.name === 'title') {
      if (!titleRendered && (title || line.value)) {
        result.push({ type: 'song-title', raw: line.raw, value: title || line.value });
        titleRendered = true;
      }
      return;
    }

    if (line.type === 'directive' && line.name === 'artist') {
      if (!artistRendered && (artist || line.value)) {
        result.push({ type: 'song-artist', raw: line.raw, value: artist || line.value });
        artistRendered = true;
      }
      return;
    }

    if (line.type === 'directive' && line.name === 'subtitle' && !hasArtistDirective) {
      if (!artistRendered && (artist || line.value)) {
        result.push({ type: 'song-artist', raw: line.raw, value: artist || line.value });
        artistRendered = true;
      }
      return;
    }

    if (leadingMetadataRegion && line.type === 'lyrics' && !line.tokens.some((token) => token.type === 'chord')) {
      const text = plainText(line).trim();
      const isChordOnlyHeaderCandidate = isStandaloneChordLine(text);
      if (text && !isChordOnlyHeaderCandidate && !isStageMetadataLabelText(text)) {
        leadingPlainHeaderLineCount += 1;
        if (!titleRendered && leadingPlainHeaderLineCount === 1 && (sameMetadataText(text, title) || (!hasTitleDirective && hasPlainHeaderPair))) {
          result.push({ type: 'song-title', raw: line.raw, value: title || text });
          titleRendered = true;
          return;
        }
        if (
          titleRendered &&
          !artistRendered &&
          leadingPlainHeaderLineCount === 2 &&
          (sameMetadataText(text, artist) || sameMetadataText(text, subtitle) || (!hasArtistDirective && hasPlainHeaderPair))
        ) {
          result.push({ type: 'song-artist', raw: line.raw, value: artist || subtitle || text });
          artistRendered = true;
          return;
        }
      }
    }

    if (leadingMetadataRegion && line.type !== 'blank' && line.type !== 'comment') {
      const isVisibleMetadataDirective = line.type === 'directive' && ['subtitle', 'album'].includes(line.name);
      if (!isVisibleMetadataDirective) leadingMetadataRegion = false;
    }

    result.push(line);
  });

  return result;
}

function collectLeadingPlainHeaderTexts(lines: RenderedLine[]) {
  const texts: string[] = [];
  for (const line of lines) {
    if (line.type === 'blank' || line.type === 'comment') continue;
    if (line.type !== 'lyrics' || line.tokens.some((token) => token.type === 'chord')) break;

    const text = plainText(line).trim();
    if (!text || isStandaloneChordLine(text) || isStageMetadataLabelText(text)) break;
    texts.push(text);
    if (texts.length >= 2) break;
  }
  return texts;
}

function isStageMetadataLabelText(text: string) {
  return /^(?:midi(?:-index)?|key|capo|source file|tempo|bpm)\s*:/i.test(text.trim());
}

export function preloadSongs(songs: Song[], options: RenderOptions) {
  const startedAt = performance.now();
  songs.forEach((song) => renderSong(song, options));
  return performance.now() - startedAt;
}

export function getRenderCacheSize() {
  return renderCache.size;
}

export function clearRenderCache() {
  renderCache.clear();
}

function renderLine(line: ParsedChordProLine, options: RenderOptions): RenderedLine {
  if (line.type === 'directive') return { ...line, name: normalizeDisplayDirectiveName(line.name) };
  if (line.type !== 'lyrics') return line;

  return {
    type: 'lyrics',
    raw: line.raw,
    tokens: line.tokens.map((token) => {
      if (token.type === 'text') return { ...token, display: token.value };
      if (isHarmonyTag(token.value)) return { type: 'text', value: `[${token.value}]`, display: `[${token.value}]` };
      const transposed = applyPerformanceChordTransform(token.value, options.transpose, options.capo);
      return {
        ...token,
        display: options.showNashvilleNumbers ? chordToNashville(transposed, options.songKey) : transposed
      };
    })
  };
}

function diagnostics(startedAt: number, parsedLineCount: number): RenderDiagnostics {
  return {
    lastRenderMs: Number((performance.now() - startedAt).toFixed(2)),
    lastParseMs: 0,
    renderCacheSize: renderCache.size,
    parsedLineCount
  };
}

function getSongDisplayLines(song: Song): ParsedChordProLine[] {
  return (
    song.parsedChordPro?.lines ??
    song.chart.split(/\r?\n/).map<ParsedChordProLine>((line) => parseFallbackDisplayLine(line))
  );
}

function parseFallbackDisplayLine(line: string): ParsedChordProLine {
  const trimmed = line.trim();
  if (!trimmed) return { type: 'blank', raw: line };

  const directiveMatch = trimmed.match(/^\{\s*([^:}]+)\s*(?::\s*([^}]*))?\}$/);
  if (directiveMatch) {
    const name = normalizeDisplayDirectiveName(directiveMatch[1]);
    const value = directiveMatch[2]?.trim() ?? '';
    return { type: 'directive', raw: line, name, value };
  }

  return { type: 'lyrics', raw: line, tokens: parseFallbackTokens(line) };
}

function normalizeDisplayDirectiveName(name: string) {
  const lower = name.trim().toLowerCase();
  if (lower === 't') return 'title';
  if (lower === 'st') return 'subtitle';
  return lower;
}

function parseFallbackTokens(line: string): Extract<ParsedChordProLine, { type: 'lyrics' }>['tokens'] {
  const tokens: Extract<ParsedChordProLine, { type: 'lyrics' }>['tokens'] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) tokens.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    if (isHarmonyTag(match[1])) {
      tokens.push({ type: 'text', value: match[0] });
      lastIndex = regex.lastIndex;
      continue;
    }
    tokens.push({ type: 'chord', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) tokens.push({ type: 'text', value: line.slice(lastIndex) });
  return tokens.length > 0 ? tokens : [{ type: 'text', value: line }];
}

function plainText(line: Extract<RenderedLine, { type: 'lyrics' }>) {
  return stripHarmonyMarkup(line.tokens.map((token) => token.display).join(''));
}

function markupText(line: Extract<RenderedLine, { type: 'lyrics' }>) {
  return line.tokens.map((token) => token.display).join('');
}

function isStandaloneChordLine(line: string) {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 && parts.every((part) => {
    const chord = chordFromDelimitedToken(part);
    return isChordStructureToken(part) || (Boolean(chord) && isChordSymbol(chord));
  });
}

function transformChordTextLine(line: string, options: RenderOptions) {
  return line.replace(/\S+/g, (part) => {
    const chord = chordFromDelimitedToken(part);
    if (!chord || !isChordSymbol(chord)) return part;
    const transposed = applyPerformanceChordTransform(chord, options.transpose, options.capo);
    const display = options.showNashvilleNumbers ? chordToNashville(transposed, options.songKey) : transposed;
    return part.replace(chord, display);
  });
}

function chordFromDelimitedToken(value: string) {
  if (isChordStructureToken(value)) return '';
  const match = value.match(/^([|:({\[]*)(.*?)([|:)}\]]*)$/);
  return match?.[2] ?? value;
}

function isChordStructureToken(value: string) {
  return /^(?:\|+|:+|\|:|:\||%|x\d+)$/i.test(value);
}

function isChordSymbol(value: string) {
  return /^[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?(?:\/[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*)?$/i.test(value);
}

function sameMetadataText(left: string, right: string) {
  return normalizeMetadataText(left) === normalizeMetadataText(right);
}

function normalizeMetadataText(value: string) {
  return stripHarmonyMarkup(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return hash.toString(36);
}
