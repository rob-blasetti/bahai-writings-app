import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const ReflectionContext = createContext(null);

export function ReflectionProvider({ children }) {
  const [reflectionModalContext, setReflectionModalContext] = useState(null);
  const [reflectionInput, setReflectionInput] = useState('');

  const showReflection = useCallback(({
    block,
    writingTitle,
    sectionTitle,
  }) => {
    if (!block) {
      return;
    }
    const blockText = typeof block.text === 'string' ? block.text.trim() : '';
    if (blockText.length === 0) {
      return;
    }
    setReflectionModalContext({
      blockId: block.sourceId ?? block.id ?? null,
      blockText,
      writingTitle: writingTitle ?? null,
      sectionTitle: sectionTitle ?? null,
    });
    setReflectionInput('');
  }, []);

  const closeReflection = useCallback(() => {
    setReflectionModalContext(null);
    setReflectionInput('');
  }, []);

  const submitReflection = useCallback(() => {
    if (!reflectionModalContext) {
      return;
    }
    const trimmed = reflectionInput.trim();
    if (trimmed.length === 0) {
      return;
    }
    console.log('[Reflection] submitted', {
      blockId: reflectionModalContext.blockId,
      writingTitle: reflectionModalContext.writingTitle,
      sectionTitle: reflectionModalContext.sectionTitle,
      textLength: trimmed.length,
    });
    closeReflection();
  }, [closeReflection, reflectionInput, reflectionModalContext]);

  const value = useMemo(
    () => ({
      reflectionModalContext,
      reflectionInput,
      setReflectionInput,
      showReflection,
      closeReflection,
      submitReflection,
    }),
    [
      closeReflection,
      reflectionInput,
      reflectionModalContext,
      showReflection,
      submitReflection,
    ],
  );

  return (
    <ReflectionContext.Provider value={value}>
      {children}
    </ReflectionContext.Provider>
  );
}

export function useReflection() {
  const context = useContext(ReflectionContext);
  if (!context) {
    throw new Error('useReflection must be used within a ReflectionProvider');
  }
  return context;
}
