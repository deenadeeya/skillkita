// Required on iOS/Android for Supabase auth (PKCE / crypto). Must load before @supabase/supabase-js.
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env'
  );
}

type StorageLike = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const isServer = typeof window === 'undefined';

const webStorage: StorageLike = {
  getItem: async (key) => (isServer ? null : window.localStorage.getItem(key)),
  setItem: async (key, value) => {
    if (!isServer) window.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    if (!isServer) window.localStorage.removeItem(key);
  },
};

const noStorage: StorageLike = {
  getItem: async () => null,
  setItem: async () => {},
  removeItem: async () => {},
};

/**
 * Lazy-load AsyncStorage only on native so web/SSR bundles do not initialize the RN native bridge.
 * Install with: npx expo install @react-native-async-storage/async-storage
 */
function getNativeAuthStorage(): StorageLike {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage as StorageLike;
}

function authOptions() {
  if (Platform.OS === 'web') {
    return {
      storage: isServer ? noStorage : webStorage,
      persistSession: !isServer,
      autoRefreshToken: !isServer,
      detectSessionInUrl: false as const,
    };
  }

  // iOS / Android: official Supabase + React Native persistence
  return {
    storage: getNativeAuthStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false as const,
  };
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: authOptions(),
});
