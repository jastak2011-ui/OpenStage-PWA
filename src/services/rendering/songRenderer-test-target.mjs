// src/lib/chords.ts
var noteOrder = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
var flatToSharp = {
  Db: "C#",
  Eb: "D#",
  Gb: "F#",
  Ab: "G#",
  Bb: "A#"
};
var nashvilleScale = ["1", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
function transposeChord(chord, semitones) {
  if (chord.includes("/")) {
    return chord.split("/").map((part) => transposeChord(part, semitones)).join("/");
  }
  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return chord;
  const root = flatToSharp[match[1]] ?? match[1];
  const index = noteOrder.indexOf(root);
  if (index === -1) return chord;
  const next = (index + semitones + 1200) % 12;
  return `${noteOrder[next]}${match[2]}`;
}
function applyPerformanceChordTransform(chord, transposeAmount, capoAmount) {
  return transposeChord(chord, transposeAmount - capoAmount);
}
function chordToNashville(chord, key) {
  if (chord.includes("/")) {
    return chord.split("/").map((part) => chordToNashville(part, key)).join("/");
  }
  const chordMatch = chord.match(/^([A-G](?:#|b)?)(.*)$/);
  const keyMatch = key.match(/^([A-G](?:#|b)?)/);
  if (!chordMatch || !keyMatch) return chord;
  const chordRoot = flatToSharp[chordMatch[1]] ?? chordMatch[1];
  const keyRoot = flatToSharp[keyMatch[1]] ?? keyMatch[1];
  const chordIndex = noteOrder.indexOf(chordRoot);
  const keyIndex = noteOrder.indexOf(keyRoot);
  if (chordIndex === -1 || keyIndex === -1) return chord;
  const interval = (chordIndex - keyIndex + 12) % 12;
  return `${nashvilleScale[interval]}${suffixToNashville(chordMatch[2])}`;
}
function suffixToNashville(suffix) {
  return suffix.replace(/^maj/i, "maj").replace(/^m(?!aj)/, "m");
}

// src/lib/harmony.ts
var harmonyStartTag = "[HARMONY]";
var harmonyTagPattern = /\[\/?HARMONY\]/gi;
function isHarmonyTag(value) {
  return /^\/?HARMONY$/i.test(value.trim());
}
function parseHarmonyText(input) {
  const ranges = [];
  let text = "";
  let cursor = 0;
  let activeStart = null;
  let match;
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
function stripHarmonyMarkup(input) {
  return parseHarmonyText(input).text;
}

// src/services/rendering/songRenderer.ts
var renderCache = /* @__PURE__ */ new Map();
function renderSong(song, options) {
  const startedAt = performance.now();
  const chartSignature = hashString(song.chart ?? "");
  const cacheKey = [
    song.id,
    song.updatedAt,
    chartSignature,
    song.displayPreference ?? "inline",
    options.transpose,
    options.capo,
    options.showNashvilleNumbers,
    options.songKey,
    options.activeProfile ?? "",
    options.lyricFontSize ?? "",
    options.lineSpacing ?? "",
    options.chordFontSize ?? "",
    options.headerFontSize ?? "",
    options.songTitleFontSize ?? "",
    options.songArtistFontSize ?? "",
    options.sectionFontSize ?? "",
    options.sectionSpacingBefore ?? "",
    options.sectionSpacingAfter ?? "",
    options.viewportWidth ?? "",
    options.displayMode ?? ""
  ].join(":");
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
  const lines = song.displayPreference === "chords-over" ? renderChordOverTextPairs(metadataLines, options) : metadataLines;
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
function renderChordOverTextPairs(lines, options) {
  const result = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const nextLine = lines[index + 1];
    const text = line.type === "lyrics" ? plainText(line) : "";
    if (line.type === "lyrics" && nextLine?.type === "lyrics" && isStandaloneChordLine(text)) {
      result.push({
        type: "chord-over",
        raw: `${line.raw}
${nextLine.raw}`,
        sourceStart: line.sourceStart,
        chordSourceStart: line.sourceStart,
        lyricSourceStart: nextLine.sourceStart,
        chordLine: transformChordTextLine(text, options),
        lyricLine: markupText(nextLine)
      });
      index += 1;
      continue;
    }
    if (line.type === "lyrics" && isStandaloneChordLine(text)) {
      result.push({
        type: "chord-over",
        raw: line.raw,
        sourceStart: line.sourceStart,
        chordSourceStart: line.sourceStart,
        chordLine: transformChordTextLine(text, options),
        lyricLine: ""
      });
      continue;
    }
    result.push(line);
  }
  return result;
}
function classifySongMetadataLines(song, lines) {
  const result = [];
  const title = song.title?.trim() ?? "";
  const artist = song.artist?.trim() ?? "";
  const subtitle = song.subtitle?.trim() ?? "";
  const hasTitleDirective = lines.some((line) => line.type === "directive" && line.name === "title" && line.value.trim().length > 0);
  const hasArtistDirective = lines.some((line) => line.type === "directive" && line.name === "artist" && line.value.trim().length > 0);
  const leadingPlainHeaderTexts = collectLeadingPlainHeaderTexts(lines);
  const hasPlainHeaderPair = leadingPlainHeaderTexts.length >= 2;
  let titleRendered = false;
  let artistRendered = false;
  let leadingMetadataRegion = true;
  let leadingPlainHeaderLineCount = 0;
  lines.forEach((line) => {
    if (line.type === "directive" && line.name === "title") {
      if (!titleRendered && (title || line.value)) {
        result.push({ type: "song-title", raw: line.raw, value: title || line.value, sourceStart: line.sourceStart });
        titleRendered = true;
      }
      return;
    }
    if (line.type === "directive" && line.name === "artist") {
      if (!artistRendered && (artist || line.value)) {
        result.push({ type: "song-artist", raw: line.raw, value: artist || line.value, sourceStart: line.sourceStart });
        artistRendered = true;
      }
      return;
    }
    if (line.type === "directive" && line.name === "subtitle" && !hasArtistDirective) {
      if (!artistRendered && (artist || line.value)) {
        result.push({ type: "song-artist", raw: line.raw, value: artist || line.value, sourceStart: line.sourceStart });
        artistRendered = true;
      }
      return;
    }
    if (leadingMetadataRegion && line.type === "lyrics" && !line.tokens.some((token) => token.type === "chord")) {
      const text = plainText(line).trim();
      const isChordOnlyHeaderCandidate = isStandaloneChordLine(text);
      if (text && !isChordOnlyHeaderCandidate && !isStageMetadataLabelText(text)) {
        leadingPlainHeaderLineCount += 1;
        if (!titleRendered && leadingPlainHeaderLineCount === 1 && (sameMetadataText(text, title) || !hasTitleDirective && hasPlainHeaderPair)) {
          result.push({ type: "song-title", raw: line.raw, value: title || text, sourceStart: line.sourceStart });
          titleRendered = true;
          return;
        }
        if (titleRendered && !artistRendered && leadingPlainHeaderLineCount === 2 && (sameMetadataText(text, artist) || sameMetadataText(text, subtitle) || !hasArtistDirective && hasPlainHeaderPair)) {
          result.push({ type: "song-artist", raw: line.raw, value: artist || subtitle || text, sourceStart: line.sourceStart });
          artistRendered = true;
          return;
        }
      }
    }
    if (leadingMetadataRegion && line.type !== "blank" && line.type !== "comment") {
      const isVisibleMetadataDirective = line.type === "directive" && ["subtitle", "album"].includes(line.name);
      if (!isVisibleMetadataDirective) leadingMetadataRegion = false;
    }
    result.push(line);
  });
  return result;
}
function collectLeadingPlainHeaderTexts(lines) {
  const texts = [];
  for (const line of lines) {
    if (line.type === "blank" || line.type === "comment") continue;
    if (line.type !== "lyrics" || line.tokens.some((token) => token.type === "chord")) break;
    const text = plainText(line).trim();
    if (!text || isStandaloneChordLine(text) || isStageMetadataLabelText(text)) break;
    texts.push(text);
    if (texts.length >= 2) break;
  }
  return texts;
}
function isStageMetadataLabelText(text) {
  return /^(?:midi(?:-index)?|key|capo|source file|tempo|bpm)\s*:/i.test(text.trim());
}
function preloadSongs(songs, options) {
  const startedAt = performance.now();
  songs.forEach((song) => renderSong(song, options));
  return performance.now() - startedAt;
}
function getRenderCacheSize() {
  return renderCache.size;
}
function clearRenderCache() {
  renderCache.clear();
}
function renderLine(line, options) {
  if (line.type === "directive") return { ...line, name: normalizeDisplayDirectiveName(line.name) };
  if (line.type !== "lyrics") return line;
  let tokenCursor = 0;
  return {
    type: "lyrics",
    raw: line.raw,
    sourceStart: line.sourceStart,
    tokens: line.tokens.map((token) => {
      const needle = token.type === "chord" ? `[${token.value}]` : token.value;
      const tokenIndex = line.raw.indexOf(needle, tokenCursor);
      if (tokenIndex >= 0) tokenCursor = tokenIndex + needle.length;
      const sourceStart = typeof line.sourceStart === "number" && tokenIndex >= 0 ? line.sourceStart + tokenIndex + (token.type === "chord" ? 1 : 0) : void 0;
      if (token.type === "text") return { ...token, display: token.value, sourceStart };
      if (isHarmonyTag(token.value)) return { type: "text", value: `[${token.value}]`, display: `[${token.value}]`, sourceStart };
      const transposed = applyPerformanceChordTransform(token.value, options.transpose, options.capo);
      return {
        ...token,
        sourceStart,
        display: options.showNashvilleNumbers ? chordToNashville(transposed, options.songKey) : transposed
      };
    })
  };
}
function diagnostics(startedAt, parsedLineCount) {
  return {
    lastRenderMs: Number((performance.now() - startedAt).toFixed(2)),
    lastParseMs: 0,
    renderCacheSize: renderCache.size,
    parsedLineCount
  };
}
function getSongDisplayLines(song) {
  const lines = song.parsedChordPro?.lines ?? song.chart.split(/\r?\n/).map((line) => parseFallbackDisplayLine(line));
  return attachSourceStarts(lines, song.chart ?? "");
}
function attachSourceStarts(lines, chart) {
  let cursor = 0;
  return lines.map((line) => {
    const found = chart.indexOf(line.raw, cursor);
    const sourceStart = found >= 0 ? found : cursor;
    cursor = sourceStart + line.raw.length;
    const breakMatch = chart.slice(cursor).match(/^\r?\n/);
    if (breakMatch) cursor += breakMatch[0].length;
    return { ...line, sourceStart };
  });
}
function parseFallbackDisplayLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return { type: "blank", raw: line };
  const directiveMatch = trimmed.match(/^\{\s*([^:}]+)\s*(?::\s*([^}]*))?\}$/);
  if (directiveMatch) {
    const name = normalizeDisplayDirectiveName(directiveMatch[1]);
    const value = directiveMatch[2]?.trim() ?? "";
    return { type: "directive", raw: line, name, value };
  }
  return { type: "lyrics", raw: line, tokens: parseFallbackTokens(line) };
}
function normalizeDisplayDirectiveName(name) {
  const lower = name.trim().toLowerCase();
  if (lower === "t") return "title";
  if (lower === "st") return "subtitle";
  return lower;
}
function parseFallbackTokens(line) {
  const tokens = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) tokens.push({ type: "text", value: line.slice(lastIndex, match.index) });
    if (isHarmonyTag(match[1])) {
      tokens.push({ type: "text", value: match[0] });
      lastIndex = regex.lastIndex;
      continue;
    }
    tokens.push({ type: "chord", value: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < line.length) tokens.push({ type: "text", value: line.slice(lastIndex) });
  return tokens.length > 0 ? tokens : [{ type: "text", value: line }];
}
function plainText(line) {
  return stripHarmonyMarkup(line.tokens.map((token) => token.display).join(""));
}
function markupText(line) {
  return line.tokens.map((token) => token.display).join("");
}
function isStandaloneChordLine(line) {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 && parts.every((part) => {
    const chord = chordFromDelimitedToken(part);
    return isChordStructureToken(part) || Boolean(chord) && isChordSymbol(chord);
  });
}
function transformChordTextLine(line, options) {
  return line.replace(/\S+/g, (part) => {
    const chord = chordFromDelimitedToken(part);
    if (!chord || !isChordSymbol(chord)) return part;
    const transposed = applyPerformanceChordTransform(chord, options.transpose, options.capo);
    const display = options.showNashvilleNumbers ? chordToNashville(transposed, options.songKey) : transposed;
    return part.replace(chord, display);
  });
}
function chordFromDelimitedToken(value) {
  if (isChordStructureToken(value)) return "";
  const match = value.match(/^([|:({\[]*)(.*?)([|:)}\]]*)$/);
  return match?.[2] ?? value;
}
function isChordStructureToken(value) {
  return /^(?:\|+|:+|\|:|:\||%|x\d+)$/i.test(value);
}
function isChordSymbol(value) {
  return /^[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?(?:\/[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*)?$/i.test(value);
}
function sameMetadataText(left, right) {
  return normalizeMetadataText(left) === normalizeMetadataText(right);
}
function normalizeMetadataText(value) {
  return stripHarmonyMarkup(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
}
function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = hash * 31 + value.charCodeAt(index) | 0;
  }
  return hash.toString(36);
}
export {
  clearRenderCache,
  getRenderCacheSize,
  preloadSongs,
  renderSong
};
