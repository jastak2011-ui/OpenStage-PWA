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
  initialChartText?: string;
};

export type SearchImportSessionStep = 'confirmed' | 'find-chart';

export type SearchImportSession = {
  title: string;
  artist: string;
  recordingMbid?: string;
  selectedCandidate?: SearchImportCandidate;
  step: SearchImportSessionStep;
  updatedAt: string;
};

export const searchImportSessionStorageKey = 'openstage.searchImportSession';
export const searchImportConfirmedCopy = 'Song identity verified. Add chart content from a source you provide.';
export const searchImportConfirmedActions = ['Find Chart', 'Paste Chart', 'Cancel'] as const;
export const clipboardUnavailableMessage = 'Clipboard access is not available in this browser. Use Paste Manually.';
export const clipboardRejectedMessage = 'Clipboard access was not granted. Use Paste Manually.';
export const clipboardEmptyMessage = 'Clipboard does not contain chart text.';

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
  if (typeof prefill.initialChartText === 'string') return prefill.initialChartText;
  return [prefill.title.trim(), prefill.artist.trim(), ''].filter((line, index) => index < 2 ? Boolean(line) : true).join('\n');
}

export function createClipboardPastePrefill(prefill: SearchImportPrefill, clipboardText: string): SearchImportPrefill {
  return {
    ...prefill,
    id: `${prefill.id}-clipboard-${Date.now()}`,
    initialChartText: clipboardText
  };
}

export async function readSearchImportClipboardText(clipboard?: { readText?: () => Promise<string> }) {
  if (!clipboard?.readText) {
    return {
      ok: false as const,
      error: clipboardUnavailableMessage
    };
  }

  try {
    const text = await clipboard.readText();
    if (!String(text || '').trim()) {
      return {
        ok: false as const,
        error: clipboardEmptyMessage
      };
    }
    return {
      ok: true as const,
      text
    };
  } catch {
    return {
      ok: false as const,
      error: clipboardRejectedMessage
    };
  }
}

export function createSearchImportSession(prefill: SearchImportPrefill, selectedCandidate: SearchImportCandidate | undefined, step: SearchImportSessionStep): SearchImportSession {
  return {
    title: prefill.title,
    artist: prefill.artist,
    recordingMbid: prefill.recordingMbid,
    selectedCandidate,
    step,
    updatedAt: new Date().toISOString()
  };
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
