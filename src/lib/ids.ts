export function createId(prefix = 'id') {
  const randomUuid = getRandomUuid();
  if (randomUuid) return randomUuid;

  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2);
  return `${prefix}-${timePart}-${randomPart}`;
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
