import { markHarmonyRange, removeHarmonyRange } from './harmony';

export type StageHarmonyEditOperation = 'mark' | 'remove';

export function applyStageHarmonyEdit(chart: string, start: number, end: number, operation: StageHarmonyEditOperation) {
  return operation === 'mark'
    ? markHarmonyRange(chart, start, end)
    : removeHarmonyRange(chart, start, end);
}
