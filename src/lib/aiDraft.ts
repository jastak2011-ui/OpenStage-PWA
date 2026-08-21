export type AiDraftImportedSong = {
  title?: string | null;
  artist?: string | null;
  key?: string | null;
  capo?: number | string | null;
  bpm?: number | string | null;
  chart?: string | null;
};

export type AiDraftRequestedIdentity = {
  title: string;
  artist?: string | null;
};

export const aiDraftDisclaimerText =
  'AI Draft creates a chord chart from AI knowledge. It does not retrieve or verify a published song chart, so lyrics, chords, key, BPM, and song structure may be inaccurate.';

export const aiDraftPreviewBadge = 'AI Generated Draft';

export function normalizeAiDraftSongResponse(imported: AiDraftImportedSong, requested: AiDraftRequestedIdentity) {
  const title = requested.title.trim();
  const artist = requested.artist?.trim() ?? '';
  const capo = Number.isFinite(Number(imported.capo)) ? Math.max(0, Math.round(Number(imported.capo))) : 0;
  const bpm = Number.isFinite(Number(imported.bpm)) && Number(imported.bpm) > 0 ? Math.round(Number(imported.bpm)) : 0;

  return {
    title,
    artist,
    key: typeof imported.key === 'string' ? imported.key.trim() : '',
    capo,
    bpm,
    chart: typeof imported.chart === 'string' ? imported.chart : ''
  };
}
