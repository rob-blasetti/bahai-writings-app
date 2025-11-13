import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { createPassageSnapshot } from '../writings/passageUtils';
import { loadVersesFromStorage, persistVersesToStorage } from './versesStorage';

const VersesContext = createContext(null);

function createVerseId() {
  const timestamp = Date.now();
  return `verse-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
}

export function VersesProvider({ children }) {
  const [verses, setVerses] = useState([]);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const stored = await loadVersesFromStorage();
      if (!isMounted) {
        return;
      }
      if (stored.length > 0) {
        setVerses(prev => {
          if (prev.length === 0) {
            return stored.sort((a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0));
          }
          const existingKeys = new Set(
            prev.map(
              item =>
                `${item.block?.id ?? ''}::${item.writingId ?? ''}::${
                  item.sectionId ?? ''
                }`,
            ),
          );
          const itemsToAdd = stored.filter(item => {
            const key = `${item.block?.id ?? ''}::${item.writingId ?? ''}::${
              item.sectionId ?? ''
            }`;
            if (existingKeys.has(key)) {
              return false;
            }
            existingKeys.add(key);
            return true;
          });
          return [...itemsToAdd, ...prev].sort(
            (a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0),
          );
        });
      }
      hasHydratedRef.current = true;
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }
    persistVersesToStorage(verses);
  }, [verses]);

  const addVerseFromBlock = useCallback(payload => {
    const snapshot = createPassageSnapshot(payload);
    if (!snapshot) {
      return 0;
    }

    const savedAt = Date.now();
    const verseItem = {
      ...snapshot,
      id: createVerseId(),
      savedAt,
    };

    let additions = 0;
    setVerses(previous => {
      const existing = Array.isArray(previous) ? previous : [];
      const existingKeys = new Set(
        existing.map(
          item =>
            `${item.block?.id ?? ''}::${item.writingId ?? ''}::${
              item.sectionId ?? ''
            }`,
        ),
      );

      const key = `${verseItem.block.id}::${verseItem.writingId ?? ''}::${
        verseItem.sectionId ?? ''
      }`;
      if (existingKeys.has(key)) {
        return existing;
      }
      additions = 1;
      return [verseItem, ...existing].sort(
        (a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0),
      );
    });

    return additions;
  }, []);

  const removeVerse = useCallback(verseId => {
    setVerses(previous => previous.filter(item => item.id !== verseId));
  }, []);

  const value = {
    verses,
    addVerseFromBlock,
    removeVerse,
  };

  return <VersesContext.Provider value={value}>{children}</VersesContext.Provider>;
}

export function useVerses() {
  const context = useContext(VersesContext);
  if (!context) {
    throw new Error('useVerses must be used within a VersesProvider');
  }
  return context;
}
