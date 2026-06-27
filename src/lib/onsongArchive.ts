import type { ParsedChordPro, Song } from '../types';
import { parseBinaryPlist, type BinaryPlistUid, type BinaryPlistValue } from './binaryPlist';
import { parseChordPro } from './chordpro';
import { createId, createSongUuid } from './ids';

export type OnSongImportResult = {
  fileName: string;
  song: Song;
  warnings: string[];
};

export type OnSongArchiveImportResult = {
  fileName: string;
  songsFound: number;
  songs: OnSongImportResult[];
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
  const songs = uniqueSongObjects.map((songObject, index) => songFromOnSongObject(songObject, fileName, index));

  return {
    fileName,
    songsFound: songs.length,
    songs,
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

function songFromOnSongObject(object: ArchiveObject, archiveFileName: string, index: number): OnSongImportResult {
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
