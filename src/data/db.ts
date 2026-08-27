import Dexie, { type Table } from 'dexie';
import type { PerformanceState, SavedSetlist, SetlistItem, Song } from '../types';
import { sampleSavedSetlists, sampleSetlist, sampleSongs } from './sampleSongs';
import { markStartupError } from '../services/startupDiagnostics';
import { getDatabaseNameForUser, legacyOpenStageDatabaseName } from './databaseIdentity';

export type RestorePoint = {
  id: 'restorePoint';
  songs: Song[];
  setlist: SetlistItem[];
  setlists: SavedSetlist[];
  settings: PerformanceState;
  timestamp: string;
  expiresAt: string;
};

export class OpenStageDatabase extends Dexie {
  songs!: Table<Song, string>;
  setlist!: Table<SetlistItem, string>;
  setlists!: Table<SavedSetlist, string>;
  restorePoints!: Table<RestorePoint, string>;

  constructor(databaseName = legacyOpenStageDatabaseName) {
    super(databaseName);
    this.version(1).stores({
      songs: 'id, title, artist, key, updatedAt',
      setlist: 'id, songId, order'
    });
    this.version(2).stores({
      songs: 'id, title, artist, key, updatedAt',
      setlist: 'id, songId, order',
      setlists: 'id, name, updatedAt'
    });
    this.version(3).stores({
      songs: 'id, title, artist, key, updatedAt',
      setlist: 'id, songId, order',
      setlists: 'id, name, updatedAt',
      restorePoints: 'id, timestamp, expiresAt'
    });
  }
}

export function openUserDatabase(userId?: string | null) {
  return new OpenStageDatabase(getDatabaseNameForUser(userId));
}

export let db: OpenStageDatabase;
let storageInitializationError: Error | null = null;
let activeDatabaseName = legacyOpenStageDatabaseName;

try {
  db = new OpenStageDatabase();
} catch (error) {
  markStartupError(error);
  storageInitializationError = new Error('OpenStage storage could not initialize. IndexedDB may be blocked or unavailable in this browser.');
  db = null as unknown as OpenStageDatabase;
}

export function getActiveDatabaseName() {
  return activeDatabaseName;
}

export function activateDatabaseForUser(userId?: string | null) {
  const nextName = getDatabaseNameForUser(userId);
  if (db && activeDatabaseName === nextName) return db;
  try {
    db?.close();
  } catch {
    // Continue with the new active database if closing the previous handle fails.
  }
  activeDatabaseName = nextName;
  db = new OpenStageDatabase(nextName);
  storageInitializationError = null;
  return db;
}

export async function ensureSeedData() {
  try {
    if (storageInitializationError) throw storageInitializationError;
    const count = await db.songs.count();
    if (count === 0) {
      await db.transaction('rw', db.songs, db.setlist, db.setlists, async () => {
        await db.songs.bulkPut(sampleSongs);
        await db.setlist.bulkPut(sampleSetlist);
        await db.setlists.bulkPut(sampleSavedSetlists);
      });
    }
  } catch (error) {
    markStartupError(error);
    throw new Error('OpenStage could not open local offline storage. On iPad Safari, check private browsing, storage permissions, and available device storage.');
  }
}
