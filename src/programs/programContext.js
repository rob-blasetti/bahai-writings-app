import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { Share as NativeShare } from 'react-native';
import { useAuth } from '../auth/authContext';
import {
  PROGRAM_FREQUENCY_OPTIONS,
  WEEKDAY_LABELS,
  formatProgramFrequencyLabel,
} from './programUtils';
import { createDevotionalActivity, resolveDevotionalEndpoint } from './programService';
import { cleanBlockText, createPassageSnapshot } from '../writings/passageUtils';

const ProgramContext = createContext(null);

export function ProgramProvider({ children }) {
  const { user } = useAuth();
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
  }, [defaultProgramTimeZone, setProgramFieldError]);

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

  const value = {
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
  };

  return (
    <ProgramContext.Provider value={value}>{children}</ProgramContext.Provider>
  );
}

export function useProgram() {
  const context = useContext(ProgramContext);
  if (!context) {
    throw new Error('useProgram must be used within a ProgramProvider');
  }
  return context;
}
