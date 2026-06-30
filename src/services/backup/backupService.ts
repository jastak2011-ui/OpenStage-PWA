import { db, type RestorePoint } from '../../data/db';
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

const restorePointId = 'restorePoint';
const restorePointTtlMs = 7 * 24 * 60 * 60 * 1000;

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

export async function createRestorePoint(performanceState: PerformanceState) {
  const [songs, setlist, setlists] = await Promise.all([db.songs.toArray(), db.setlist.toArray(), db.setlists.toArray()]);
  const timestamp = new Date().toISOString();
  const restorePoint: RestorePoint = {
    id: restorePointId,
    songs,
    setlist,
    setlists,
    settings: performanceState,
    timestamp,
    expiresAt: new Date(Date.now() + restorePointTtlMs).toISOString()
  };

  await db.restorePoints.put(restorePoint);
  return restorePoint;
}

export async function loadRestorePoint() {
  const restorePoint = await db.restorePoints.get(restorePointId);
  if (!restorePoint) return null;
  if (new Date(restorePoint.expiresAt).getTime() <= Date.now()) {
    await db.restorePoints.delete(restorePointId);
    return null;
  }
  return restorePoint;
}

export async function restoreFromRestorePoint(restorePoint: RestorePoint) {
  await db.transaction('rw', db.songs, db.setlist, db.setlists, async () => {
    await db.songs.clear();
    await db.setlist.clear();
    await db.setlists.clear();
    await db.songs.bulkPut(restorePoint.songs ?? []);
    await db.setlist.bulkPut(restorePoint.setlist ?? []);
    await db.setlists.bulkPut(restorePoint.setlists ?? []);
  });
}

export async function pruneExpiredRestorePoint() {
  await loadRestorePoint();
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
