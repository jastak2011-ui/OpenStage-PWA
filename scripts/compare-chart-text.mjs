import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

const args = process.argv.slice(2);

if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
  console.log(`Usage:
  node scripts/compare-chart-text.mjs <new-working-chart.txt> <old-failing-chart.txt> [--out-dir chart-diff]

Outputs:
  - new-harmony-visible.txt
  - new-harmony-escaped.txt
  - old-harmony-visible.txt
  - old-harmony-escaped.txt
  - chart-text-diff.json
`);
  process.exit(args.length < 2 ? 1 : 0);
}

const [newChartPath, oldChartPath] = args;
const outDir = resolve(optionValue('--out-dir') || 'chart-diff');

const newBuffer = await readFile(resolve(newChartPath));
const oldBuffer = await readFile(resolve(oldChartPath));
const newText = newBuffer.toString('utf8');
const oldText = oldBuffer.toString('utf8');

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, 'new-harmony-visible.txt'), visibleText(newText));
await writeFile(resolve(outDir, 'new-harmony-escaped.txt'), escapedText(newText));
await writeFile(resolve(outDir, 'old-harmony-visible.txt'), visibleText(oldText));
await writeFile(resolve(outDir, 'old-harmony-escaped.txt'), escapedText(oldText));

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {
    newWorking: resolve(newChartPath),
    oldFailing: resolve(oldChartPath)
  },
  firstDifferingByte: firstDifferingByte(newBuffer, oldBuffer),
  firstDifferingCodePoint: firstDifferingCodePoint(newText, oldText),
  newWorking: analyzeChart(newText, newBuffer, basename(newChartPath)),
  oldFailing: analyzeChart(oldText, oldBuffer, basename(oldChartPath)),
  lineDiffs: compareLines(newText, oldText),
  chordTokenDiffs: compareArray('chordTokens', chordTokens(newText), chordTokens(oldText)),
  metadataLineDiffs: compareArray('metadataLines', metadataLines(newText), metadataLines(oldText))
};

await writeFile(resolve(outDir, 'chart-text-diff.json'), JSON.stringify(report, null, 2));

console.log(JSON.stringify({
  outDir,
  firstDifferingByte: report.firstDifferingByte,
  firstDifferingCodePoint: report.firstDifferingCodePoint,
  newInvisibleCount: report.newWorking.invisibleCharacters.length,
  oldInvisibleCount: report.oldFailing.invisibleCharacters.length,
  files: [
    'new-harmony-visible.txt',
    'new-harmony-escaped.txt',
    'old-harmony-visible.txt',
    'old-harmony-escaped.txt',
    'chart-text-diff.json'
  ]
}, null, 2));

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : '';
}

function analyzeChart(text, buffer, fileName) {
  return {
    fileName,
    byteLength: buffer.length,
    charLength: text.length,
    lineEndingSummary: lineEndingSummary(text),
    unicodeNormalization: unicodeNormalization(text),
    unmatchedMarkers: unmatchedMarkers(text),
    repeatedBlankLineRuns: repeatedBlankLineRuns(text),
    trailingWhitespaceLines: trailingWhitespaceLines(text),
    invisibleCharacters: invisibleCharacters(text),
    utf8Bytes: byteReport(buffer),
    codePoints: codePointReport(text),
    escaped: escapedText(text),
    lines: text.split(/\r\n|\r|\n/).map((line, index) => ({
      lineNumber: index + 1,
      text: line,
      escaped: escapedText(line),
      trailingWhitespace: /[ \t]+$/.test(line),
      chordTokens: chordTokens(line),
      metadata: metadataLine(line)
    })),
    chordTokens: chordTokens(text),
    metadataLines: metadataLines(text)
  };
}

function firstDifferingByte(left, right) {
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

function firstDifferingCodePoint(left, right) {
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

function compareLines(left, right) {
  const leftLines = left.split(/\r\n|\r|\n/);
  const rightLines = right.split(/\r\n|\r|\n/);
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

function compareArray(label, left, right) {
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

function lineDetail(line) {
  if (line === undefined) return null;
  return {
    text: line,
    escaped: escapedText(line),
    codePoints: codePointReport(line),
    utf8Bytes: byteReport(Buffer.from(line, 'utf8'))
  };
}

function visibleText(text) {
  return text
    .replace(/\u200B/g, '[U+200B ZERO WIDTH SPACE]')
    .replace(/\uE000/g, '[U+E000 PRIVATE USE]')
    .replace(/\r/g, '[CR]')
    .replace(/\t/g, '[TAB]');
}

function escapedText(text) {
  return JSON.stringify(text);
}

function byteReport(buffer) {
  return Array.from(buffer).map((byte, index) => ({
    index,
    hex: hexByte(byte),
    decimal: byte
  }));
}

function codePointReport(text) {
  const output = [];
  for (let index = 0; index < text.length; index += 1) {
    const codePoint = text.codePointAt(index);
    const char = String.fromCodePoint(codePoint);
    output.push({
      index,
      char,
      codePoint: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
      utf8Bytes: byteReport(Buffer.from(char, 'utf8')).map((item) => item.hex)
    });
    if (codePoint > 0xffff) index += 1;
  }
  return output;
}

function invisibleCharacters(text) {
  return codePointReport(text).filter((item) => {
    const value = item.char.codePointAt(0);
    return (
      value === 0x200b ||
      value === 0xe000 ||
      value === 0xfeff ||
      value === 0x200c ||
      value === 0x200d ||
      value === 0x2060 ||
      value < 0x20 && value !== 0x09 && value !== 0x0a && value !== 0x0d
    );
  });
}

function trailingWhitespaceLines(text) {
  return text.split(/\r\n|\r|\n/)
    .map((line, index) => ({ lineNumber: index + 1, trailingWhitespace: line.match(/[ \t]+$/)?.[0] ?? '' }))
    .filter((line) => line.trailingWhitespace.length > 0);
}

function repeatedBlankLineRuns(text) {
  const lines = text.split(/\r\n|\r|\n/);
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

function lineEndingSummary(text) {
  return {
    crlf: (text.match(/\r\n/g) ?? []).length,
    lf: (text.replace(/\r\n/g, '').match(/\n/g) ?? []).length,
    cr: (text.replace(/\r\n/g, '').match(/\r/g) ?? []).length
  };
}

function unicodeNormalization(text) {
  return {
    isNFC: text === text.normalize('NFC'),
    isNFD: text === text.normalize('NFD'),
    isNFKC: text === text.normalize('NFKC'),
    isNFKD: text === text.normalize('NFKD')
  };
}

function unmatchedMarkers(text) {
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

function chordTokens(text) {
  const output = [];
  const chordPattern = /\[([^\]]+)\]|(?<!\S)([A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+/-])*?)(?!\S)/g;
  text.split(/\r\n|\r|\n/).forEach((line, lineIndex) => {
    let match;
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

function metadataLines(text) {
  return text.split(/\r\n|\r|\n/)
    .map((line, index) => ({ lineNumber: index + 1, ...metadataLine(line) }))
    .filter((line) => line.isMetadata);
}

function metadataLine(line) {
  const match = line.match(/^\s*([A-Za-z][A-Za-z0-9 _-]{0,40})\s*:\s*(.*?)\s*$/);
  return match
    ? { isMetadata: true, key: match[1], value: match[2], escaped: escapedText(line) }
    : { isMetadata: false };
}

function hexByte(byte) {
  return `0x${byte.toString(16).toUpperCase().padStart(2, '0')}`;
}
