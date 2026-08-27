import Dexie from 'dexie';

export const legacyOpenStageDatabaseName = 'openstage-pwa';

export function getDatabaseNameForUser(userId?: string | null) {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!normalizedUserId) return legacyOpenStageDatabaseName;
  return `${legacyOpenStageDatabaseName}-${encodeURIComponent(normalizedUserId)}`;
}

export function createOpenStageDatabaseBase(userId?: string | null) {
  return new Dexie(getDatabaseNameForUser(userId));
}
