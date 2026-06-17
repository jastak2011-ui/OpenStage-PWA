export function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) return '-';
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remaining = total % 60;
  if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  return `${minutes}:${String(remaining).padStart(2, '0')}`;
}

export function parseDurationInput(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!/^\d+(?::\d{1,2}){0,2}$/.test(trimmed)) return undefined;

  const parts = trimmed.split(':').map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0)) return undefined;

  if (parts.length === 1) return parts[0] * 60;
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    if (seconds > 59) return undefined;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    if (minutes > 59 || seconds > 59) return undefined;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return undefined;
}

export function isValidDurationInput(value: string) {
  return value.trim() === '' || parseDurationInput(value) !== undefined;
}
