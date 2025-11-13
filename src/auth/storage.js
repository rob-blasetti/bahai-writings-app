const AUTH_STORAGE_KEY = 'bahai-writings-app/authState';

let cachedAsyncStorage = null;
let hasLoggedMissingAsyncStorage = false;

function createInMemoryStorage() {
  const store = new Map();
  return {
    async getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setItem(key, value) {
      store.set(key, value);
    },
    async removeItem(key) {
      store.delete(key);
    },
  };
}

export function getAsyncStorageModule() {
  if (cachedAsyncStorage) {
    return cachedAsyncStorage;
  }

  try {
    const maybeModule = require('@react-native-async-storage/async-storage');
    const resolvedModule = maybeModule?.default ?? maybeModule;
    if (resolvedModule) {
      cachedAsyncStorage = resolvedModule;
      return cachedAsyncStorage;
    }
  } catch (error) {
    if (!hasLoggedMissingAsyncStorage) {
      console.warn(
        '[Storage] AsyncStorage module not available; using in-memory fallback. Install @react-native-async-storage/async-storage to persist sessions across restarts.',
      );
      hasLoggedMissingAsyncStorage = true;
    }
  }

  cachedAsyncStorage = createInMemoryStorage();
  return cachedAsyncStorage;
}

export async function loadPersistedAuthState() {
  const storage = getAsyncStorageModule();
  try {
    const rawValue = await storage.getItem(AUTH_STORAGE_KEY);
    if (!rawValue) {
      return null;
    }
    const parsedValue = JSON.parse(rawValue);
    if (parsedValue && typeof parsedValue === 'object') {
      return parsedValue;
    }
  } catch (error) {
    console.warn('[Auth] Unable to read persisted auth state', error);
  }
  return null;
}

export async function savePersistedAuthState(value) {
  const storage = getAsyncStorageModule();
  try {
    if (!value) {
      await storage.removeItem(AUTH_STORAGE_KEY);
      return;
    }
    await storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('[Auth] Unable to persist auth state', error);
  }
}

export async function clearPersistedAuthState() {
  const storage = getAsyncStorageModule();
  try {
    await storage.removeItem(AUTH_STORAGE_KEY);
  } catch (error) {
    console.warn('[Auth] Unable to clear persisted auth state', error);
  }
}

export { AUTH_STORAGE_KEY };
