const songsterrApiBaseUrl = 'https://www.songsterr.com';
const songsterrUserAgent =
  process.env.SONGSTERR_USER_AGENT || 'OpenStage/0.1.0 ( https://openstage-pwa.onrender.com )';

function stripFeaturingNoise(value) {
  return String(value || '')
    .replace(/\((?:feat|ft|featuring)\.?[^)]*\)/giu, ' ')
    .replace(/\[(?:feat|ft|featuring)\.?[^\]]*\]/giu, ' ')
    .replace(/\b(?:feat|ft|featuring)\.?\b.+$/iu, ' ');
}

export function normalizeSongsterrMatchText(value) {
  return stripFeaturingNoise(value)
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugifySongsterrPart(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function absoluteSongsterrUrl(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    return new URL(value, songsterrApiBaseUrl).toString();
  } catch {
    return '';
  }
}

export function createSongsterrDirectUrl(candidate) {
  const returnedUrl = absoluteSongsterrUrl(candidate?.url || candidate?.tabUrl || candidate?.songUrl);
  if (returnedUrl) return returnedUrl;

  const songsterrId = candidate?.songsterrId || candidate?.songId || candidate?.id;
  const artist = candidate?.artist || candidate?.artistName;
  const title = candidate?.title || candidate?.songTitle;
  if (!songsterrId || !artist || !title) return '';

  const slug = [slugifySongsterrPart(artist), slugifySongsterrPart(title)].filter(Boolean).join('-');
  return `${songsterrApiBaseUrl}/a/wsa/${slug}-tab-s${encodeURIComponent(String(songsterrId))}`;
}

export function normalizeSongsterrCandidate(candidate, requested) {
  const songsterrId = candidate?.songId || candidate?.id || candidate?.songsterrId || '';
  const title = typeof candidate?.title === 'string' ? candidate.title : '';
  const artist = typeof candidate?.artist === 'string'
    ? candidate.artist
    : typeof candidate?.artistName === 'string'
      ? candidate.artistName
      : '';
  const titleMatch = normalizeSongsterrMatchText(title) === normalizeSongsterrMatchText(requested?.title);
  const artistMatch = normalizeSongsterrMatchText(artist) === normalizeSongsterrMatchText(requested?.artist);

  return {
    songsterrId: String(songsterrId),
    title,
    artist,
    directUrl: createSongsterrDirectUrl({ ...candidate, songsterrId, title, artist }),
    titleMatch,
    artistMatch
  };
}

export function rankSongsterrCandidates(candidates, requested) {
  return (Array.isArray(candidates) ? candidates : [])
    .map((candidate) => normalizeSongsterrCandidate(candidate, requested))
    .filter((candidate) => candidate.songsterrId && candidate.title && candidate.artist)
    .sort((left, right) => {
      const leftScore = (left.titleMatch ? 100 : 0) + (left.artistMatch ? 100 : 0);
      const rightScore = (right.titleMatch ? 100 : 0) + (right.artistMatch ? 100 : 0);
      return rightScore - leftScore;
    });
}

export async function resolveSongsterrSong({ title, artist, fetchImpl = fetch } = {}) {
  const requestedTitle = String(title || '').trim();
  const requestedArtist = String(artist || '').trim();
  if (!requestedTitle || !requestedArtist) {
    const error = new Error('Song title and artist are required.');
    error.status = 400;
    throw error;
  }

  const params = new URLSearchParams({ pattern: `${requestedTitle} ${requestedArtist}` });
  const response = await fetchImpl(`${songsterrApiBaseUrl}/a/ra/songs.json?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': songsterrUserAgent
    }
  });

  if (!response.ok) {
    const error = new Error(`Songsterr lookup failed with HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const candidates = rankSongsterrCandidates(await response.json(), {
    title: requestedTitle,
    artist: requestedArtist
  });
  const exact = candidates.find((candidate) => candidate.titleMatch && candidate.artistMatch && candidate.directUrl);

  if (!exact) {
    return {
      noExactMatch: true,
      candidates: candidates.slice(0, 5)
    };
  }

  return {
    noExactMatch: false,
    match: exact
  };
}
