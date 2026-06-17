import { db } from '../../data/db';
import { pullSongsFromSupabase, pushSongsToSupabase, supabase } from '../../data/supabase';
import { createId } from '../../lib/ids';
import type { SyncConflict } from '../../types';

export type SyncResult = {
  uploaded: number;
  downloaded: number;
  conflicts: SyncConflict[];
};

export async function syncLibraryOfflineFirst(): Promise<SyncResult> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const localSongs = await db.songs.toArray();
  const remoteSongs = await pullSongsFromSupabase();
  const localById = new Map(localSongs.map((song) => [song.id, song]));
  const conflicts: SyncConflict[] = [];
  const merged = [...localSongs];

  for (const remote of remoteSongs) {
    const local = localById.get(remote.id);
    if (!local) {
      merged.push(remote);
      continue;
    }

    const localTime = Date.parse(local.updatedAt);
    const remoteTime = Date.parse(remote.updatedAt);
    if (localTime > remoteTime) continue;
    if (remoteTime > localTime) {
      const index = merged.findIndex((song) => song.id === remote.id);
      if (index >= 0) merged[index] = remote;
      continue;
    }

    if (JSON.stringify(local) !== JSON.stringify(remote)) {
      conflicts.push({
        id: createId('conflict'),
        songId: local.id,
        localUpdatedAt: local.updatedAt,
        remoteUpdatedAt: remote.updatedAt,
        reason: 'Same timestamp but different content.'
      });
    }
  }

  if (conflicts.length === 0) {
    await db.songs.bulkPut(merged);
    await pushSongsToSupabase(merged);
  }

  return {
    uploaded: conflicts.length ? 0 : merged.length,
    downloaded: remoteSongs.length,
    conflicts
  };
}

export async function cloudBackup() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const songs = await db.songs.toArray();
  await pushSongsToSupabase(songs);
  return songs.length;
}
