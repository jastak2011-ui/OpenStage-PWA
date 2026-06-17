import Dexie, { type Table } from 'dexie';
import type { SavedSetlist, SetlistItem, Song } from '../types';
import { sampleSavedSetlists, sampleSetlist, sampleSongs } from './sampleSongs';
import { markStartupError } from '../services/startupDiagnostics';

class OpenStageDatabase extends Dexie {
  songs!: Table<Song, string>;
  setlist!: Table<SetlistItem, string>;
  setlists!: Table<SavedSetlist, string>;

  constructor() {
    super('openstage-pwa');
    this.version(1).stores({
      songs: 'id, title, artist, key, updatedAt',
      setlist: 'id, songId, order'
    });
    this.version(2).stores({
      songs: 'id, title, artist, key, updatedAt',
      setlist: 'id, songId, order',
      setlists: 'id, name, updatedAt'
    });
  }
}

export let db: OpenStageDatabase;
let storageInitializationError: Error | null = null;

try {
  db = new OpenStageDatabase();
} catch (error) {
  markStartupError(error);
  storageInitializationError = new Error('OpenStage storage could not initialize. IndexedDB may be blocked or unavailable in this browser.');
  db = null as unknown as OpenStageDatabase;
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
