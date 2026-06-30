import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  currentCloudUserId,
  getCurrentUser,
  onAuthStateChanged,
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signOut as signOutCloud
} from './auth';
import { cloudConfigured, supabase } from './config';

type CloudSignInMethod = 'google' | 'apple' | 'email';

type CloudContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signIn: (method: CloudSignInMethod, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const CloudContext = createContext<CloudContextValue>({
  user: null,
  loading: true,
  configured: cloudConfigured,
  signIn: async () => undefined,
  signOut: async () => undefined
});

export function CloudProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    let active = true;

    void getCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = onAuthStateChanged((nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo<CloudContextValue>(() => ({
    user,
    loading,
    configured: cloudConfigured,
    async signIn(method, email) {
      if (method === 'google') return signInWithGoogle();
      if (method === 'apple') return signInWithApple();
      if (!email) throw new Error('Email is required.');
      return signInWithEmail(email);
    },
    signOut: signOutCloud
  }), [loading, user]);

  return createElement(CloudContext.Provider, { value }, children);
}

export function useCloud() {
  return useContext(CloudContext);
}

export { currentCloudUserId };
