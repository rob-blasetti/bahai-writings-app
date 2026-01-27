import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Share as NativeShare } from 'react-native';
import { useAuth } from '../auth/authContext';
import { shareThemes } from '../sharing/themePresets';
import { createPassageSnapshot, cleanBlockText } from '../writings/passageUtils';
import { loadVersesFromStorage, persistVersesToStorage } from '../myVerses/versesStorage';
import {
  PROGRAM_FREQUENCY_OPTIONS,
  WEEKDAY_LABELS,
  formatProgramFrequencyLabel,
} from '../programs/programUtils';
import { createDevotionalActivity, resolveDevotionalEndpoint } from '../programs/programService';

const AppContext = createContext(null);

function createVerseId() {
  const timestamp = Date.now();
  return `verse-${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AppProvider({ children }) {
  const { user } = useAuth();

  const [shareThemeId, setShareThemeId] = useState(shareThemes[0]?.id ?? 'warmGlow');
  const [shareSession, setShareSession] = useState(null);
  const [selectedSentenceIndexes, setSelectedSentenceIndexes] = useState([]);

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

  const defaultProgramTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
    } catch {
      return 'UTC';
    }
  }, []);

  const [programPassages, setProgramPassages] = useState([]);
  const [programTitle, setProgramTitle] = useState('');
  const [programNotes, setProgramNotes] = useState('');
  const [programSessionDate, setProgramSessionDate] = useState('');
  const [programSessionTime, setProgramSessionTime] = useState('');
  const [programTimeZone, setProgramTimeZone] = useState(defaultProgramTimeZone);
  const [programFrequency, setProgramFrequency] = useState(
    PROGRAM_FREQUENCY_OPTIONS[0].id,
  );
  const [programParticipants, setProgramParticipants] = useState('');
  const [programFacilitators, setProgramFacilitators] = useState('');
  const [includeCurrentUserAsFacilitator, setIncludeCurrentUserAsFacilitator] =
    useState(true);
  const [programFieldErrors, setProgramFieldErrors] = useState({});
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false);
  const [programSubmissionError, setProgramSubmissionError] = useState(null);
  const [programSubmissionSuccess, setProgramSubmissionSuccess] = useState(null);
  const [programReturnScreen, setProgramReturnScreen] = useState(null);

  const createProgramItemFromBlock = useCallback(payload => {
    const snapshot = createPassageSnapshot(payload);
    if (!snapshot) {
      return null;
    }
    return {
      ...snapshot,
      id: `program-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
  }, []);

  const addProgramItems = useCallback(newItems => {
    if (!Array.isArray(newItems) || newItems.length === 0) {
      return 0;
    }

    let additions = 0;

    setProgramPassages(previous => {
      const existing = Array.isArray(previous) ? previous : [];
      const existingKeys = new Set(
        existing.map(
          item =>
            `${item.block?.id ?? ''}::${item.writingId ?? ''}::${
              item.sectionId ?? ''
            }`,
        ),
      );

      const itemsToAdd = [];

      newItems.forEach(item => {
        if (!item?.block?.id) {
          return;
        }
        const key = `${item.block.id}::${item.writingId ?? ''}::${
          item.sectionId ?? ''
        }`;
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          itemsToAdd.push(item);
        }
      });

      additions = itemsToAdd.length;

      if (itemsToAdd.length === 0) {
        return existing;
      }

      return [...existing, ...itemsToAdd];
    });

    if (additions > 0) {
      setProgramSubmissionError(null);
      setProgramSubmissionSuccess(null);
    }

    return additions;
  }, []);

  const addProgramSections = useCallback(
    sections => {
      if (!Array.isArray(sections) || sections.length === 0) {
        return 0;
      }

      const items = [];

      sections.forEach(section => {
        if (!section || !Array.isArray(section.blocks)) {
          return;
        }

        section.blocks.forEach(block => {
          const programItem = createProgramItemFromBlock({
            block,
            writingId: section.writingId,
            writingTitle: section.writingTitle,
            sectionId: section.sectionId,
            sectionTitle: section.sectionTitle,
          });

          if (programItem) {
            items.push(programItem);
          }
        });
      });

      return addProgramItems(items);
    },
    [addProgramItems, createProgramItemFromBlock],
  );

  const removeProgramItem = useCallback(itemId => {
    setProgramPassages(previous => previous.filter(item => item.id !== itemId));
  }, []);

  const setProgramFieldError = useCallback((field, message) => {
    setProgramFieldErrors(previous => {
      if (message) {
        if (previous[field] === message) {
          return previous;
        }
        return { ...previous, [field]: message };
      }
      if (!previous[field]) {
        return previous;
      }
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }, []);

  const clearProgramFieldError = useCallback(field => {
    setProgramFieldError(field, null);
  }, [setProgramFieldError]);

  const resetProgramMetadata = useCallback(() => {
    setProgramTitle('');
    setProgramNotes('');
    setProgramSessionDate('');
    setProgramSessionTime('');
    setProgramTimeZone(defaultProgramTimeZone);
    setProgramFrequency(PROGRAM_FREQUENCY_OPTIONS[0].id);
    setProgramParticipants('');
    setProgramFacilitators('');
    setIncludeCurrentUserAsFacilitator(true);
    setProgramFieldErrors({});
  }, [defaultProgramTimeZone]);

  const clearProgram = useCallback(() => {
    setProgramPassages([]);
    setProgramSubmissionError(null);
    setProgramSubmissionSuccess(null);
    resetProgramMetadata();
  }, [resetProgramMetadata]);

  const shareProgram = useCallback(() => {
    if (programPassages.length === 0) {
      return;
    }

    const header = 'Devotional Program';
    const body = programPassages
      .map((item, index) => {
        const sourceLine = item.sectionTitle
          ? `${item.writingTitle} — ${item.sectionTitle}`
          : item.writingTitle ?? 'Selected passage';
        const fallbackShareText =
          item.block?.shareText ?? item.block?.text ?? '';
        const blockText =
          cleanBlockText(fallbackShareText) || fallbackShareText || '';
        return `${index + 1}. ${sourceLine}\n${blockText}`;
      })
      .join('\n\n');
    const message = `${header}\n\n${body}`;

    NativeShare.share({ message }).catch(error => {
      console.warn('Unable to share devotional program', error);
    });
  }, [programPassages]);

  const submitProgram = useCallback(async () => {
    if (programPassages.length === 0) {
      setProgramSubmissionError('Add at least one passage to submit.');
      setProgramSubmissionSuccess(null);
      return { success: false };
    }

    const trimmedTitle = programTitle.trim();
    if (!trimmedTitle) {
      setProgramFieldError('title', 'Enter a title for your devotional program.');
      setProgramSubmissionError('Please fix the highlighted fields.');
      setProgramSubmissionSuccess(null);
      return { success: false };
    }

    const trimmedSessionDate = programSessionDate.trim();
    if (!trimmedSessionDate) {
      setProgramFieldError('sessionDate', 'Select a session date.');
      setProgramSubmissionError('Please fix the highlighted fields.');
      setProgramSubmissionSuccess(null);
      return { success: false };
    }

    const normalizedTime = programSessionTime.trim();
    if (!normalizedTime) {
      setProgramFieldError('sessionTime', 'Select a session time.');
      setProgramSubmissionError('Please fix the highlighted fields.');
      setProgramSubmissionSuccess(null);
      return { success: false };
    }

    setProgramFieldErrors({});

    const sessionDateCandidate = new Date(
      `${trimmedSessionDate}T${normalizedTime}:00`,
    );
    if (Number.isNaN(sessionDateCandidate.getTime())) {
      setProgramFieldError(
        'sessionDate',
        'Session date or time looks invalid. Please adjust and try again.',
      );
      setProgramSubmissionError('Please fix the highlighted fields.');
      setProgramSubmissionSuccess(null);
      return { success: false };
    }
    const sessionDateIso = sessionDateCandidate.toISOString();
    const sessionDayLabel =
      WEEKDAY_LABELS[sessionDateCandidate.getDay()] ?? WEEKDAY_LABELS[0];

    const normalizeListInput = value =>
      (typeof value === 'string' ? value : '')
        .split(/[\n,;]+/g)
        .map(entry => entry.trim())
        .filter(Boolean);

    const participantList = normalizeListInput(programParticipants);
    const facilitatorList = normalizeListInput(programFacilitators);
    const facilitatorSet = new Set(facilitatorList);
    const resolvedMemberRef =
      typeof user?.memberRef === 'string'
        ? user.memberRef.trim()
        : typeof user?.userId === 'string'
        ? user.userId.trim()
        : '';
    if (includeCurrentUserAsFacilitator && resolvedMemberRef.length > 0) {
      facilitatorSet.add(resolvedMemberRef);
    }
    const normalizedFacilitators = Array.from(facilitatorSet).filter(Boolean);
    const frequencyLabel = formatProgramFrequencyLabel(programFrequency);

    const groupDetailsPayload = {
      day: sessionDayLabel,
      time: normalizedTime,
      frequency: frequencyLabel,
    };

    const endpoint = resolveDevotionalEndpoint();
    if (!endpoint) {
      setProgramSubmissionError(
        'Liquid Spirit endpoint is not configured. Update LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT.',
      );
      setProgramSubmissionSuccess(null);
      return { success: false };
    }

    setIsSubmittingProgram(true);
    setProgramSubmissionError(null);
    setProgramSubmissionSuccess(null);

    const descriptionSegments = [];
    const trimmedNotes = programNotes.trim();
    if (trimmedNotes) {
      descriptionSegments.push(trimmedNotes, '', 'Created with Kali');
    } else {
      descriptionSegments.push('Created with Kali');
    }
    const descriptionText = descriptionSegments
      .map(entry => entry.trimEnd())
      .join('\n')
      .trim();

    const payload = {
      title: trimmedTitle,
      ...(descriptionText ? { description: descriptionText } : {}),
      passages: programPassages.map(item => ({
        blockId: item.block.id,
        text: item.block.text,
        shareText: item.block.shareText ?? item.block.text,
        type: item.block.type,
        writingId: item.writingId,
        writingTitle: item.writingTitle,
        sectionId: item.sectionId,
        sectionTitle: item.sectionTitle,
        sourceId: item.block.sourceId,
        attribution: item.block.attribution ?? null,
        footnotes: item.block.footnotes ?? [],
      })),
      sessionDate: sessionDateIso,
      sessionTime: normalizedTime,
      timeZone:
        typeof programTimeZone === 'string' && programTimeZone.trim().length > 0
          ? programTimeZone.trim()
          : undefined,
      frequency: programFrequency,
      groupDetails: groupDetailsPayload,
      participants: participantList,
      facilitators: normalizedFacilitators,
    };

    try {
      const responseBody = await createDevotionalActivity(payload, {
        token: user?.token,
      });
      setProgramSubmissionSuccess(
        responseBody?.message ??
          'Devotional submitted to Liquid Spirit. Look for it on the activities dashboard.',
      );
      resetProgramMetadata();
      setProgramPassages([]);
      return { success: true, response: responseBody };
    } catch (error) {
      const message =
        error?.message ??
        'Unable to submit devotional program. Please try again in a moment.';
      console.warn('Unable to submit devotional program', error);
      setProgramSubmissionError(message);
      setProgramSubmissionSuccess(null);
      return { success: false, error: message };
    } finally {
      setIsSubmittingProgram(false);
    }
  }, [
    includeCurrentUserAsFacilitator,
    programFacilitators,
    programFrequency,
    programNotes,
    programParticipants,
    programPassages,
    programSessionDate,
    programSessionTime,
    programTimeZone,
    programTitle,
    resetProgramMetadata,
    setProgramFieldError,
    user?.memberRef,
    user?.token,
    user?.userId,
  ]);

  const value = useMemo(
    () => ({
      shareThemes,
      shareThemeId,
      setShareThemeId,
      shareSession,
      setShareSession,
      selectedSentenceIndexes,
      setSelectedSentenceIndexes,
      reflectionModalContext,
      reflectionInput,
      setReflectionInput,
      showReflection,
      closeReflection,
      submitReflection,
      verses,
      addVerseFromBlock,
      removeVerse,
      programPassages,
      programTitle,
      setProgramTitle,
      programNotes,
      setProgramNotes,
      programSessionDate,
      setProgramSessionDate,
      programSessionTime,
      setProgramSessionTime,
      programTimeZone,
      setProgramTimeZone,
      defaultProgramTimeZone,
      programFrequency,
      setProgramFrequency,
      programParticipants,
      setProgramParticipants,
      programFacilitators,
      setProgramFacilitators,
      includeCurrentUserAsFacilitator,
      setIncludeCurrentUserAsFacilitator,
      programFieldErrors,
      setProgramFieldErrors,
      setProgramFieldError,
      clearProgramFieldError,
      isSubmittingProgram,
      programSubmissionError,
      programSubmissionSuccess,
      programReturnScreen,
      setProgramReturnScreen,
      addProgramItems,
      addProgramSections,
      createProgramItemFromBlock,
      removeProgramItem,
      clearProgram,
      shareProgram,
      submitProgram,
      setProgramSubmissionError,
      setProgramSubmissionSuccess,
    }),
    [
      addProgramItems,
      addProgramSections,
      addVerseFromBlock,
      clearProgram,
      clearProgramFieldError,
      closeReflection,
      createProgramItemFromBlock,
      defaultProgramTimeZone,
      includeCurrentUserAsFacilitator,
      isSubmittingProgram,
      programFacilitators,
      programFieldErrors,
      programFrequency,
      programNotes,
      programParticipants,
      programPassages,
      programReturnScreen,
      programSessionDate,
      programSessionTime,
      programSubmissionError,
      programSubmissionSuccess,
      programTimeZone,
      programTitle,
      reflectionInput,
      reflectionModalContext,
      removeProgramItem,
      removeVerse,
      selectedSentenceIndexes,
      setProgramFieldError,
      shareProgram,
      shareSession,
      shareThemeId,
      showReflection,
      submitProgram,
      submitReflection,
      verses,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
