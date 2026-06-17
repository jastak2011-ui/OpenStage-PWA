import { applyPerformanceChordTransform, chordToNashville } from '../../lib/chords';
import type { ParsedChordProLine, RenderDiagnostics, Song } from '../../types';

export type RenderOptions = {
  transpose: number;
  capo: number;
  showNashvilleNumbers: boolean;
  songKey: string;
  lyricFontSize?: number;
  lineSpacing?: number;
  viewportWidth?: number;
  displayMode?: string;
};

export type RenderedLine =
  | { type: 'blank'; raw: string }
  | { type: 'comment'; raw: string; text: string }
  | { type: 'section'; raw: string; section: string; boundary: 'start' | 'end' }
  | { type: 'directive'; raw: string; name: string; value: string }
  | { type: 'chord-over'; raw: string; chordLine: string; lyricLine: string }
  | { type: 'lyrics'; raw: string; tokens: Array<{ type: 'text' | 'chord'; value: string; display: string }> };

const renderCache = new Map<string, RenderedLine[]>();

export function renderSong(song: Song, options: RenderOptions) {
  const startedAt = performance.now();
  const cacheKey = [
    song.id,
    song.updatedAt,
    song.displayPreference ?? 'inline',
    options.transpose,
    options.capo,
    options.showNashvilleNumbers,
    options.songKey,
    options.lyricFontSize ?? '',
    options.lineSpacing ?? '',
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
  const lines = song.displayPreference === 'chords-over' ? renderChordOverTextPairs(renderedLines, options) : renderedLines;
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
        lyricLine: plainText(nextLine)
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
  if (line.type !== 'lyrics') return line;

  return {
    type: 'lyrics',
    raw: line.raw,
    tokens: line.tokens.map((token) => {
      if (token.type === 'text') return { ...token, display: token.value };
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
    song.chart.split(/\r?\n/).map<ParsedChordProLine>((line) =>
      line.trim() ? { type: 'lyrics', raw: line, tokens: parseFallbackTokens(line) } : { type: 'blank', raw: line }
    )
  );
}

function parseFallbackTokens(line: string): Extract<ParsedChordProLine, { type: 'lyrics' }>['tokens'] {
  const tokens: Extract<ParsedChordProLine, { type: 'lyrics' }>['tokens'] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) tokens.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    tokens.push({ type: 'chord', value: match[1] });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) tokens.push({ type: 'text', value: line.slice(lastIndex) });
  return tokens.length > 0 ? tokens : [{ type: 'text', value: line }];
}

function plainText(line: Extract<RenderedLine, { type: 'lyrics' }>) {
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
