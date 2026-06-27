export function createId(prefix = 'id') {
  const randomUuid = getRandomUuid();
  if (randomUuid) return randomUuid;

  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2);
  return `${prefix}-${timePart}-${randomPart}`;
}

export function createSongUuid() {
  const randomUuid = getRandomUuid();
  if (randomUuid) return randomUuid;

  const bytes = new Array(16).fill(0).map(() => Math.floor(Math.random() * 256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function getRandomUuid() {
  try {
    const cryptoLike = globalThis.crypto;
    if (cryptoLike && typeof cryptoLike.randomUUID === 'function') {
      return cryptoLike.randomUUID();
    }
  } catch {
    return '';
  }

  return '';
}
