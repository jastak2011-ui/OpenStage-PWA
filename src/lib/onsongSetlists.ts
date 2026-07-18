import type { SavedSetlist, Song } from '../types';
import { createId } from './ids';
import { sanitizeChartForOnSong } from './onsongSanitize';

export type OnSongSetlistExportSong = Pick<
  Song,
  | 'title'
  | 'artist'
  | 'key'
  | 'performanceKey'
  | 'capo'
  | 'bpm'
  | 'timeSignature'
  | 'durationSeconds'
  | 'tags'
  | 'notes'
  | 'chart'
  | 'rawChordPro'
>;

export function createChordProSongBundle(setlist: SavedSetlist, songs: OnSongSetlistExportSong[]) {
  const setlistName = setlist.name.trim() || 'OpenStage Setlist';
  return songs.map((song, index) => songToOnSongChordPro(song, setlistName, index + 1)).join('\n\n{new_song}\n\n');
}

export function createChordProSongBundleFileName(setlistName: string) {
  return `${sanitizeFileName(setlistName || 'OpenStage Setlist')}.chopro`;
}

export function createImportedSetlistName(name: string, existingNames: Iterable<string>) {
  const base = (name || 'Imported OnSong Setlist').trim();
  const used = new Set(Array.from(existingNames, normalizeSetlistName).filter(Boolean));
  if (!used.has(normalizeSetlistName(base))) return base;
  for (let copy = 2; copy < 1000; copy += 1) {
    const candidate = `${base} (${copy})`;
    if (!used.has(normalizeSetlistName(candidate))) return candidate;
  }
  return `${base} (${Date.now()})`;
}

export function createImportedSetlist(name: string, songIds: string[], existingNames: Iterable<string>, now = new Date().toISOString()): SavedSetlist {
  return {
    id: createId('setlist'),
    name: createImportedSetlistName(name, existingNames),
    songIds,
    createdAt: now,
    updatedAt: now,
    notes: 'Imported from OnSong archive.'
  };
}

function songToOnSongChordPro(song: OnSongSetlistExportSong, setlistName: string, order: number) {
  const cleanChart = sanitizeChartForOnSong(song.rawChordPro || song.chart || '').trim();
  const body = removeLeadingMetadataTags(cleanChart);
  const metadata = [
    `{title: ${escapeDirectiveValue(song.title || 'Untitled Song')}}`,
    song.artist ? `{subtitle: ${escapeDirectiveValue(song.artist)}}` : '',
    song.key ? `{key: ${escapeDirectiveValue(song.key)}}` : '',
    song.performanceKey && song.performanceKey !== song.key ? `{transposedKey: ${escapeDirectiveValue(song.performanceKey)}}` : '',
    Number(song.capo || 0) ? `{capo: ${Math.round(Number(song.capo || 0))}}` : '',
    Number(song.bpm || 0) ? `{tempo: ${Math.round(Number(song.bpm || 0))}}` : '',
    song.timeSignature ? `{time: ${escapeDirectiveValue(song.timeSignature)}}` : '',
    Number(song.durationSeconds || 0) ? `{duration: ${Math.round(Number(song.durationSeconds || 0))}}` : '',
    `{comment: OpenStage setlist: ${escapeDirectiveValue(setlistName)}}`,
    `{comment: OpenStage set order: ${order}}`,
    Array.isArray(song.tags) && song.tags.length ? `{keywords: ${escapeDirectiveValue(song.tags.join(';'))}}` : '',
    song.notes ? `{comment: ${escapeDirectiveValue(song.notes)}}` : ''
  ].filter(Boolean);

  return `${metadata.join('\n')}\n\n${body}`;
}

function removeLeadingMetadataTags(chart: string) {
  const lines = chart.split(/\r?\n/);
  let index = 0;
  while (index < lines.length && /^\s*\{(?:title|t|subtitle|st|su|artist|key|capo|tempo|time|duration|keywords|comment)\s*:/i.test(lines[index])) {
    index += 1;
  }
  while (index < lines.length && lines[index].trim() === '') index += 1;
  return lines.slice(index).join('\n').trim();
}

function escapeDirectiveValue(value: string) {
  return String(value).replace(/[{}]/g, '').trim();
}

function sanitizeFileName(value: string) {
  const safe = value.trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\s+/g, ' ').slice(0, 80);
  return safe || 'OpenStage Setlist';
}

function normalizeSetlistName(value: string) {
  return value.trim().toLowerCase();
}
