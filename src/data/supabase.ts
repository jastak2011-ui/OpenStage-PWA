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
  void songs;
  throw new Error('Legacy direct Supabase song sync is disabled. Use authenticated OpenStage Cloud backup instead.');
}

export async function pullSongsFromSupabase(): Promise<Song[]> {
  throw new Error('Legacy direct Supabase song sync is disabled. Use authenticated OpenStage Cloud restore instead.');
}
