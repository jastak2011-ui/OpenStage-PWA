export type SearchImportCandidate = {
  recordingMbid: string;
  title: string;
  artist: string;
  artistMbid?: string;
  releaseTitle?: string;
  releaseMbid?: string;
  releaseDate?: string;
  durationMs?: number | null;
  disambiguation?: string;
  score?: number;
  matchSummary?: string;
};

export type SearchImportPrefill = {
  id: string;
  title: string;
  artist: string;
  recordingMbid?: string;
  artistMbid?: string;
  releaseMbid?: string;
  releaseTitle?: string;
  releaseDate?: string;
};

export function createSearchImportPrefill(candidate: SearchImportCandidate): SearchImportPrefill {
  return {
    id: `${candidate.recordingMbid || candidate.title}-${Date.now()}`,
    title: candidate.title,
    artist: candidate.artist,
    recordingMbid: candidate.recordingMbid,
    artistMbid: candidate.artistMbid,
    releaseMbid: candidate.releaseMbid,
    releaseTitle: candidate.releaseTitle,
    releaseDate: candidate.releaseDate
  };
}

export function createPasteChartPrefillText(prefill: SearchImportPrefill) {
  return [prefill.title.trim(), prefill.artist.trim(), ''].filter((line, index) => index < 2 ? Boolean(line) : true).join('\n');
}

export function releaseYearFromDate(date?: string) {
  return date?.match(/^\d{4}/)?.[0] || '';
}

export function formatDurationMs(durationMs?: number | null) {
  if (!durationMs || durationMs <= 0) return '';
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
