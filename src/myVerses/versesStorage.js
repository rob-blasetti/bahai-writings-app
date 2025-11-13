import { getAsyncStorageModule } from '../auth/storage';

export const MY_VERSES_STORAGE_KEY = 'bahai-writings-app/myVerses';

export async function loadVersesFromStorage() {
  const storage = getAsyncStorageModule();
  try {
    const stored = await storage.getItem(MY_VERSES_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [];
    }

    return parsed
      .filter(
        item =>
          item &&
          typeof item === 'object' &&
          item.block &&
          typeof item.block.id !== 'undefined',
      )
      .map(item => ({
        ...item,
        savedAt:
          typeof item.savedAt === 'number' && Number.isFinite(item.savedAt)
            ? item.savedAt
            : Date.now(),
      }));
  } catch (error) {
    console.warn('[MyVerses] Unable to restore saved verses', error);
    return [];
  }
}

export async function persistVersesToStorage(verses) {
  const storage = getAsyncStorageModule();
  try {
    await storage.setItem(
      MY_VERSES_STORAGE_KEY,
      JSON.stringify(Array.isArray(verses) ? verses : []),
    );
  } catch (error) {
    console.warn('[MyVerses] Unable to persist saved verses', error);
  }
}
