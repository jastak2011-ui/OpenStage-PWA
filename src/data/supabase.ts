import type { Song } from '../types';
import { supabase } from '../cloud/config';

export { supabase };

export async function signInWithEmail(email: string) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin }
  });

  if (error) throw error;
}

export async function signOutSupabase() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function pushSongsToSupabase(songs: Song[]) {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { error } = await supabase.from('songs').upsert(
    songs.map((song) => ({
      id: song.id,
      title: song.title,
      subtitle: song.subtitle ?? '',
      artist: song.artist,
      album: song.album ?? '',
      genre: song.genre ?? '',
      vocal_range: song.vocalRange ?? '',
      difficulty: song.difficulty ?? '',
      tuning: song.tuning ?? '',
      original_key: song.originalKey ?? '',
      performance_key: song.performanceKey ?? song.key,
      duration_seconds: song.durationSeconds ?? null,
      year: song.year ?? null,
      band_notes: song.bandNotes ?? '',
      rehearsal_notes: song.rehearsalNotes ?? [],
      favorite: Boolean(song.favorite),
      key: song.key,
      capo: song.capo,
      bpm: song.bpm,
      time_signature: song.timeSignature,
      tags: song.tags,
      notes: song.notes,
      chart: song.chart,
      raw_chordpro: song.rawChordPro ?? song.chart,
      parsed_chordpro: song.parsedChordPro ?? null,
      updated_at: song.updatedAt
    }))
  );

  if (error) throw error;
}

export async function pullSongsFromSupabase(): Promise<Song[]> {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.from('songs').select('*').order('title');
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle ?? '',
    artist: row.artist ?? '',
    album: row.album ?? '',
    genre: row.genre ?? '',
    vocalRange: row.vocal_range ?? '',
    difficulty: row.difficulty ?? '',
    tuning: row.tuning ?? '',
    originalKey: row.original_key ?? row.key ?? '',
    performanceKey: row.performance_key ?? row.key ?? '',
    durationSeconds: Number(row.duration_seconds ?? 0) || undefined,
    year: Number(row.year ?? 0) || undefined,
    bandNotes: row.band_notes ?? '',
    rehearsalNotes: Array.isArray(row.rehearsal_notes) ? row.rehearsal_notes : [],
    favorite: Boolean(row.favorite),
    key: row.key ?? '',
    capo: Number(row.capo ?? 0),
    bpm: Number(row.bpm ?? 0),
    timeSignature: row.time_signature ?? '4/4',
    tags: Array.isArray(row.tags) ? row.tags : [],
    notes: row.notes ?? '',
    chart: row.chart ?? '',
    rawChordPro: row.raw_chordpro ?? row.chart ?? '',
    parsedChordPro: row.parsed_chordpro ?? undefined,
    updatedAt: row.updated_at ?? new Date().toISOString()
  }));
}
