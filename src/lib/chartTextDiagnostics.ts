export type ChartTextComparisonInput = {
  label: string;
  text: string;
};

export type ChartTextDiffReport = ReturnType<typeof compareChartTexts>;

const textEncoder = new TextEncoder();

export function compareChartTexts(newWorking: ChartTextComparisonInput, oldFailing: ChartTextComparisonInput) {
  const newBytes = encodeUtf8(newWorking.text);
  const oldBytes = encodeUtf8(oldFailing.text);

  return {
    generatedAt: new Date().toISOString(),
    source: 'stored-openstage-song-chart-text',
    inputs: {
      newWorking: newWorking.label,
      oldFailing: oldFailing.label
    },
    firstDifferingByte: firstDifferingByte(newBytes, oldBytes),
    firstDifferingCodePoint: firstDifferingCodePoint(newWorking.text, oldFailing.text),
    newWorking: analyzeChart(newWorking.text, newBytes, newWorking.label),
    oldFailing: analyzeChart(oldFailing.text, oldBytes, oldFailing.label),
    lineDiffs: compareLines(newWorking.text, oldFailing.text),
    chordTokenDiffs: compareArray('chordTokens', chordTokens(newWorking.text), chordTokens(oldFailing.text)),
    metadataLineDiffs: compareArray('metadataLines', metadataLines(newWorking.text), metadataLines(oldFailing.text))
  };
}

export function visibleChartText(text: string) {
  return text
    .replace(/\u200B/g, '[U+200B ZERO WIDTH SPACE]')
    .replace(/\uE000/g, '[U+E000 PRIVATE USE]')
    .replace(/\r/g, '[CR]')
    .replace(/\t/g, '[TAB]');
}

export function escapedChartText(text: string) {
  return JSON.stringify(text);
}

function analyzeChart(text: string, bytes: Uint8Array, label: string) {
  return {
    label,
    byteLength: bytes.length,
    charLength: text.length,
    lineEndingSummary: lineEndingSummary(text),
    unicodeNormalization: unicodeNormalization(text),
    unmatchedMarkers: unmatchedMarkers(text),
    repeatedBlankLineRuns: repeatedBlankLineRuns(text),
    trailingWhitespaceLines: trailingWhitespaceLines(text),
    invisibleCharacters: invisibleCharacters(text),
    utf8Bytes: byteReport(bytes),
    codePoints: codePointReport(text),
    escaped: escapedChartText(text),
    lines: splitLines(text).map((line, index) => ({
      lineNumber: index + 1,
      text: line,
      escaped: escapedChartText(line),
      trailingWhitespace: /[ \t]+$/.test(line),
      chordTokens: chordTokens(line),
      metadata: metadataLine(line)
    })),
    chordTokens: chordTokens(text),
    metadataLines: metadataLines(text)
  };
}

function firstDifferingByte(left: Uint8Array, right: Uint8Array) {
  const length = Math.min(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    if (left[index] !== right[index]) {
      return {
        index,
        newByte: hexByte(left[index]),
        oldByte: hexByte(right[index])
      };
    }
  }
  if (left.length !== right.length) {
    return {
      index: length,
      newByte: left[length] === undefined ? null : hexByte(left[length]),
      oldByte: right[length] === undefined ? null : hexByte(right[length])
    };
  }
  return null;
}

function firstDifferingCodePoint(left: string, right: string) {
  const leftPoints = codePointReport(left);
  const rightPoints = codePointReport(right);
  const length = Math.min(leftPoints.length, rightPoints.length);
  for (let index = 0; index < length; index += 1) {
    if (leftPoints[index].codePoint !== rightPoints[index].codePoint) {
      return {
        index,
        newCodePoint: leftPoints[index],
        oldCodePoint: rightPoints[index]
      };
    }
  }
  if (leftPoints.length !== rightPoints.length) {
    return {
      index: length,
      newCodePoint: leftPoints[length] ?? null,
      oldCodePoint: rightPoints[length] ?? null
    };
  }
  return null;
}

function compareLines(left: string, right: string) {
  const leftLines = splitLines(left);
  const rightLines = splitLines(right);
  const count = Math.max(leftLines.length, rightLines.length);
  const diffs = [];
  for (let index = 0; index < count; index += 1) {
    if (leftLines[index] !== rightLines[index]) {
      diffs.push({
        lineNumber: index + 1,
        newLine: lineDetail(leftLines[index]),
        oldLine: lineDetail(rightLines[index])
      });
    }
  }
  return diffs;
}

function compareArray(label: string, left: unknown[], right: unknown[]) {
  const count = Math.max(left.length, right.length);
  const diffs = [];
  for (let index = 0; index < count; index += 1) {
    if (JSON.stringify(left[index]) !== JSON.stringify(right[index])) {
      diffs.push({
        path: `${label}[${index}]`,
        newValue: left[index] ?? null,
        oldValue: right[index] ?? null
      });
    }
  }
  return diffs;
}

function lineDetail(line: string | undefined) {
  if (line === undefined) return null;
  return {
    text: line,
    escaped: escapedChartText(line),
    codePoints: codePointReport(line),
    utf8Bytes: byteReport(encodeUtf8(line))
  };
}

function byteReport(bytes: Uint8Array) {
  return Array.from(bytes).map((byte, index) => ({
    index,
    hex: hexByte(byte),
    decimal: byte
  }));
}

function codePointReport(text: string) {
  const output = [];
  for (let index = 0; index < text.length; index += 1) {
    const codePoint = text.codePointAt(index);
    if (codePoint === undefined) continue;
    const char = String.fromCodePoint(codePoint);
    output.push({
      index,
      char,
      codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
      utf8Bytes: byteReport(encodeUtf8(char)).map((item) => item.hex)
    });
    if (codePoint > 0xffff) index += 1;
  }
  return output;
}

function invisibleCharacters(text: string) {
  return codePointReport(text).filter((item) => {
    const value = item.char.codePointAt(0);
    return (
      value === 0x200b ||
      value === 0xe000 ||
      value === 0xfeff ||
      value === 0x200c ||
      value === 0x200d ||
      value === 0x2060 ||
      (value !== undefined && value < 0x20 && value !== 0x09 && value !== 0x0a && value !== 0x0d)
    );
  });
}

function trailingWhitespaceLines(text: string) {
  return splitLines(text)
    .map((line, index) => ({ lineNumber: index + 1, trailingWhitespace: line.match(/[ \t]+$/)?.[0] ?? '' }))
    .filter((line) => line.trailingWhitespace.length > 0);
}

function repeatedBlankLineRuns(text: string) {
  const lines = splitLines(text);
  const runs = [];
  let start = -1;
  for (let index = 0; index <= lines.length; index += 1) {
    const blank = index < lines.length && lines[index].trim() === '';
    if (blank && start < 0) start = index;
    if (!blank && start >= 0) {
      const count = index - start;
      if (count > 1) runs.push({ startLine: start + 1, count });
      start = -1;
    }
  }
  return runs;
}

function lineEndingSummary(text: string) {
  return {
    crlf: (text.match(/\r\n/g) ?? []).length,
    lf: (text.replace(/\r\n/g, '').match(/\n/g) ?? []).length,
    cr: (text.replace(/\r\n/g, '').match(/\r/g) ?? []).length
  };
}

function unicodeNormalization(text: string) {
  return {
    isNFC: text === text.normalize('NFC'),
    isNFD: text === text.normalize('NFD'),
    isNFKC: text === text.normalize('NFKC'),
    isNFKD: text === text.normalize('NFKD')
  };
}

function unmatchedMarkers(text: string) {
  const starts = (text.match(/\[HARMONY\]/gi) ?? []).length;
  const ends = (text.match(/\[\/HARMONY\]/gi) ?? []).length;
  const bracketStarts = (text.match(/\[/g) ?? []).length;
  const bracketEnds = (text.match(/\]/g) ?? []).length;
  return {
    harmonyStartTags: starts,
    harmonyEndTags: ends,
    harmonyTagsBalanced: starts === ends,
    openingBrackets: bracketStarts,
    closingBrackets: bracketEnds,
    bracketsBalancedByCount: bracketStarts === bracketEnds
  };
}

function chordTokens(text: string) {
  const output: Array<{
    lineNumber: number;
    index: number;
    token: string;
    raw: string;
    bracketed: boolean;
  }> = [];
  const chordPattern = /\[([^\]]+)\]|(?<!\S)([A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+/-])*?)(?!\S)/g;
  splitLines(text).forEach((line, lineIndex) => {
    let match: RegExpExecArray | null;
    chordPattern.lastIndex = 0;
    while ((match = chordPattern.exec(line)) !== null) {
      output.push({
        lineNumber: lineIndex + 1,
        index: match.index,
        token: match[1] ?? match[2],
        raw: match[0],
        bracketed: Boolean(match[1])
      });
    }
  });
  return output;
}

function metadataLines(text: string) {
  return splitLines(text)
    .map((line, index) => ({ lineNumber: index + 1, ...metadataLine(line) }))
    .filter((line) => line.isMetadata);
}

function metadataLine(line: string) {
  const match = line.match(/^\s*([A-Za-z][A-Za-z0-9 _-]{0,40})\s*:\s*(.*?)\s*$/);
  return match
    ? { isMetadata: true, key: match[1], value: match[2], escaped: escapedChartText(line) }
    : { isMetadata: false };
}

function splitLines(text: string) {
  return text.split(/\r\n|\r|\n/);
}

function encodeUtf8(text: string) {
  return textEncoder.encode(text);
}

function hexByte(byte: number) {
  return `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
