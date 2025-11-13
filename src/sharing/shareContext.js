import React, { createContext, useContext, useMemo, useState } from 'react';
import { shareThemes } from './themePresets';

const ShareContext = createContext(null);

export function ShareProvider({ children }) {
  const [shareThemeId, setShareThemeId] = useState(shareThemes[0]?.id ?? 'warmGlow');
  const [shareSession, setShareSession] = useState(null);
  const [selectedSentenceIndexes, setSelectedSentenceIndexes] = useState([]);

  const value = useMemo(
    () => ({
      shareThemes,
      shareThemeId,
      setShareThemeId,
      shareSession,
      setShareSession,
      selectedSentenceIndexes,
      setSelectedSentenceIndexes,
    }),
    [shareThemeId, shareSession, selectedSentenceIndexes],
  );

  return <ShareContext.Provider value={value}>{children}</ShareContext.Provider>;
}

export function useShare() {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error('useShare must be used within a ShareProvider');
  }
  return context;
}
