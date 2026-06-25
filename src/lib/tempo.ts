export type TempoDotTone = 'gold' | 'purple' | 'dim';

export const minTempoBpm = 40;
export const maxTempoBpm = 240;

export function normalizeTempoBpm(value: unknown) {
  const bpm = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(bpm) && bpm > 0 ? bpm : null;
}

export function isValidTempoBpm(value: unknown) {
  const bpm = normalizeTempoBpm(value);
  return bpm !== null && bpm >= minTempoBpm && bpm <= maxTempoBpm;
}

export function clampTempoBpm(value: unknown, fallback = 120) {
  const bpm = normalizeTempoBpm(value) ?? fallback;
  return Math.max(minTempoBpm, Math.min(maxTempoBpm, Math.round(bpm)));
}

export function parseTempoBpmInput(value: string) {
  const bpm = Number(value);
  return isValidTempoBpm(bpm) ? Math.round(bpm) : null;
}

export function stepTempoBpm(value: unknown, delta: number) {
  return clampTempoBpm((normalizeTempoBpm(value) ?? 120) + delta, 120);
}

export function shouldOpenTempoAdjustmentPanel(pressDurationMs: number, thresholdMs = 500) {
  return pressDurationMs >= thresholdMs;
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
