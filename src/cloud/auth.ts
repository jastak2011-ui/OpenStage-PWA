import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from './config';

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

export async function signInWithEmail(email: string, password: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
}

export async function createAccountWithEmail(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({
    email,
    password
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

export async function getCloudAccessToken(): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Sign in to use OpenStage Cloud.');
  return token;
}

export type OpenStageProfile = {
  user_id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'user';
  disabled: boolean;
  created_at?: string;
  updated_at?: string;
};

export function getCachedProfileStorageKey(userId: string) {
  return `openstage.cloud.profile:${encodeURIComponent(userId)}`;
}

export function readCachedProfile(userId: string): OpenStageProfile | null {
  try {
    const raw = window.localStorage.getItem(getCachedProfileStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OpenStageProfile;
    if (parsed?.user_id !== userId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function cacheProfile(profile: OpenStageProfile) {
  try {
    window.localStorage.setItem(getCachedProfileStorageKey(profile.user_id), JSON.stringify(profile));
  } catch {
    // Local Stage can continue if the profile cache cannot be written.
  }
}

export async function getOpenStageProfile(userId: string): Promise<OpenStageProfile> {
  const client = requireSupabase();
  const { data, error } = await client
    .from('openstage_profiles')
    .select('user_id, email, display_name, role, disabled, created_at, updated_at')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  const role = data?.role === 'admin' ? 'admin' : 'user';
  return {
    user_id: data.user_id,
    email: typeof data.email === 'string' ? data.email : '',
    display_name: typeof data.display_name === 'string' ? data.display_name : null,
    role,
    disabled: Boolean(data.disabled),
    created_at: typeof data.created_at === 'string' ? data.created_at : undefined,
    updated_at: typeof data.updated_at === 'string' ? data.updated_at : undefined
  };
}

export async function sendPasswordResetEmail(email: string) {
  const client = requireSupabase();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  });
  if (error) throw error;
}

export async function updateCloudPassword(password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.updateUser({ password });
  if (error) throw error;
  return data.user ?? null;
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
