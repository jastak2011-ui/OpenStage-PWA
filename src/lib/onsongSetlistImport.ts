import type { OnSongArchiveImportResult, OnSongImportResult, OnSongSetlistImportResult } from './onsongArchive';
import { normalizeDuplicateText } from './sharedSongImport';
import type { SavedSetlist, Song } from '../types';
import { createId, createSongUuid } from './ids';

export type OnSongSetlistMatchKind = 'exact' | 'possible' | 'new' | 'invalid';
export type OnSongSetlistDecision = 'use-existing' | 'replace-existing' | 'import-duplicate' | 'import-new' | 'skip';

export type OnSongSetlistReviewSong = {
  sourceId: string;
  imported?: Song;
  existing?: Song;
  matchKind: OnSongSetlistMatchKind;
  decision: OnSongSetlistDecision;
  warnings: string[];
};

export type OnSongSetlistReview = {
  archiveFileName: string;
  setlist: OnSongSetlistImportResult;
  rows: OnSongSetlistReviewSong[];
};

export function createOnSongSetlistReview(archive: OnSongArchiveImportResult, setlist: OnSongSetlistImportResult, existingSongs: Song[]): OnSongSetlistReview {
  const importsBySource = new Map(archive.songs.map((song) => [song.sourceId, song]));
  const rows = setlist.songSourceIds.map((sourceId) => {
    const imported = importsBySource.get(sourceId);
    if (!imported) {
      return { sourceId, matchKind: 'invalid' as const, decision: 'skip' as const, warnings: ['Setlist song reference could not be read.'] };
    }

    const match = findOnSongImportMatch(imported, existingSongs);
    if (!imported.song.chart.trim()) {
      return { sourceId, imported: imported.song, existing: match?.existing, matchKind: 'invalid' as const, decision: 'skip' as const, warnings: ['Song has no chart content.'] };
    }
    if (match?.kind === 'exact') {
      return { sourceId, imported: imported.song, existing: match.existing, matchKind: 'exact' as const, decision: 'use-existing' as const, warnings: imported.warnings };
    }
    if (match?.kind === 'possible') {
      return { sourceId, imported: imported.song, existing: match.existing, matchKind: 'possible' as const, decision: 'skip' as const, warnings: imported.warnings };
    }
    return { sourceId, imported: imported.song, matchKind: 'new' as const, decision: 'import-new' as const, warnings: imported.warnings };
  });

  return {
    archiveFileName: archive.fileName,
    setlist,
    rows
  };
}

export function findOnSongImportMatch(imported: OnSongImportResult, existingSongs: Song[]) {
  const incoming = imported.song;
  const incomingUuid = incoming.songUuid?.trim();
  if (incomingUuid) {
    const existing = existingSongs.find((song) => song.songUuid?.trim() === incomingUuid);
    if (existing) return { kind: 'exact' as const, existing, reason: 'songUuid' as const };
  }

  const incomingTitle = normalizeOnSongMatchText(incoming.title);
  const incomingArtist = normalizeOnSongMatchText(incoming.artist);
  const exactTitleArtist = existingSongs.find((song) => normalizeOnSongMatchText(song.title) === incomingTitle && normalizeOnSongMatchText(song.artist) === incomingArtist && incomingTitle && incomingArtist);
  if (exactTitleArtist) return { kind: 'exact' as const, existing: exactTitleArtist, reason: 'title-artist' as const };

  if (!incomingArtist && incomingTitle) {
    const exactTitle = existingSongs.find((song) => normalizeOnSongMatchText(song.title) === incomingTitle);
    if (exactTitle) return { kind: 'exact' as const, existing: exactTitle, reason: 'title-only' as const };
  }

  const possible = existingSongs.find((song) => arePossiblySameSong(incoming, song));
  return possible ? { kind: 'possible' as const, existing: possible, reason: 'fuzzy' as const } : null;
}

export function normalizeOnSongMatchText(value: string) {
  return normalizeDuplicateText(value.replace(/[’‘]/g, "'").replace(/[“”]/g, '"'));
}

export function arePossiblySameSong(left: Pick<Song, 'title' | 'artist'>, right: Pick<Song, 'title' | 'artist'>) {
  const leftTitle = normalizeOnSongMatchText(left.title);
  const rightTitle = normalizeOnSongMatchText(right.title);
  if (!leftTitle || !rightTitle) return false;
  if (leftTitle.includes(rightTitle) || rightTitle.includes(leftTitle)) {
    const leftArtist = normalizeOnSongMatchText(left.artist);
    const rightArtist = normalizeOnSongMatchText(right.artist);
    return !leftArtist || !rightArtist || leftArtist === rightArtist || leftArtist.includes(rightArtist) || rightArtist.includes(leftArtist);
  }
  return false;
}

export function createOnSongImportedSongCopy(song: Song, now = new Date().toISOString()): Song {
  return {
    ...song,
    id: createId('onsong'),
    songUuid: song.songUuid?.trim() || createSongUuid(),
    version: song.version ?? 1,
    favorite: false,
    updatedAt: now
  };
}

export function createDuplicateOnSongImportedSong(song: Song, now = new Date().toISOString()): Song {
  return {
    ...createOnSongImportedSongCopy(song, now),
    songUuid: createSongUuid()
  };
}

export function replaceSongWithOnSongImport(existing: Song, imported: Song, now = new Date().toISOString()): Song {
  return {
    ...existing,
    title: imported.title,
    artist: imported.artist,
    key: imported.key,
    performanceKey: imported.performanceKey,
    originalKey: imported.originalKey,
    capo: imported.capo,
    bpm: imported.bpm,
    durationSeconds: imported.durationSeconds,
    timeSignature: imported.timeSignature,
    chart: imported.chart,
    rawChordPro: imported.rawChordPro,
    parsedChordPro: imported.parsedChordPro,
    referenceAudioUrl: imported.referenceAudioUrl || existing.referenceAudioUrl,
    notes: imported.notes || existing.notes,
    tags: imported.tags.length ? imported.tags : existing.tags,
    version: Math.max(1, existing.version ?? 1) + 1,
    updatedAt: now
  };
}

export function createSetlistFromOnSongReview(name: string, songIds: string[], existingNames: Iterable<string>, now = new Date().toISOString()): SavedSetlist {
  return {
    id: createId('setlist'),
    name: createSafeSetlistName(name, existingNames),
    songIds,
    createdAt: now,
    updatedAt: now,
    notes: 'Imported from OnSong setlist.'
  };
}

export function createSafeSetlistName(name: string, existingNames: Iterable<string>) {
  const base = (name || 'Imported OnSong Setlist').trim();
  const used = new Set(Array.from(existingNames, normalizeOnSongMatchText).filter(Boolean));
  if (!used.has(normalizeOnSongMatchText(base))) return base;
  for (let copy = 1; copy < 1000; copy += 1) {
    const suffix = copy === 1 ? 'Copy' : `Copy ${copy}`;
    const candidate = `${base} ${suffix}`;
    if (!used.has(normalizeOnSongMatchText(candidate))) return candidate;
  }
  return `${base} ${Date.now()}`;
}
