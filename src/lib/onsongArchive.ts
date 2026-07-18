import type { ParsedChordPro, Song } from '../types';
import { parseBinaryPlist, type BinaryPlistUid, type BinaryPlistValue } from './binaryPlist';
import { parseChordPro } from './chordpro';
import { createId, createSongUuid } from './ids';

export type OnSongImportResult = {
  sourceId: string;
  fileName: string;
  song: Song;
  warnings: string[];
};

export type OnSongSetlistImportResult = {
  name: string;
  songSourceIds: string[];
  warnings: string[];
};

export type OnSongArchiveImportResult = {
  fileName: string;
  songsFound: number;
  songs: OnSongImportResult[];
  setlists: OnSongSetlistImportResult[];
  warnings: string[];
};

type ArchiveObject = Record<string, unknown>;

export function isOnSongArchiveFileName(fileName: string) {
  return fileName.toLowerCase().endsWith('.archive');
}

export function parseOnSongArchive(buffer: ArrayBuffer, fileName = 'OnSong archive'): OnSongArchiveImportResult {
  try {
    const plist = parseBinaryPlist(buffer);
    return parseOnSongKeyedArchive(plist, fileName);
  } catch (error) {
    throw new Error('This does not appear to be a supported OnSong archive.');
  }
}

export function parseOnSongKeyedArchive(plist: BinaryPlistValue, fileName = 'OnSong archive'): OnSongArchiveImportResult {
  if (!isPlainObject(plist)) throw new Error('This does not appear to be a supported OnSong archive.');
  const archive = plist as ArchiveObject;
  const objects = archive.$objects;
  const top = archive.$top;
  if (!Array.isArray(objects) || !isPlainObject(top)) throw new Error('This does not appear to be a supported OnSong archive.');

  const resolver = createArchiveResolver(objects);
  const root = resolver.resolve(top.root);
  const songObjects = findOnSongSongObjects(root);
  const uniqueSongObjects = uniqueObjects(songObjects);
  const sourceIds = new Map<ArchiveObject, string>();
  uniqueSongObjects.forEach((songObject, index) => {
    sourceIds.set(songObject, `onsong-song-${index + 1}`);
  });
  const songs = uniqueSongObjects.map((songObject, index) => songFromOnSongObject(songObject, fileName, index, sourceIds.get(songObject) ?? `onsong-song-${index + 1}`));
  const setlists = findOnSongSetlistObjects(root, new Set(uniqueSongObjects)).map((setlistObject, index) =>
    setlistFromOnSongObject(setlistObject, sourceIds, index)
  );

  return {
    fileName,
    songsFound: songs.length,
    songs,
    setlists,
    warnings: songs.length === 0 ? ['No OnSong songs were found in the archive.'] : []
  };
}

function createArchiveResolver(objects: BinaryPlistValue[]) {
  const resolving = new Set<number>();
  const cache = new Map<number, unknown>();

  const resolve = (value: unknown): unknown => {
    if (isUid(value)) return resolveUid(value.$uid);
    if (Array.isArray(value)) return value.map(resolve);
    if (isPlainObject(value)) {
      if (Array.isArray(value['NS.keys']) && Array.isArray(value['NS.objects'])) {
        const result: ArchiveObject = {};
        const keys = value['NS.keys'] as unknown[];
        const values = value['NS.objects'] as unknown[];
        keys.forEach((key, index) => {
          result[String(resolve(key))] = resolve(values[index]);
        });
        return result;
      }
      if (Array.isArray(value['NS.objects'])) return (value['NS.objects'] as unknown[]).map(resolve);

      const result: ArchiveObject = {};
      Object.entries(value).forEach(([key, child]) => {
        if (key !== '$class') result[key] = resolve(child);
      });
      return result;
    }
    return value;
  };

  const resolveUid = (uid: number): unknown => {
    if (cache.has(uid)) return cache.get(uid);
    if (resolving.has(uid)) return {};
    resolving.add(uid);
    const source = objects[uid];
    const resolved = resolve(source);
    cache.set(uid, resolved);
    resolving.delete(uid);
    return resolved;
  };

  return { resolve };
}

function findOnSongSongObjects(root: unknown) {
  const songs: ArchiveObject[] = [];
  const visited = new Set<unknown>();

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const object = value as ArchiveObject;
    const nestedSong = object.song;
    if (isOnSongSong(nestedSong)) songs.push(nestedSong);
    if (isOnSongSong(object)) songs.push(object);
    Object.values(object).forEach(visit);
  };

  visit(root);
  return songs;
}

function isOnSongSong(value: unknown): value is ArchiveObject {
  if (!isPlainObject(value)) return false;
  return typeof value.title === 'string' && (typeof value.content === 'string' || typeof value.filepath === 'string');
}

function songFromOnSongObject(object: ArchiveObject, archiveFileName: string, index: number, sourceId: string): OnSongImportResult {
  const title = stringValue(object.title) || `OnSong Song ${index + 1}`;
  const artist = stringValue(object.byline);
  const key = stringValue(object.key);
  const performanceKey = stringValue(object.transposedKey) || key;
  const capo = numberValue(object.capo, 0);
  const bpm = numberValue(object.tempo, 0);
  const durationSeconds = durationValue(object.duration);
  const timeSignature = stringValue(object.timeSignature) || '4/4';
  const content = stringValue(object.content);
  const filepath = stringValue(object.filepath);
  const tags = keywordsValue(object.keywords);
  const songUuid = stringValue(object.songUuid) || stringValue(object.uuid) || createSongUuid();
  const displayPreference = detectOnSongDisplayPreference(content);
  const parsedChordPro: ParsedChordPro = parseChordPro(content);
  const warnings: string[] = [];
  if (!content.trim()) warnings.push('Song has no chart content.');
  if (!artist) warnings.push('Artist/byline is empty.');

  return {
    sourceId,
    fileName: archiveFileName,
    song: {
      id: createId('onsong'),
      songUuid,
      version: numberValue(object.version, 1),
      title,
      artist,
      key,
      performanceKey,
      originalKey: key,
      capo,
      bpm,
      durationSeconds,
      timeSignature,
      tags,
      favorite: false,
      referenceAudioUrl: '',
      notes: filepath ? `Source file: ${filepath}` : '',
      chart: content,
      displayPreference,
      rawChordPro: content,
      parsedChordPro,
      updatedAt: new Date().toISOString()
    },
    warnings
  };
}

function findOnSongSetlistObjects(root: unknown, knownSongs: Set<ArchiveObject>) {
  const setlists: ArchiveObject[] = [];
  const visited = new Set<unknown>();

  const visit = (value: unknown) => {
    if (!value || typeof value !== 'object' || visited.has(value)) return;
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }

    const object = value as ArchiveObject;
    if (!isOnSongSong(object)) {
      const name = setlistNameValue(object);
      const songs = collectDirectSetlistSongs(object, knownSongs);
      if (name && songs.length > 0) setlists.push(object);
    }

    Object.values(object).forEach(visit);
  };

  visit(root);
  return uniqueObjects(setlists);
}

function setlistFromOnSongObject(object: ArchiveObject, sourceIds: Map<ArchiveObject, string>, index: number): OnSongSetlistImportResult {
  const knownSongs = new Set(sourceIds.keys());
  const name = setlistNameValue(object) || `OnSong Setlist ${index + 1}`;
  const songObjects = collectDirectSetlistSongs(object, knownSongs);
  const songSourceIds = songObjects.map((song) => sourceIds.get(song)).filter((id): id is string => Boolean(id));
  const warnings = songSourceIds.length === songObjects.length ? [] : [`${songObjects.length - songSourceIds.length} setlist song reference(s) could not be matched.`];

  return {
    name,
    songSourceIds,
    warnings
  };
}

function collectDirectSetlistSongs(object: ArchiveObject, knownSongs: Set<ArchiveObject>) {
  const songs: ArchiveObject[] = [];
  Object.entries(object).forEach(([key, value]) => {
    if (!/(song|songs|item|items|entry|entries|setlist|set)/i.test(key)) return;
    collectKnownSongReferences(value, knownSongs, songs, new Set());
  });
  return uniqueObjects(songs);
}

function collectKnownSongReferences(value: unknown, knownSongs: Set<ArchiveObject>, songs: ArchiveObject[], visited: Set<unknown>) {
  if (!value || typeof value !== 'object' || visited.has(value)) return;
  visited.add(value);

  if (Array.isArray(value)) {
    value.forEach((item) => collectKnownSongReferences(item, knownSongs, songs, visited));
    return;
  }

  const object = value as ArchiveObject;
  const nestedSong = object.song;
  if (isOnSongSong(nestedSong) && knownSongs.has(nestedSong)) {
    songs.push(nestedSong);
    return;
  }
  if (isOnSongSong(object) && knownSongs.has(object)) {
    songs.push(object);
    return;
  }

  Object.values(object).forEach((child) => collectKnownSongReferences(child, knownSongs, songs, visited));
}

function setlistNameValue(object: ArchiveObject) {
  return (
    stringValue(object.name) ||
    stringValue(object.title) ||
    stringValue(object.setName) ||
    stringValue(object.setTitle) ||
    stringValue(object.displayName) ||
    stringValue(object.date)
  );
}

function detectOnSongDisplayPreference(content: string): Song['displayPreference'] {
  if (/\[[A-G](?:#|b)?[^\]]*\]/.test(content)) return 'inline';
  const lines = content.split(/\r?\n/);
  for (let index = 0; index < lines.length - 1; index += 1) {
    if (isChordRow(lines[index]) && lines[index + 1].trim().length > 0 && !isChordRow(lines[index + 1])) return 'chords-over';
  }
  return 'inline';
}

function isChordRow(line: string) {
  const parts = line.trim().split(/\s+/).filter(Boolean);
  return parts.length > 0 && parts.every((part) => /^[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*?(?:\/[A-G](?:#|b)?(?:m(?!aj)|maj|min|dim|aug|sus|add|\d|[#b()+-])*)?$/i.test(part));
}

function keywordsValue(value: unknown) {
  if (Array.isArray(value)) return value.map(stringValue).filter(Boolean);
  const text = stringValue(value);
  return text ? text.split(/[,;|]/).map((tag) => tag.trim()).filter(Boolean) : [];
}

function durationValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value > 0 ? Math.round(value) : undefined;
  const text = stringValue(value);
  if (!text) return undefined;
  const parts = text.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part))) return Number(text) || undefined;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return Number(text) || undefined;
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : value === undefined || value === null ? '' : String(value).trim();
}

function numberValue(value: unknown, fallback: number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function uniqueObjects<T extends object>(objects: T[]) {
  const seen = new Set<T>();
  return objects.filter((object) => {
    if (seen.has(object)) return false;
    seen.add(object);
    return true;
  });
}

function isUid(value: unknown): value is BinaryPlistUid {
  return isPlainObject(value) && typeof value.$uid === 'number';
}

function isPlainObject(value: unknown): value is ArchiveObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !(value instanceof Uint8Array);
}
