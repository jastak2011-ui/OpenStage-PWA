import type { PerformanceState, SavedSetlist, SetlistItem, Song } from '../types';
import { appStoreStorageKey, getAppStoreStorageKeyForUser } from '../store/settingsStorageKeys';
import { OpenStageDatabase } from './db';
import { getDatabaseNameForUser, legacyOpenStageDatabaseName } from './databaseIdentity';

export type LegacyLibraryCounts = {
  songs: number;
  setlist: number;
  setlists: number;
  restorePoints: number;
  hasLegacySettings: boolean;
};

export type LegacyClaimVerification = {
  source: LegacyLibraryCounts;
  target: LegacyLibraryCounts;
  songIdsMatch: boolean;
  setlistIdsMatch: boolean;
  restorePointIdsMatch: boolean;
  setlistOrderMatches: boolean;
  representativeChartsMatch: boolean;
};

export type LegacyClaimResult = {
  targetDatabaseName: string;
  targetSettingsKey: string;
  verification: LegacyClaimVerification;
};

export function getLegacyClaimMarkerKey(userId: string) {
  return `openstage.legacyLibraryClaimed:${encodeURIComponent(userId)}`;
}

export function isLegacyLibraryClaimed(userId: string) {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(getLegacyClaimMarkerKey(userId)) === 'true';
  } catch {
    return false;
  }
}

export function markLegacyLibraryClaimed(userId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(getLegacyClaimMarkerKey(userId), 'true');
}

export function getLegacySettingsSnapshot() {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(appStoreStorageKey);
  } catch {
    return null;
  }
}

export function copyLegacySettingsForUser(userId: string) {
  if (typeof window === 'undefined') return false;
  const raw = getLegacySettingsSnapshot();
  if (!raw) return false;

  const parsed = JSON.parse(raw);
  const userScopedState = {
    state: {
      performance: parsed?.state?.performance ?? {},
      logs: [],
      diagnostics: {}
    },
    version: parsed?.version
  };

  window.localStorage.setItem(getAppStoreStorageKeyForUser(userId), JSON.stringify(userScopedState));
  return true;
}

export async function readLibraryCounts(database: OpenStageDatabase, hasLegacySettings = false): Promise<LegacyLibraryCounts> {
  const [songs, setlist, setlists, restorePoints] = await Promise.all([
    database.songs.count(),
    database.setlist.count(),
    database.setlists.count(),
    database.restorePoints.count()
  ]);
  return {
    songs,
    setlist,
    setlists,
    restorePoints,
    hasLegacySettings
  };
}

export async function getLegacyLibraryCounts(): Promise<LegacyLibraryCounts> {
  const legacyDb = new OpenStageDatabase(legacyOpenStageDatabaseName);
  try {
    return await readLibraryCounts(legacyDb, Boolean(getLegacySettingsSnapshot()));
  } finally {
    legacyDb.close();
  }
}

export async function getScopedLibraryCounts(userId: string): Promise<LegacyLibraryCounts> {
  const scopedDb = new OpenStageDatabase(getDatabaseNameForUser(userId));
  try {
    const hasSettings = typeof window !== 'undefined' && Boolean(window.localStorage.getItem(getAppStoreStorageKeyForUser(userId)));
    return await readLibraryCounts(scopedDb, hasSettings);
  } finally {
    scopedDb.close();
  }
}

function sortedIds(records: Array<{ id: string }>) {
  return records.map((record) => record.id).sort();
}

function sameStrings(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function setlistOrders(records: SetlistItem[]) {
  return [...records]
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))
    .map((item) => `${item.id}:${item.songId}:${item.order}`);
}

function savedSetlistOrders(records: SavedSetlist[]) {
  return [...records]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((setlist) => `${setlist.id}:${setlist.songIds.join('|')}`);
}

function representativeCharts(records: Song[]) {
  return [...records]
    .sort((a, b) => a.id.localeCompare(b.id))
    .slice(0, 8)
    .map((song) => `${song.id}:${song.songUuid ?? ''}:${song.chart ?? ''}`);
}

export async function verifyCopiedLibrary(sourceDb: OpenStageDatabase, targetDb: OpenStageDatabase): Promise<LegacyClaimVerification> {
  const [sourceSongs, targetSongs, sourceSetlist, targetSetlist, sourceSetlists, targetSetlists, sourceRestorePoints, targetRestorePoints] = await Promise.all([
    sourceDb.songs.toArray(),
    targetDb.songs.toArray(),
    sourceDb.setlist.toArray(),
    targetDb.setlist.toArray(),
    sourceDb.setlists.toArray(),
    targetDb.setlists.toArray(),
    sourceDb.restorePoints.toArray(),
    targetDb.restorePoints.toArray()
  ]);

  const source = {
    songs: sourceSongs.length,
    setlist: sourceSetlist.length,
    setlists: sourceSetlists.length,
    restorePoints: sourceRestorePoints.length,
    hasLegacySettings: Boolean(getLegacySettingsSnapshot())
  };
  const target = {
    songs: targetSongs.length,
    setlist: targetSetlist.length,
    setlists: targetSetlists.length,
    restorePoints: targetRestorePoints.length,
    hasLegacySettings: false
  };

  return {
    source,
    target,
    songIdsMatch: sameStrings(sortedIds(sourceSongs), sortedIds(targetSongs)),
    setlistIdsMatch:
      sameStrings(sortedIds(sourceSetlist), sortedIds(targetSetlist)) &&
      sameStrings(sortedIds(sourceSetlists), sortedIds(targetSetlists)),
    restorePointIdsMatch: sameStrings(sortedIds(sourceRestorePoints), sortedIds(targetRestorePoints)),
    setlistOrderMatches:
      sameStrings(setlistOrders(sourceSetlist), setlistOrders(targetSetlist)) &&
      sameStrings(savedSetlistOrders(sourceSetlists), savedSetlistOrders(targetSetlists)),
    representativeChartsMatch: sameStrings(representativeCharts(sourceSongs), representativeCharts(targetSongs))
  };
}

export function legacyClaimVerificationPassed(verification: LegacyClaimVerification) {
  return (
    verification.source.songs === verification.target.songs &&
    verification.source.setlist === verification.target.setlist &&
    verification.source.setlists === verification.target.setlists &&
    verification.source.restorePoints === verification.target.restorePoints &&
    verification.songIdsMatch &&
    verification.setlistIdsMatch &&
    verification.restorePointIdsMatch &&
    verification.setlistOrderMatches &&
    verification.representativeChartsMatch
  );
}

export async function claimLegacyLibraryForUser(userId: string): Promise<LegacyClaimResult> {
  const sourceDb = new OpenStageDatabase(legacyOpenStageDatabaseName);
  const targetDb = new OpenStageDatabase(getDatabaseNameForUser(userId));
  try {
    const [songs, setlist, setlists, restorePoints] = await Promise.all([
      sourceDb.songs.toArray(),
      sourceDb.setlist.toArray(),
      sourceDb.setlists.toArray(),
      sourceDb.restorePoints.toArray()
    ]);

    await targetDb.transaction('rw', targetDb.songs, targetDb.setlist, targetDb.setlists, targetDb.restorePoints, async () => {
      await targetDb.songs.bulkPut(songs);
      await targetDb.setlist.bulkPut(setlist);
      await targetDb.setlists.bulkPut(setlists);
      await targetDb.restorePoints.bulkPut(restorePoints);
    });

    const settingsCopied = copyLegacySettingsForUser(userId);
    const verification = await verifyCopiedLibrary(sourceDb, targetDb);
    verification.target.hasLegacySettings = settingsCopied;

    if (!legacyClaimVerificationPassed(verification)) {
      throw new Error('Library copy could not be verified. Your original library has not been changed.');
    }

    markLegacyLibraryClaimed(userId);

    return {
      targetDatabaseName: getDatabaseNameForUser(userId),
      targetSettingsKey: getAppStoreStorageKeyForUser(userId),
      verification
    };
  } finally {
    sourceDb.close();
    targetDb.close();
  }
}

export function userScopedSettingsMigrationSummary() {
  return {
    copied: ['performance display preferences', 'formatting profiles', 'pedal mappings', 'musical performance preferences'],
    excluded: ['logs', 'diagnostics runtime state', 'temporary modal state', 'Search Import session', 'receiver pairing/session localStorage']
  };
}
