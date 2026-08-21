const musicBrainzApiBaseUrl = 'https://musicbrainz.org/ws/2';
const musicBrainzCacheTtlMs = 10 * 60 * 1000;
const musicBrainzRateLimitMs = 1100;
const musicBrainzUserAgent =
  process.env.MUSICBRAINZ_USER_AGENT || 'OpenStage/0.1.0 ( https://openstage-pwa.onrender.com )';

const searchCache = new Map();
let throttleQueue = Promise.resolve();
let lastMusicBrainzRequestAt = 0;

export function normalizeMusicBrainzSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function quoteMusicBrainzQueryValue(value) {
  return `"${String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function createMusicBrainzRecordingQuery({ title, artist }) {
  const titleQuery = `recording:${quoteMusicBrainzQueryValue(title)}`;
  const artistQuery = artist?.trim() ? ` AND artist:${quoteMusicBrainzQueryValue(artist.trim())}` : '';
  return `${titleQuery}${artistQuery}`;
}

export function createMusicBrainzThrottle({ minIntervalMs = musicBrainzRateLimitMs, nowFn = Date.now, waitFn = wait } = {}) {
  let lastRequestAt = 0;
  return async function throttle() {
    const elapsed = nowFn() - lastRequestAt;
    if (elapsed < minIntervalMs) {
      await waitFn(minIntervalMs - elapsed);
    }
    lastRequestAt = nowFn();
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttleMusicBrainzRequest() {
  throttleQueue = throttleQueue.then(async () => {
    const elapsed = Date.now() - lastMusicBrainzRequestAt;
    if (elapsed < musicBrainzRateLimitMs) {
      await wait(musicBrainzRateLimitMs - elapsed);
    }
    lastMusicBrainzRequestAt = Date.now();
  });
  return throttleQueue;
}

function artistCreditName(recording) {
  return (recording?.['artist-credit'] || [])
    .map((credit) => `${credit?.name || ''}${credit?.joinphrase || ''}`)
    .join('')
    .trim();
}

function firstArtistMbid(recording) {
  return recording?.['artist-credit']?.find((credit) => credit?.artist?.id)?.artist?.id || '';
}

function releaseYear(date) {
  const match = String(date || '').match(/^\d{4}/);
  return match ? match[0] : '';
}

function pickRelease(recording) {
  const releases = Array.isArray(recording?.releases) ? recording.releases : [];
  return releases.find((release) => release?.status === 'Official') || releases[0] || {};
}

export function normalizeMusicBrainzRecording(recording, requested) {
  const release = pickRelease(recording);
  const artist = artistCreditName(recording);
  const titleMatch = normalizeMusicBrainzSearchText(recording?.title) === normalizeMusicBrainzSearchText(requested.title);
  const artistMatch = requested.artist?.trim()
    ? normalizeMusicBrainzSearchText(artist) === normalizeMusicBrainzSearchText(requested.artist)
    : false;
  const score = Number(recording?.score) || 0;
  const officialRelease = release?.status === 'Official';
  const rankScore =
    (titleMatch ? 10000 : 0) +
    (artistMatch ? 5000 : 0) +
    (officialRelease ? 500 : 0) +
    score;

  return {
    recordingMbid: typeof recording?.id === 'string' ? recording.id : '',
    title: typeof recording?.title === 'string' ? recording.title : '',
    artist,
    artistMbid: firstArtistMbid(recording),
    releaseTitle: typeof release?.title === 'string' ? release.title : '',
    releaseMbid: typeof release?.id === 'string' ? release.id : '',
    releaseDate: typeof release?.date === 'string' ? release.date : '',
    durationMs: Number.isFinite(Number(recording?.length)) ? Number(recording.length) : null,
    disambiguation: typeof recording?.disambiguation === 'string' ? recording.disambiguation : '',
    score,
    matchSummary: [
      titleMatch ? 'Exact title match' : '',
      artistMatch ? 'Exact artist match' : '',
      officialRelease ? 'Official release' : ''
    ].filter(Boolean).join(' + ') || `MusicBrainz score ${score}`,
    rankScore,
    releaseYear: releaseYear(release?.date)
  };
}

export function rankMusicBrainzRecordings(recordings, requested, limit = 5) {
  return (Array.isArray(recordings) ? recordings : [])
    .map((recording) => normalizeMusicBrainzRecording(recording, requested))
    .filter((candidate) => candidate.recordingMbid && candidate.title)
    .sort((left, right) => {
      if (right.rankScore !== left.rankScore) return right.rankScore - left.rankScore;
      return right.score - left.score;
    })
    .slice(0, limit)
    .map(({ rankScore, releaseYear: _releaseYear, ...candidate }) => candidate);
}

export async function searchMusicBrainzRecordings({ title, artist, fetchImpl = fetch, nowFn = Date.now } = {}) {
  const requestedTitle = String(title || '').trim();
  const requestedArtist = String(artist || '').trim();
  if (!requestedTitle) {
    const error = new Error('Song title is required.');
    error.status = 400;
    throw error;
  }

  const cacheKey = `${normalizeMusicBrainzSearchText(requestedTitle)}|${normalizeMusicBrainzSearchText(requestedArtist)}`;
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > nowFn()) return cached.results;

  await throttleMusicBrainzRequest();

  const params = new URLSearchParams({
    query: createMusicBrainzRecordingQuery({ title: requestedTitle, artist: requestedArtist }),
    fmt: 'json',
    limit: '15'
  });
  const url = `${musicBrainzApiBaseUrl}/recording?${params.toString()}`;
  const response = await fetchImpl(url, {
    headers: {
      'User-Agent': musicBrainzUserAgent,
      Accept: 'application/json'
    }
  });

  if (!response.ok) {
    const error = new Error(`MusicBrainz search failed with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const body = await response.json();
  const results = rankMusicBrainzRecordings(body?.recordings, { title: requestedTitle, artist: requestedArtist });
  searchCache.set(cacheKey, {
    expiresAt: nowFn() + musicBrainzCacheTtlMs,
    results
  });
  return results;
}
