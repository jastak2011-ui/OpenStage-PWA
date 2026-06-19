import type { Song } from '../types';

export type CastState = {
  title: string;
  artist: string;
  chart: string;
  updatedAt: string;
};

export const castStateStorageKey = 'openstage-cast-state-v1';

export const fallbackCastState: CastState = {
  title: 'Take It Easy',
  artist: 'Eagles',
  chart: "Well I'm running down the road\nTryin' to loosen my load",
  updatedAt: 'not yet',
};

export function castStateFromSong(song: Song, updatedAt = new Date().toISOString()): CastState {
  return {
    title: song.title || fallbackCastState.title,
    artist: song.artist || song.subtitle || fallbackCastState.artist,
    chart: song.chart || song.rawChordPro || fallbackCastState.chart,
    updatedAt,
  };
}

export function publishCastState(state: CastState) {
  try {
    localStorage.setItem(castStateStorageKey, JSON.stringify(state));
  } catch {
    return false;
  }

  try {
    const channel = new BroadcastChannel('openstage-cast-state');
    channel.postMessage(state);
    channel.close();
  } catch {
    // Polling localStorage is enough for this receiver test.
  }

  return true;
}

export function loadLocalCastState(): CastState | null {
  try {
    const raw = localStorage.getItem(castStateStorageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CastState>;
    return normalizeCastState(parsed);
  } catch {
    return null;
  }
}

export function normalizeCastState(state: Partial<CastState> | null | undefined): CastState {
  return {
    title: typeof state?.title === 'string' && state.title.trim() ? state.title : fallbackCastState.title,
    artist: typeof state?.artist === 'string' && state.artist.trim() ? state.artist : fallbackCastState.artist,
    chart: typeof state?.chart === 'string' && state.chart.trim() ? state.chart : fallbackCastState.chart,
    updatedAt: typeof state?.updatedAt === 'string' && state.updatedAt.trim() ? state.updatedAt : 'unknown',
  };
}

export async function fetchStaticCastState(): Promise<CastState | null> {
  try {
    const response = await fetch(`/cast-state.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return null;
    return normalizeCastState((await response.json()) as Partial<CastState>);
  } catch {
    return null;
  }
}
