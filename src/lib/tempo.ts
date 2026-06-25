export type TempoDotTone = 'gold' | 'purple' | 'dim';

export function normalizeTempoBpm(value: unknown) {
  const bpm = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(bpm) && bpm > 0 ? bpm : null;
}

export function tempoIntervalMs(bpm: number) {
  return (60 / bpm) * 1000;
}

export function nextTempoBeat(current: number | null) {
  return current === null ? 0 : (current + 1) % 4;
}

export function tempoDotTone(dotIndex: number, activeBeat: number | null): TempoDotTone {
  if (activeBeat !== dotIndex) return 'dim';
  return dotIndex === 0 ? 'gold' : 'purple';
}
