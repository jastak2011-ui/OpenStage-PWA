import type { Song } from '../types';

export type SharedSongDuplicate = {
  existing: Song;
  incoming: Song;
  matchType: 'shareId' | 'songUuid' | 'title-artist';
};

export function normalizeDuplicateText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getSharedSongImportIdentifiers(song: Partial<Song>) {
  return [
    song.importedFromShareId,
    song.sourceShareId,
    song.sharedSongId
  ].filter((value): value is string => Boolean(typeof value === 'string' && value.trim())).map((value) => value.trim());
}

export function findSharedSongDuplicate(songs: Song[], incoming: Song): SharedSongDuplicate | null {
  const incomingShareIds = new Set(getSharedSongImportIdentifiers(incoming));
  if (incomingShareIds.size > 0) {
    const shareIdMatch = songs.find((song) => getSharedSongImportIdentifiers(song).some((id) => incomingShareIds.has(id)));
    if (shareIdMatch) return { existing: shareIdMatch, incoming, matchType: 'shareId' };
  }

  const incomingSongUuid = incoming.songUuid?.trim();
  if (incomingSongUuid) {
    const songUuidMatch = songs.find((song) => song.songUuid?.trim() === incomingSongUuid);
    if (songUuidMatch) return { existing: songUuidMatch, incoming, matchType: 'songUuid' };
  }

  const incomingTitle = normalizeDuplicateText(incoming.title);
  const incomingArtist = normalizeDuplicateText(incoming.artist);
  if (!incomingTitle || !incomingArtist) return null;

  const titleArtistMatch = songs.find((song) =>
    normalizeDuplicateText(song.title) === incomingTitle &&
    normalizeDuplicateText(song.artist) === incomingArtist
  );

  return titleArtistMatch ? { existing: titleArtistMatch, incoming, matchType: 'title-artist' } : null;
}

export function sharedDuplicateHasSameSongUuid(duplicate: SharedSongDuplicate) {
  const existingSongUuid = duplicate.existing.songUuid?.trim();
  const incomingSongUuid = duplicate.incoming.songUuid?.trim();
  return Boolean(existingSongUuid && incomingSongUuid && existingSongUuid === incomingSongUuid);
}
