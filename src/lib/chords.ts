const noteOrder = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const flatToSharp: Record<string, string> = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#'
};

const nashvilleScale = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

export type ChartToken =
  | { type: 'chord'; value: string; transposed: string }
  | { type: 'text'; value: string }
  | { type: 'directive'; value: string };

export function transposeChord(chord: string, semitones: number): string {
  if (chord.includes('/')) {
    return chord
      .split('/')
      .map((part) => transposeChord(part, semitones))
      .join('/');
  }

  const match = chord.match(/^([A-G](?:#|b)?)(.*)$/);
  if (!match) return chord;

  const root = flatToSharp[match[1]] ?? match[1];
  const index = noteOrder.indexOf(root);
  if (index === -1) return chord;

  const next = (index + semitones + 1200) % 12;
  return `${noteOrder[next]}${match[2]}`;
}

export function applyPerformanceChordTransform(chord: string, transposeAmount: number, capoAmount: number): string {
  return transposeChord(chord, transposeAmount - capoAmount);
}

export function chordToNashville(chord: string, key: string): string {
  if (chord.includes('/')) {
    return chord
      .split('/')
      .map((part) => chordToNashville(part, key))
      .join('/');
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

function suffixToNashville(suffix: string) {
  return suffix.replace(/^maj/i, 'maj').replace(/^m(?!aj)/, 'm');
}

export function parseChordLine(line: string, semitones: number): ChartToken[] {
  if (/^\{.+\}$/.test(line.trim())) {
    return [{ type: 'directive', value: line.replace(/[{}]/g, '').trim() }];
  }

  const tokens: ChartToken[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', value: line.slice(lastIndex, match.index) });
    }
    tokens.push({ type: 'chord', value: match[1], transposed: transposeChord(match[1], semitones) });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: 'text', value: line.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: 'text', value: line }];
}
