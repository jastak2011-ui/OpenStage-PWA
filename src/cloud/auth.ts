import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from './config';

const temporaryCloudUserId = '00000000-0000-0000-0000-000000000001';

export function currentCloudUserId() {
  return temporaryCloudUserId;
}

function requireSupabase() {
  if (!supabase) throw new Error('Supabase is not configured.');
  return supabase;
}

export async function signInWithGoogle() {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
}

export async function signInWithApple() {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: window.location.origin
    }
  });
  if (error) throw error;
}

export async function signInWithEmail(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin
    }
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export function onAuthStateChanged(callback: (user: User | null, event: AuthChangeEvent, session: Session | null) => void) {
  if (!supabase) {
    callback(null, 'INITIAL_SESSION', null);
    return () => undefined;
  }

  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user ?? null, event, session);
  });

  return () => data.subscription.unsubscribe();
}
