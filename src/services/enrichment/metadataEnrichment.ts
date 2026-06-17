import type { Song } from '../../types';

export type EnrichmentField =
  | 'title'
  | 'artist'
  | 'bpm'
  | 'durationSeconds'
  | 'genre'
  | 'vibe'
  | 'crowdScore'
  | 'danceability'
  | 'energy'
  | 'vocalDifficulty'
  | 'openerCandidate'
  | 'closerCandidate'
  | 'key'
  | 'deezerTrackId'
  | 'musicBrainzRecordingId'
  | 'lastFmUrl';

export type EnrichmentProposal = {
  field: EnrichmentField;
  current: string | number | boolean | undefined;
  proposed?: string | number | boolean;
  source: string;
  confidence: 'exact' | 'high' | 'medium' | 'inferred' | 'unavailable';
  note?: string;
};

export type EnrichmentResult = {
  proposals: EnrichmentProposal[];
  unavailable: EnrichmentProposal[];
  sourcesTried: string[];
};

type ProposalInput = Omit<EnrichmentProposal, 'current'>;

const LASTFM_API_KEY = import.meta.env.VITE_LASTFM_API_KEY as string | undefined;
const targetFields: EnrichmentField[] = [
  'title',
  'artist',
  'bpm',
  'durationSeconds',
  'genre',
  'vibe',
  'crowdScore',
  'danceability',
  'energy',
  'vocalDifficulty',
  'openerCandidate',
  'closerCandidate',
  'key'
];

export async function enrichSongMetadata(song: Song, library: Song[]): Promise<EnrichmentResult> {
  const proposals: ProposalInput[] = [];
  const sourcesTried: string[] = [];
  const localMatch = findLocalMatch(song, library);

  sourcesTried.push('Existing local library');
  if (localMatch) {
    collectLocalProposals(song, localMatch, proposals);
  }

  sourcesTried.push('Deezer');
  const deezer = await lookupDeezer(song);
  if (deezer) proposals.push(...deezer);

  sourcesTried.push('MusicBrainz');
  const musicBrainz = await lookupMusicBrainz(song);
  if (musicBrainz) proposals.push(...musicBrainz);

  sourcesTried.push('Last.fm');
  const lastFm = await lookupLastFm(song);
  if (lastFm) proposals.push(...lastFm);

  const bestByField = new Map<EnrichmentField, ProposalInput>();
  for (const proposal of proposals) {
    if (proposal.proposed === undefined || isBlank(proposal.proposed)) continue;
    const existing = bestByField.get(proposal.field);
    if (!existing || priorityOf(proposal.source) < priorityOf(existing.source)) {
      bestByField.set(proposal.field, proposal);
    }
  }

  const found = Array.from(bestByField.values()).map((proposal) => ({
    ...proposal,
    current: getSongField(song, proposal.field)
  }));

  const unavailable = targetFields
    .filter((field) => !bestByField.has(field))
    .map((field) => ({
      field,
      current: getSongField(song, field),
      source: 'MusicBrainz + Last.fm + Deezer',
      confidence: 'unavailable' as const,
      note: field === 'key' ? 'No reliable key source is configured.' : notFoundNote(field)
    }));

  return { proposals: found, unavailable, sourcesTried };
}

export function applyEnrichment(song: Song, proposals: EnrichmentProposal[], overwrite = false): Song {
  const next = { ...song };
  for (const proposal of proposals) {
    if (proposal.proposed === undefined) continue;
    if (!overwrite && !isMissing(getSongField(next, proposal.field))) continue;
    setSongField(next, proposal.field, proposal.proposed);
  }
  return next;
}

function collectLocalProposals(song: Song, match: Song, proposals: ProposalInput[]) {
  const fields: EnrichmentField[] = [
    'title',
    'artist',
    'bpm',
    'durationSeconds',
    'genre',
    'vibe',
    'crowdScore',
    'danceability',
    'energy',
    'vocalDifficulty',
    'openerCandidate',
    'closerCandidate',
    'key'
  ];
  for (const field of fields) {
    const proposed = getSongField(match, field);
    if (!isBlank(proposed)) proposals.push({ field, proposed, source: 'Existing local library', confidence: 'exact' });
  }
}

async function lookupDeezer(song: Song): Promise<ProposalInput[] | null> {
  try {
    const query = encodeURIComponent(`track:"${song.title}" artist:"${song.artist}"`);
    const search = await fetchDeezerJson<{ data?: DeezerTrack[] }>(`https://api.deezer.com/search/track?q=${query}&limit=5`);
    const track = bestDeezerTrack(song, search.data ?? []);
    if (!track) return null;

    let fullTrack: DeezerTrack = track;
    try {
      fullTrack = await fetchDeezerJson<DeezerTrack>(`https://api.deezer.com/track/${track.id}`);
    } catch {
      // Search results still provide duration and rank.
    }

    const proposals: ProposalInput[] = [
      { field: 'deezerTrackId', proposed: String(track.id), source: 'Deezer', confidence: 'high' },
      { field: 'title', proposed: track.title, source: 'Deezer', confidence: 'high' },
      { field: 'artist', proposed: track.artist?.name, source: 'Deezer', confidence: 'high' },
      { field: 'durationSeconds', proposed: positiveNumber(track.duration), source: 'Deezer', confidence: 'high' },
      { field: 'bpm', proposed: positiveNumber(fullTrack.bpm), source: 'Deezer', confidence: 'high' },
      { field: 'crowdScore', proposed: scoreFromRank(track.rank), source: 'Deezer', confidence: 'inferred', note: 'Inferred from Deezer rank.' }
    ];

    return proposals.filter((proposal) => !isBlank(proposal.proposed));
  } catch {
    return null;
  }
}

async function lookupMusicBrainz(song: Song): Promise<ProposalInput[] | null> {
  try {
    const query = encodeURIComponent(`recording:"${song.title}" AND artist:"${song.artist}"`);
    const data = await fetchJson<MusicBrainzRecordingSearch>(`https://musicbrainz.org/ws/2/recording?query=${query}&fmt=json&limit=5`);
    const recording = bestMusicBrainzRecording(song, data.recordings ?? []);
    if (!recording) return null;
    const artist = recording['artist-credit']?.map((credit) => credit.name).join('') || undefined;
    const proposals: ProposalInput[] = [
      { field: 'musicBrainzRecordingId', proposed: recording.id, source: 'MusicBrainz', confidence: 'high' },
      { field: 'title', proposed: recording.title, source: 'MusicBrainz', confidence: 'high' },
      { field: 'artist', proposed: artist, source: 'MusicBrainz', confidence: 'high' },
      { field: 'durationSeconds', proposed: recording.length ? Math.round(recording.length / 1000) : undefined, source: 'MusicBrainz', confidence: 'high' }
    ];
    return proposals.filter((proposal) => !isBlank(proposal.proposed));
  } catch {
    return null;
  }
}

async function lookupLastFm(song: Song): Promise<ProposalInput[] | null> {
  if (!LASTFM_API_KEY) return null;
  try {
    const params = new URLSearchParams({
      method: 'track.getInfo',
      api_key: LASTFM_API_KEY,
      artist: song.artist,
      track: song.title,
      format: 'json',
      autocorrect: '1'
    });
    const data = await fetchJson<LastFmTrackResponse>(`https://ws.audioscrobbler.com/2.0/?${params}`);
    const track = data.track;
    if (!track) return null;
    const tags = normalizeLastFmTags(track.toptags?.tag);
    const inferred = inferMetadataFromTags(tags);
    const listeners = Number(track.listeners ?? 0);
    const playcount = Number(track.playcount ?? 0);
    const proposals: ProposalInput[] = [
      { field: 'lastFmUrl', proposed: track.url, source: 'Last.fm', confidence: 'high' },
      { field: 'title', proposed: track.name, source: 'Last.fm', confidence: 'high' },
      { field: 'artist', proposed: track.artist?.name, source: 'Last.fm', confidence: 'high' },
      { field: 'durationSeconds', proposed: Number(track.duration) > 0 ? Math.round(Number(track.duration) / 1000) : undefined, source: 'Last.fm', confidence: 'medium' },
      { field: 'genre', proposed: inferred.genre, source: 'Last.fm tags', confidence: 'inferred', note: `Tags: ${tags.join(', ')}` },
      { field: 'vibe', proposed: inferred.vibe, source: 'Last.fm tags', confidence: 'inferred', note: `Tags: ${tags.join(', ')}` },
      { field: 'danceability', proposed: inferred.danceability, source: 'Last.fm tags', confidence: 'inferred', note: 'Conservative tag inference.' },
      { field: 'energy', proposed: inferred.energy, source: 'Last.fm tags', confidence: 'inferred', note: 'Conservative tag inference.' },
      { field: 'crowdScore', proposed: inferred.crowdScore ?? scorePopularity(listeners, playcount), source: 'Last.fm', confidence: 'inferred', note: 'Inferred from tags/listeners/playcount.' },
      { field: 'openerCandidate', proposed: inferred.openerCandidate, source: 'Last.fm tags', confidence: 'inferred' },
      { field: 'closerCandidate', proposed: inferred.closerCandidate, source: 'Last.fm tags', confidence: 'inferred' }
    ];
    return proposals.filter((proposal) => !isBlank(proposal.proposed));
  } catch {
    return null;
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });
  if (!response.ok) throw new Error(`Lookup failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchDeezerJson<T>(url: string): Promise<T> {
  try {
    return await fetchJson<T>(url);
  } catch {
    return fetchJsonp<T>(url);
  }
}

function fetchJsonp<T>(url: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackName = `openStageDeezer_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const separator = url.includes('?') ? '&' : '?';
    const script = document.createElement('script');
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error('Deezer JSONP lookup timed out.'));
    }, 8000);

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete (window as unknown as Record<string, unknown>)[callbackName];
    }

    (window as unknown as Record<string, (data: T) => void>)[callbackName] = (data: T) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Deezer JSONP lookup failed.'));
    };
    script.src = `${url}${separator}output=jsonp&callback=${callbackName}`;
    document.head.appendChild(script);
  });
}

function inferMetadataFromTags(tags: string[]) {
  const text = tags.join(' ');
  const hasAny = (terms: string[]) => terms.some((term) => text.includes(term));
  const result: {
    genre?: string;
    vibe?: string;
    crowdScore?: number;
    danceability?: number;
    energy?: number;
    openerCandidate?: boolean;
    closerCandidate?: boolean;
  } = {};

  if (hasAny(['folk', 'americana', 'bluegrass', 'country'])) {
    result.genre = 'Folk / Americana';
    result.vibe = hasAny(['acoustic', 'singer-songwriter']) ? 'Acoustic storytelling' : 'Roots';
    result.energy = 45;
  }
  if (hasAny(['rock', 'indie rock', 'alternative'])) {
    result.genre = result.genre ?? 'Rock';
    result.vibe = 'Driving';
    result.energy = Math.max(result.energy ?? 0, 70);
    result.openerCandidate = true;
  }
  if (hasAny(['dance', 'funk', 'pop', 'disco'])) {
    result.genre = result.genre ?? (hasAny(['funk']) ? 'Funk' : 'Pop');
    result.vibe = 'Danceable';
    result.danceability = 80;
    result.energy = Math.max(result.energy ?? 0, 75);
    result.crowdScore = 80;
    result.openerCandidate = true;
    result.closerCandidate = true;
  }
  if (hasAny(['ballad', 'sad', 'acoustic', 'slow'])) {
    result.vibe = result.vibe ?? 'Intimate';
    result.energy = Math.min(result.energy ?? 45, 40);
    result.danceability = Math.min(result.danceability ?? 35, 35);
  }
  if (hasAny(['anthem', 'sing along', 'sing-along', 'classic rock'])) {
    result.vibe = result.vibe ?? 'Anthemic';
    result.crowdScore = 85;
    result.closerCandidate = true;
  }

  return result;
}

function findLocalMatch(song: Song, library: Song[]) {
  const current = normalize(`${song.title} ${song.artist}`);
  return library.find((candidate) => candidate.id !== song.id && normalize(`${candidate.title} ${candidate.artist}`) === current);
}

function bestDeezerTrack(song: Song, tracks: DeezerTrack[]) {
  return tracks.find((track) => isLikelyMatch(song, track.title, track.artist?.name)) ?? tracks[0];
}

function bestMusicBrainzRecording(song: Song, recordings: MusicBrainzRecording[]) {
  return recordings.find((recording) => isLikelyMatch(song, recording.title, recording['artist-credit']?.map((credit) => credit.name).join(''))) ?? recordings[0];
}

function isLikelyMatch(song: Song, title = '', artist = '') {
  return normalize(title) === normalize(song.title) && (!song.artist || normalize(artist).includes(normalize(song.artist)));
}

function normalize(value: string) {
  return value.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, ' ').trim();
}

function normalizeLastFmTags(tags: LastFmTag[] | LastFmTag | undefined) {
  const tagList = Array.isArray(tags) ? tags : tags ? [tags] : [];
  return tagList.map((tag) => tag.name.toLowerCase()).filter(Boolean).slice(0, 12);
}

function positiveNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : undefined;
}

function scoreFromRank(rank: unknown) {
  const value = Number(rank);
  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.max(1, Math.min(100, Math.round(value / 10_000)));
}

function scorePopularity(listeners: number, playcount: number) {
  const raw = Math.log10(Math.max(1, listeners) + Math.max(1, playcount) / 4) * 18;
  return Math.max(1, Math.min(100, Math.round(raw)));
}

function priorityOf(source: string) {
  if (source === 'Existing local library') return 1;
  if (source === 'Deezer') return 2;
  if (source === 'MusicBrainz') return 3;
  if (source.startsWith('Last.fm')) return 4;
  return 5;
}

export function isMissing(value: unknown) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (typeof value === 'number') return !Number.isFinite(value) || value === 0;
  return false;
}

function isBlank(value: unknown) {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  return false;
}

function getSongField(song: Song, field: EnrichmentField) {
  if (field === 'vocalDifficulty') return song.vocalDifficulty ?? song.difficulty;
  if (field === 'key') return song.key;
  return song[field as keyof Song] as string | number | boolean | undefined;
}

function setSongField(song: Song, field: EnrichmentField, value: string | number | boolean) {
  if (field === 'vocalDifficulty') {
    song.vocalDifficulty = String(value);
    return;
  }
  if (field === 'key') {
    song.key = String(value);
    song.performanceKey = song.performanceKey || String(value);
    return;
  }
  (song as unknown as Record<string, string | number | boolean | undefined>)[field] = value;
}

function notFoundNote(field: EnrichmentField) {
  if (field === 'bpm') return 'BPM was attempted through Deezer but was not available.';
  if (field === 'genre' || field === 'vibe') return LASTFM_API_KEY ? 'No usable Last.fm tags found.' : 'Last.fm tags require VITE_LASTFM_API_KEY.';
  return 'Not found from available sources.';
}

type DeezerTrack = {
  id: number;
  title: string;
  duration?: number;
  bpm?: number;
  rank?: number;
  artist?: { name?: string };
};

type MusicBrainzRecordingSearch = {
  recordings?: MusicBrainzRecording[];
};

type MusicBrainzRecording = {
  id: string;
  title: string;
  length?: number;
  'artist-credit'?: Array<{ name: string }>;
};

type LastFmTrackResponse = {
  track?: {
    name?: string;
    url?: string;
    duration?: string;
    listeners?: string;
    playcount?: string;
    artist?: { name?: string };
    toptags?: { tag?: LastFmTag[] | LastFmTag };
  };
};

type LastFmTag = {
  name: string;
};
