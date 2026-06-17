import type { SavedSetlist, Song } from '../types';
import { createId } from './ids';

export type SetlistSortKey = 'manual' | 'title' | 'artist' | 'key' | 'bpm' | 'duration';

export function createNamedSetlist(name: string, songIds: string[], now = new Date().toISOString(), notes = ''): SavedSetlist {
  return {
    id: createId('setlist'),
    name: name.trim() || 'Untitled Setlist',
    songIds,
    createdAt: now,
    updatedAt: now,
    notes
  };
}

export function addSongToSetlist(songIds: string[], songId: string, allowDuplicates = false) {
  if (!allowDuplicates && songIds.includes(songId)) return songIds;
  return [...songIds, songId];
}

export function removeSongFromSetlist(songIds: string[], songId: string) {
  return songIds.filter((id) => id !== songId);
}

export function sortSetlistSongIds(songIds: string[], songs: Song[], sortBy: SetlistSortKey) {
  if (sortBy === 'manual') return songIds;
  const songMap = new Map(songs.map((song) => [song.id, song]));
  return [...songIds].sort((a, b) => compareSongs(songMap.get(a), songMap.get(b), sortBy));
}

export function getStageSongAt(setlist: SavedSetlist, songs: Song[], currentSongId: string, direction: 1 | -1) {
  const available = setlist.songIds.map((id) => songs.find((song) => song.id === id)).filter((song): song is Song => Boolean(song));
  const currentIndex = available.findIndex((song) => song.id === currentSongId);
  return currentIndex >= 0 ? available[currentIndex + direction] : undefined;
}

function compareSongs(left: Song | undefined, right: Song | undefined, sortBy: SetlistSortKey) {
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;
  if (sortBy === 'title') return left.title.localeCompare(right.title);
  if (sortBy === 'artist') return (left.artist || '').localeCompare(right.artist || '') || left.title.localeCompare(right.title);
  if (sortBy === 'key') return (left.key || '').localeCompare(right.key || '') || left.title.localeCompare(right.title);
  if (sortBy === 'bpm') return (left.bpm || 0) - (right.bpm || 0) || left.title.localeCompare(right.title);
  if (sortBy === 'duration') return (left.durationSeconds || 0) - (right.durationSeconds || 0) || left.title.localeCompare(right.title);
  return 0;
}
