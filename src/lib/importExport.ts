import type { Song } from '../types';
import { parseChordPro } from './chordpro';
import { createId, createSongUuid } from './ids';

export function songsToJson(songs: Song[]) {
  return JSON.stringify(songs, null, 2);
}

export function songsToCsv(songs: Song[]) {
  const headers = [
    'songUuid',
    'version',
    'title',
    'subtitle',
    'artist',
    'album',
    'genre',
    'vibe',
    'crowdScore',
    'danceability',
    'energy',
    'vocalRange',
    'vocalDifficulty',
    'openerCandidate',
    'closerCandidate',
    'difficulty',
    'tuning',
    'originalKey',
    'performanceKey',
    'durationSeconds',
    'year',
    'bandNotes',
    'lastSharedAt',
    'favorite',
    'key',
    'capo',
    'bpm',
    'timeSignature',
    'tags',
    'notes',
    'chart',
    'rawChordPro',
    'musicBrainzRecordingId',
    'deezerTrackId',
    'lastFmUrl',
    'referenceAudioUrl'
  ];
  const rows = songs.map((song) =>
    headers
      .map((header) => {
        const value = header === 'tags' ? song.tags.join('|') : String(song[header as keyof Song] ?? '');
        return `"${value.replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function parseJsonSongs(text: string): Song[] {
  const parsed = JSON.parse(text) as Partial<Song>[];
  if (!Array.isArray(parsed)) throw new Error('JSON import must be an array of songs.');

  return parsed.map(normalizeSong);
}

export function parseCsvSongs(text: string): Song[] {
  const [headerRow, ...rows] = splitCsvRecords(text.trim());
  const headers = splitCsvLine(headerRow);

  return rows
    .filter((rowText) => rowText.trim())
    .map((line) => {
      const values = splitCsvLine(line);
      const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
      return normalizeSong({
        title: row.title,
        songUuid: row.songUuid,
        version: Number(row.version),
        artist: row.artist,
        subtitle: row.subtitle,
        album: row.album,
        genre: row.genre,
        vibe: row.vibe,
        crowdScore: Number(row.crowdScore),
        danceability: Number(row.danceability),
        energy: Number(row.energy),
        vocalRange: row.vocalRange,
        vocalDifficulty: row.vocalDifficulty,
        openerCandidate: parseBoolean(row.openerCandidate),
        closerCandidate: parseBoolean(row.closerCandidate),
        difficulty: row.difficulty,
        tuning: row.tuning,
        originalKey: row.originalKey,
        performanceKey: row.performanceKey,
        durationSeconds: Number(row.durationSeconds),
        year: Number(row.year),
        bandNotes: row.bandNotes,
        lastSharedAt: row.lastSharedAt,
        favorite: parseBoolean(row.favorite),
        key: row.key,
        capo: Number(row.capo),
        bpm: Number(row.bpm),
        timeSignature: row.timeSignature,
        tags: row.tags ? row.tags.split('|') : [],
        notes: row.notes,
        chart: row.chart,
        rawChordPro: row.rawChordPro,
        musicBrainzRecordingId: row.musicBrainzRecordingId,
        deezerTrackId: row.deezerTrackId,
        lastFmUrl: row.lastFmUrl,
        referenceAudioUrl: row.referenceAudioUrl
      });
    });
}

function splitCsvRecords(text: string) {
  const rows: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += char + next;
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
      current += char;
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      rows.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current) rows.push(current);
  return rows;
}

function normalizeSong(song: Partial<Song>): Song {
  return {
    id: song.id || createId('song'),
    songUuid: typeof song.songUuid === 'string' && song.songUuid.trim() ? song.songUuid.trim() : createSongUuid(),
    version: normalizeVersion(song.version),
    title: song.title || 'Untitled Song',
    subtitle: song.subtitle || '',
    artist: song.artist || '',
    album: song.album || '',
    genre: song.genre || '',
    vibe: song.vibe || '',
    crowdScore: Number(song.crowdScore || 0) || undefined,
    danceability: Number(song.danceability || 0) || undefined,
    energy: Number(song.energy || 0) || undefined,
    vocalRange: song.vocalRange || '',
    vocalDifficulty: song.vocalDifficulty || '',
    openerCandidate: Boolean(song.openerCandidate),
    closerCandidate: Boolean(song.closerCandidate),
    difficulty: song.difficulty || '',
    tuning: song.tuning || '',
    originalKey: song.originalKey || song.key || '',
    performanceKey: song.performanceKey || song.key || '',
    durationSeconds: Number(song.durationSeconds || 0) || undefined,
    year: Number(song.year || 0) || undefined,
    bandNotes: song.bandNotes || '',
    lastSharedAt: typeof song.lastSharedAt === 'string' ? song.lastSharedAt : '',
    favorite: Boolean(song.favorite),
    rehearsalNotes: Array.isArray(song.rehearsalNotes) ? song.rehearsalNotes : [],
    key: song.key || '',
    capo: Number(song.capo ?? 0),
    bpm: Number(song.bpm ?? 0),
    timeSignature: song.timeSignature || '4/4',
    tags: Array.isArray(song.tags) ? song.tags : [],
    notes: song.notes || '',
    chart: song.chart || '',
    displayPreference: song.displayPreference || 'inline',
    musicBrainzRecordingId: song.musicBrainzRecordingId || '',
    deezerTrackId: song.deezerTrackId || '',
    lastFmUrl: song.lastFmUrl || '',
    referenceAudioUrl: song.referenceAudioUrl || '',
    rawChordPro: song.rawChordPro || song.chart || '',
    parsedChordPro: song.parsedChordPro || (song.rawChordPro || song.chart ? parseChordPro(song.rawChordPro || song.chart || '') : undefined),
    updatedAt: new Date().toISOString()
  };
}

function normalizeVersion(value: unknown) {
  const version = Math.floor(Number(value));
  return Number.isFinite(version) && version > 0 ? version : 1;
}

function parseBoolean(value: unknown) {
  return ['1', 'true', 'yes', 'y'].includes(String(value || '').trim().toLowerCase());
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}
