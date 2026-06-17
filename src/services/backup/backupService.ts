import { db } from '../../data/db';
import { markStartupError } from '../../services/startupDiagnostics';
import type { PerformanceState, SavedSetlist, SetlistItem, Song } from '../../types';

export type PortableBackup = {
  schemaVersion: 1;
  exportedAt: string;
  checkpointName: string;
  songs: Song[];
  setlist: SetlistItem[];
  setlists?: SavedSetlist[];
  performanceState: PerformanceState;
};

export async function createPortableBackup(performanceState: PerformanceState, checkpointName = 'manual') {
  const [songs, setlist, setlists] = await Promise.all([db.songs.toArray(), db.setlist.toArray(), db.setlists.toArray()]);
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    checkpointName,
    songs,
    setlist,
    setlists,
    performanceState
  } satisfies PortableBackup;
}

export async function restorePortableBackup(backup: PortableBackup) {
  await db.transaction('rw', db.songs, db.setlist, db.setlists, async () => {
    await db.songs.clear();
    await db.setlist.clear();
    await db.setlists.clear();
    await db.songs.bulkPut(backup.songs ?? []);
    await db.setlist.bulkPut(backup.setlist ?? []);
    await db.setlists.bulkPut(backup.setlists ?? []);
  });
}

export async function saveLocalCheckpoint(performanceState: PerformanceState) {
  const backup = await createPortableBackup(performanceState, 'auto-checkpoint');
  try {
    localStorage.setItem('openstage-auto-checkpoint-v1', JSON.stringify(backup));
    localStorage.setItem('openstage-auto-checkpoint-created-at', backup.exportedAt);
  } catch (error) {
    markStartupError(error);
  }
  return backup;
}

export function loadLocalCheckpoint(): PortableBackup | null {
  try {
    const raw = localStorage.getItem('openstage-auto-checkpoint-v1');
    return raw ? (JSON.parse(raw) as PortableBackup) : null;
  } catch (error) {
    markStartupError(error);
    return null;
  }
}
