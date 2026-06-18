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
    options.lyricFontSize ?? "",
    options.lineSpacing ?? "",
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
  const lines = song.displayPreference === "chords-over" ? renderChordOverTextPairs(renderedLines, options) : renderedLines;
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
        chordLine: transformChordTextLine(text, options),
        lyricLine: ""
      });
      continue;
    }
    result.push(line);
  }
  return result;
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
  if (line.type !== "lyrics") return line;
  return {
    type: "lyrics",
    raw: line.raw,
    tokens: line.tokens.map((token) => {
      if (token.type === "text") return { ...token, display: token.value };
      if (isHarmonyTag(token.value)) return { type: "text", value: `[${token.value}]`, display: `[${token.value}]` };
      const transposed = applyPerformanceChordTransform(token.value, options.transpose, options.capo);
      return {
        ...token,
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
  return song.parsedChordPro?.lines ?? song.chart.split(/\r?\n/).map(
    (line) => line.trim() ? { type: "lyrics", raw: line, tokens: parseFallbackTokens(line) } : { type: "blank", raw: line }
  );
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
