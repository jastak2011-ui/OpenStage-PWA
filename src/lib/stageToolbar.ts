export const stageToolbarShareSongLabel = 'Share Song';

export const stageTopToolbarActionLabels = [
  'Share Song',
  'Edit Song',
  'Format',
  'External Display',
  'More'
] as const;

export const stageMoreMenuActionLabels = [
  'Favorite',
  'Edit Song',
  'External Display',
  'Settings',
  'Diagnostics',
  'Pedals',
  'Import / Export',
  'Sync'
] as const;

export function hasStageTopToolbarAction(label: string) {
  return (stageTopToolbarActionLabels as readonly string[]).includes(label);
}

export function hasStageMoreMenuAction(label: string) {
  return (stageMoreMenuActionLabels as readonly string[]).includes(label);
}

export function isBpmVisualControlAvailable() {
  return true;
}
