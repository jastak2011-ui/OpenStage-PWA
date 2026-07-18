import { stripHarmonyMarkup } from './harmony';

export function sanitizeChartForOnSong(chartText: string) {
  return stripHarmonyMarkup(chartText ?? '');
}
