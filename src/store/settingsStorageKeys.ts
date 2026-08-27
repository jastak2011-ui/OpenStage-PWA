export const appStoreStorageKey = 'openstage-app-store-v1';

export function getAppStoreStorageKeyForUser(userId?: string | null) {
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';
  if (!normalizedUserId) return appStoreStorageKey;
  return `${appStoreStorageKey}:${encodeURIComponent(normalizedUserId)}`;
}

export const userOwnedSettings = [
  'display formatting profiles',
  'pedal mappings and preferences',
  'performance preferences',
  'musical user preferences'
] as const;

export const deviceLocalSettings = [
  'temporary modal state',
  'current Search Import session',
  'receiver connection/session state',
  'device-specific runtime state'
] as const;
