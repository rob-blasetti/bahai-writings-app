import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Share as NativeShare,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReflectionModal from '../components/ReflectionModal';
import BaseScreen from '../components/BaseScreen';
import ToastNotification from '../components/ToastNotification';
import {
  AppNavigationContainer,
  AppNavigator,
  AuthNavigator,
  useAppNavigation,
} from '../navigation';
import { useAuth } from '../auth/authContext';
import { PROGRAM_FREQUENCY_OPTIONS } from '../programs/programUtils';
import { useApp } from './appContext';
import {
  cleanBlockText,
  extractPassageSentences,
  selectRandomPassage,
} from '../writings/passageUtils';
import { getShareableBlockText } from '../sharing/shareUtils';
import { useBlockRenderer } from '../writings/useBlockRenderer';
import { listRecentComments } from '../writings/annotationsService';
import { getWork, listWorks } from '../writings/worksService';
import { appStyles } from '../styles/components';

const styles = appStyles;
const SHARE_SELECTION_LIMIT = 2;
const SEARCH_HIGHLIGHT_DURATION_MS = 2500;
const TOAST_DURATION_MS = 2000;
const sectionPagerRef = { current: null };
const pendingSectionBlockIndexRef = { current: null };
const searchHighlightTimeoutRef = { current: null };
const toastTimeoutRef = { current: null };
const sectionViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 60,
};

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [toastMessage, setToastMessage] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [remoteWorks, setRemoteWorks] = useState([]);
  const [worksLoadError, setWorksLoadError] = useState(null);

  const [recentComments, setRecentComments] = useState([]);
  const [recentCommentsLoading, setRecentCommentsLoading] = useState(false);
  const [recentCommentsError, setRecentCommentsError] = useState(null);

  const {
    user: authenticatedUser,
    authEmail,
    setAuthEmail,
    authBahaiId,
    setAuthBahaiId,
    authPassword,
    setAuthPassword,
    authVerificationCode,
    setAuthVerificationCode,
    authResetToken,
    setAuthResetToken,
    authError,
    setAuthError,
    isAuthenticating,
    hasHydratedAuth,
    authMode,
    signIn,
    register,
    verifyRegistration,
    requestPasswordReset,
    validateResetToken,
    resetPassword,
    continueAsGuest,
    logout,
  } = useAuth();
  const {
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
    verses: myVerses,
    addVerseFromBlock,
    removeVerse,
  } = useApp();
  const {
    navigationRef,
    currentScreen,
    navigateToScreen,
    handleNavigationReady,
    handleNavigationStateChange,
    goBack,
  } = useAppNavigation();
  const isInAppFlow = authMode === 'user' || authMode === 'guest';

  useEffect(() => {
    let isMounted = true;

    const loadWorks = async () => {
      if (!isInAppFlow) {
        return;
      }

      try {
        setWorksLoadError(null);
        const token = authenticatedUser?.token ?? null;
        const works = await listWorks({ token });
        if (isMounted) {
          setRemoteWorks(works);
        }
      } catch (error) {
        console.warn('[Works] Unable to fetch works list', error);
        if (isMounted) {
          setWorksLoadError(error?.message ?? 'Unable to load works');
        }
      }
    };

    loadWorks();

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser?.token, isInAppFlow]);

  useEffect(() => {
    let isMounted = true;

    const loadRecent = async () => {
      if (!isInAppFlow) {
        return;
      }

      const token = authenticatedUser?.token ?? null;
      if (!token) {
        if (isMounted) {
          setRecentComments([]);
          setRecentCommentsLoading(false);
          setRecentCommentsError(null);
        }
        return;
      }

      try {
        setRecentCommentsLoading(true);
        setRecentCommentsError(null);
        const comments = await listRecentComments({ limit: 20 }, { token });
        if (isMounted) {
          setRecentComments(comments);
        }
      } catch (error) {
        console.warn('[Comments] Unable to load recent comments', error);
        if (isMounted) {
          setRecentCommentsError(error?.message ?? 'Unable to load recent comments');
        }
      } finally {
        if (isMounted) {
          setRecentCommentsLoading(false);
        }
      }
    };

    loadRecent();

    return () => {
      isMounted = false;
    };
  }, [authenticatedUser?.token, isInAppFlow]);

  const [activeCollectionKey, setActiveCollectionKey] = useState(null);
  const [selectedWritingId, setSelectedWritingId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [randomPassage, setRandomPassage] = useState(null);
  const [activeSearchHighlight, setActiveSearchHighlight] = useState(null);
  const [fontScale, setFontScale] = useState(1);
  const fontOptions = useMemo(
    () => [
      {
        id: 'font-small',
        label: 'Small',
        description: 'More text on the screen.',
        value: 0.9,
      },
      {
        id: 'font-medium',
        label: 'Medium',
        description: 'Balanced for most reading.',
        value: 1,
      },
      {
        id: 'font-large',
        label: 'Large',
        description: 'Easier on the eyes.',
        value: 1.2,
      },
    ],
    [],
  );
  const scaledTypography = useMemo(
    () => ({
      contentTitle: {
        fontSize: 24 * fontScale,
      },
      sectionDetailTitle: {
        fontSize: 20 * fontScale,
      },
      detailSubtitle: {
        fontSize: 16 * fontScale,
      },
      contentHeading: {
        fontSize: 18 * fontScale,
      },
      contentParagraph: {
        fontSize: 16 * fontScale,
        lineHeight: 26 * fontScale,
      },
      quoteText: {
        fontSize: 16 * fontScale,
        lineHeight: 26 * fontScale,
      },
      poetryLine: {
        fontSize: 16 * fontScale,
        lineHeight: 24 * fontScale,
      },
      listItemText: {
        fontSize: 16 * fontScale,
        lineHeight: 24 * fontScale,
      },
      passageNumber: {
        fontWeight: '700',
      },
      attributionText: {
        fontSize: 15 * fontScale,
        lineHeight: 24 * fontScale,
      },
      footnoteText: {
        fontSize: 14 * fontScale,
        lineHeight: 22 * fontScale,
      },
      passageMetaWriting: {
        fontSize: 20 * fontScale,
      },
      passageMetaSection: {
        fontSize: 16 * fontScale,
      },
    }),
    [fontScale],
  );
  const isPrayerWork = useCallback(work => {
    const title = String(work?.title ?? '');
    const workId = String(work?.workId ?? '');
    return /prayer/i.test(title) || /prayer/i.test(workId);
  }, []);

  const { prayersWorks, writingsWorks } = useMemo(() => {
    const prayers = [];
    const writings = [];

    (Array.isArray(remoteWorks) ? remoteWorks : []).forEach(work => {
      if (isPrayerWork(work)) {
        prayers.push(work);
      } else {
        writings.push(work);
      }
    });

    return { prayersWorks: prayers, writingsWorks: writings };
  }, [isPrayerWork, remoteWorks]);

  const collectionOptions = useMemo(
    () => [
      {
        key: 'writings',
        label: 'Writings',
        count: writingsWorks.length,
      },
      {
        key: 'prayers',
        label: 'Prayers',
        count: prayersWorks.length,
      },
    ],
    [prayersWorks.length, writingsWorks.length],
  );

  const resolvedActiveCollectionKey = activeCollectionKey || 'writings';

  const activeCollection = useMemo(() => {
    const match = collectionOptions.find(option => option.key === resolvedActiveCollectionKey);
    return match || collectionOptions[0] || { key: 'writings', label: 'Writings', count: 0 };
  }, [collectionOptions, resolvedActiveCollectionKey]);

  const scopedWritings = useMemo(() => {
    const source = resolvedActiveCollectionKey === 'prayers' ? prayersWorks : writingsWorks;
    return source.map(work => ({
      id: work.workId,
      title: work.title,
      author: work.author,
      language: work.language,
      version: work.version,
      toc: work.toc,
    }));
  }, [prayersWorks, resolvedActiveCollectionKey, writingsWorks]);
  const searchableSections = useMemo(() => [], []);
  const windowWidth = Dimensions.get('window').width;
  const horizontalInsets =
    (safeAreaInsets.left ?? 0) + (safeAreaInsets.right ?? 0);
  const sectionPageWidth = Math.max(windowWidth - horizontalInsets, 320);
  const sectionViewableItemsChanged = ({ viewableItems }) => {
    if (!Array.isArray(viewableItems) || viewableItems.length === 0) {
      return;
    }
    const nextIndex = viewableItems[0].index ?? 0;
    pendingSectionBlockIndexRef.current = nextIndex;
  };

  const showToast = useCallback(message => {
    if (!message) {
      return;
    }
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToastVisible(false);
    }, TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    if (worksLoadError) {
      showToast(worksLoadError);
    }
  }, [showToast, worksLoadError]);

  useEffect(() => {
    return () => {
      if (searchHighlightTimeoutRef.current) {
        clearTimeout(searchHighlightTimeoutRef.current);
      }
    };
  }, []);
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);
  const shareBackButtonLabel = useMemo(() => {
    if (!shareSession) {
      return 'Back';
    }
    if (shareSession.returnScreen === 'passage') {
      return 'Back to passage';
    }
    if (shareSession.returnScreen === 'section') {
      return 'Back to reading';
    }
    if (shareSession.returnScreen === 'home') {
      return 'Back to library';
    }
    return 'Back';
  }, [shareSession]);
  const activeShareTheme = useMemo(() => {
    if (!Array.isArray(shareThemes) || shareThemes.length === 0) {
      return null;
    }
    return (
      shareThemes.find(theme => theme.id === shareThemeId) ?? shareThemes[0]
    );
  }, [shareThemeId, shareThemes]);
  const [selectedWork, setSelectedWork] = useState(null);

  const selectedWriting = useMemo(() => selectedWork, [selectedWork]);

  const writingSections = useMemo(() => {
    if (!selectedWork) return [];
    const toc = Array.isArray(selectedWork.toc) ? selectedWork.toc : [];
    return toc.map(item => ({
      id: item.id,
      title: item.title,
      start: item.start,
      end: item.end,
    }));
  }, [selectedWork]);

  // Random passage / search features still rely on local parsing. Disable for now in
  // works-backed mode (we'll reintroduce later via a search endpoint).
  const availablePassages = useMemo(() => [], []);
  const programCount = programPassages.length;
  const hasProgramPassages = programCount > 0;
  const programBackButtonLabel = useMemo(() => {
    if (programReturnScreen === 'share') {
      return 'Back to sharing';
    }
    if (programReturnScreen === 'section') {
      return 'Back to reading';
    }
    if (programReturnScreen === 'passage') {
      return 'Back to passage';
    }
    if (programReturnScreen === 'writing') {
      return 'Back to sections';
    }
    if (programReturnScreen === 'settings') {
      return 'Back to settings';
    }
    if (programReturnScreen === 'home') {
      return 'Back to library';
    }
    return 'Back';
  }, [programReturnScreen]);

  useEffect(() => {
    if (!selectedWriting) {
      setSelectedSectionId(null);
      return;
    }

    if (writingSections.length === 0) {
      setSelectedSectionId(null);
      return;
    }

    setSelectedSectionId(previous => {
      if (previous && writingSections.some(section => section.id === previous)) {
        return previous;
      }
      return writingSections[0].id;
    });
  }, [selectedWriting, writingSections]);

  useEffect(() => {
    const nextIndex =
      typeof pendingSectionBlockIndexRef.current === 'number' &&
      pendingSectionBlockIndexRef.current >= 0
        ? pendingSectionBlockIndexRef.current
        : 0;

    let scrollTimeout = null;
    let scrollAttempts = 0;

    const attemptScroll = () => {
      if (!sectionPagerRef.current) {
        return false;
      }
      sectionPagerRef.current.scrollToOffset({
        offset: sectionPageWidth * nextIndex,
        animated: false,
      });
      pendingSectionBlockIndexRef.current = null;
      return true;
    };

    if (!attemptScroll()) {
      pendingSectionBlockIndexRef.current = nextIndex;
      const retryScroll = () => {
        if (attemptScroll()) {
          return;
        }
        scrollAttempts += 1;
        if (scrollAttempts < 5) {
          scrollTimeout = setTimeout(retryScroll, 100);
        }
      };
      scrollTimeout = setTimeout(retryScroll, 100);
    }

    return () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [selectedSectionId, sectionPageWidth]);

  const handleSelectWriting = useCallback(
    async writingId => {
      const workId = String(writingId ?? '').trim();
      if (!workId) {
        return;
      }

      setSelectedWritingId(workId);
      setSelectedSectionId(null);
      setRandomPassage(null);

      try {
        const token = authenticatedUser?.token ?? null;
        const work = await getWork(workId, { token });
        setSelectedWork(
          work
            ? {
                id: work.workId,
                workId: work.workId,
                title: work.title,
                author: work.author,
                language: work.language,
                version: work.version,
                toc: work.toc,
              }
            : null,
        );
      } catch (error) {
        console.warn('[Works] Unable to load work', { workId, error });
        setSelectedWork(null);
      }

      navigateToScreen('writing');
    },
    [authenticatedUser?.token, navigateToScreen],
  );

  const handleSelectSection = sectionId => {
    setSelectedSectionId(sectionId);
    // Works-backed reader
    navigateToScreen('workSection');
  };

  const activateSearchHighlight = useCallback(
    ({
      writingId,
      sectionId,
      blockId,
      query,
      matchIndex,
      blockTextLength,
    }) => {
      if (searchHighlightTimeoutRef.current) {
        clearTimeout(searchHighlightTimeoutRef.current);
      }

      const trimmedQuery =
        typeof query === 'string' ? query.trim() : '';

      if (!blockId || trimmedQuery.length === 0) {
        setActiveSearchHighlight(null);
        searchHighlightTimeoutRef.current = null;
        return;
      }

      const normalizedTerm = trimmedQuery.toLowerCase();
      const safeMatchIndex =
        typeof matchIndex === 'number' && matchIndex >= 0
          ? matchIndex
          : 0;
      const safeBlockLength =
        typeof blockTextLength === 'number' && blockTextLength > 0
          ? blockTextLength
          : 0;

      setActiveSearchHighlight({
        writingId,
        sectionId,
        blockId,
        term: trimmedQuery,
        normalizedTerm,
        matchIndex: safeMatchIndex,
        blockTextLength: safeBlockLength,
      });

      searchHighlightTimeoutRef.current = setTimeout(() => {
        setActiveSearchHighlight(null);
        searchHighlightTimeoutRef.current = null;
      }, SEARCH_HIGHLIGHT_DURATION_MS);
    },
    [],
  );

  const handleOpenSearchResult = useCallback(
    ({
      writingId,
      sectionId,
      blockId,
      blockIndex = 0,
      query,
      matchIndex,
      blockTextLength,
    }) => {
      if (!writingId || !sectionId) {
        return;
      }

      const normalizedBlockIndex =
        typeof blockIndex === 'number' && blockIndex >= 0
          ? blockIndex
          : 0;
      pendingSectionBlockIndexRef.current = normalizedBlockIndex;

      const isAlreadyViewingSection =
        currentScreen === 'section' &&
        selectedWritingId === writingId &&
        selectedSectionId === sectionId;

      if (isAlreadyViewingSection && sectionPagerRef.current) {
        pendingSectionBlockIndexRef.current = null;
        sectionPagerRef.current.scrollToOffset({
          offset: sectionPageWidth * normalizedBlockIndex,
          animated: true,
        });
      } else {
        setSelectedWritingId(writingId);
        setSelectedSectionId(sectionId);
      }

      navigateToScreen('section');
      activateSearchHighlight({
        writingId,
        sectionId,
        blockId,
        query,
        matchIndex,
        blockTextLength,
      });
    },
    [
      activateSearchHighlight,
      currentScreen,
      sectionPageWidth,
      selectedSectionId,
      selectedWritingId,
      navigateToScreen,
    ],
  );

  const handleOpenVerse = useCallback(
    verse => {
      if (!verse || !verse.writingId || !verse.sectionId) {
        return;
      }
      const blockId = verse.block?.id ?? null;
      const matchedPassage = blockId
        ? availablePassages.find(
            passage =>
              passage.writingId === verse.writingId &&
              passage.sectionId === verse.sectionId &&
              passage.block?.id === blockId,
          )
        : null;
      const blockIndex = matchedPassage?.blockIndex ?? 0;

      handleOpenSearchResult({
        writingId: verse.writingId,
        sectionId: verse.sectionId,
        blockId,
        blockIndex,
        query: null,
        matchIndex: 0,
        blockTextLength:
          typeof verse.block?.text === 'string' ? verse.block.text.length : 0,
      });
    },
    [availablePassages, handleOpenSearchResult],
  );

  const handleShowRandomPassage = () => {
    const nextPassage = selectRandomPassage(availablePassages);
    if (!nextPassage) {
      setRandomPassage(null);
      return;
    }

    setRandomPassage(nextPassage);
    navigateToScreen('passage');
  };

  const handleContinueRandomPassage = useCallback(() => {
    if (
      !randomPassage ||
      !randomPassage.writingId ||
      !randomPassage.sectionId
    ) {
      return;
    }

    handleOpenSearchResult({
      writingId: randomPassage.writingId,
      sectionId: randomPassage.sectionId,
      blockId: randomPassage.block?.id ?? null,
      blockIndex: randomPassage.blockIndex ?? 0,
      query: null,
      matchIndex: 0,
      blockTextLength:
        typeof randomPassage.block?.text === 'string'
          ? randomPassage.block.text.length
          : 0,
    });
  }, [handleOpenSearchResult, randomPassage]);

  const handleOpenShare = ({
    block,
    writingTitle,
    sectionTitle,
    returnScreen,
  }) => {
    if (!block) {
      console.log('[Share] handleOpenShare: missing block payload', {
        writingTitle,
        sectionTitle,
      });
      return;
    }
    const baseText = getShareableBlockText(block);
    const sentences = extractPassageSentences(baseText);
    const defaultSelection = sentences.length === 0
      ? []
      : sentences.length === 1
      ? [0]
      : [0, 1].filter(index => index < sentences.length);

    console.log('[Share] handleOpenShare: initialized context', {
      blockId: block.id ?? null,
      writingTitle,
      sectionTitle,
      sentenceCount: sentences.length,
      defaultSelection,
    });

    setShareSession({
      block,
      writingTitle,
      sectionTitle,
      returnScreen,
      passageText: baseText,
      sentences,
    });
    setSelectedSentenceIndexes(defaultSelection);
    navigateToScreen('shareSelect');
  };

  const handleShowReflectionModal = useCallback(
    ({ block, writingTitle, sectionTitle }) => {
      showReflection({ block, writingTitle, sectionTitle });
    },
    [showReflection],
  );

  const handleCloseReflectionModal = useCallback(() => {
    closeReflection();
  }, [closeReflection]);

  const handleSubmitReflection = useCallback(() => {
    submitReflection();
  }, [submitReflection]);

  const handleContinueAsGuest = async () => {
    await continueAsGuest();
    setAuthPassword('');
    setAuthError(null);
  };

  const handleOpenCollections = () => {
    // Works-backed experience: go straight to library list.
    setActiveCollectionKey('writings');
    navigateToScreen('home');
  };

  const handleSelectCollection = collectionKey => {
    setActiveCollectionKey(collectionKey);
    setSelectedWritingId(null);
    setSelectedSectionId(null);
    setRandomPassage(null);
    setProgramReturnScreen(null);
    navigateToScreen('home');
  };

  const handleOpenPrayers = () => {
    handleSelectCollection('prayers');
  };


  const handleStartSignIn = () => {
    setAuthError(null);
    navigateToScreen('signin');
  };

  const handleStartRegister = () => {
    setAuthError(null);
    navigateToScreen('register');
  };

  const handleOpenVerifyRegistration = () => {
    setAuthError(null);
    navigateToScreen('verify');
  };

  const handleOpenForgotPassword = () => {
    setAuthError(null);
    navigateToScreen('forgotPassword');
  };

  const handleOpenResetPassword = () => {
    setAuthError(null);
    navigateToScreen('resetPassword');
  };

  const handleCancelSignIn = () => {
    setAuthError(null);
    setAuthPassword('');
    navigateToScreen('start');
  };

  const handleSignIn = async () => {
    const trimmedEmail = authEmail.trim();
    const hasPassword = authPassword.length > 0;

    if (!trimmedEmail || !hasPassword) {
      setAuthError('Enter both email and password to continue.');
      return;
    }

    setAuthEmail(trimmedEmail);
    const result = await signIn();
    if (result.success) {
      const display = result.user?.name ?? 'Friend';
      Alert.alert(
        'Signed in',
        display ? `Welcome, ${display}!` : 'You are signed in.',
      );
    }
  };

  const handleRegister = async () => {
    const result = await register();
    if (result.success) {
      Alert.alert(
        'Verification sent',
        result.payload?.message ??
          'Check your email for the verification code, then complete account verification.',
      );
      navigateToScreen('verify');
    }
  };

  const handleVerifyRegistration = async () => {
    const result = await verifyRegistration();
    if (result.success) {
      const display = result.user?.name ?? 'Friend';
      Alert.alert(
        'Account verified',
        display ? `Welcome, ${display}!` : 'Your account is verified.',
      );
    }
  };

  const handleRequestPasswordReset = async () => {
    const result = await requestPasswordReset();
    if (result.success) {
      Alert.alert(
        'Reset email sent',
        result.payload?.message ?? 'Check your email for the reset link.',
      );
      navigateToScreen('resetPassword');
    }
  };

  const handleValidateResetToken = async () => {
    const result = await validateResetToken();
    if (result.success) {
      Alert.alert(
        'Token valid',
        result.payload?.message ?? 'Your reset token is valid.',
      );
    }
  };

  const handleResetPassword = async () => {
    const result = await resetPassword();
    if (result.success) {
      Alert.alert(
        'Password reset',
        result.payload?.message ?? 'Your password has been reset.',
      );
      navigateToScreen('signin');
    }
  };

  const handleCloseShare = () => {
    const nextScreen = shareSession?.returnScreen ?? 'home';
    setSelectedSentenceIndexes([]);
    setShareSession(null);
    navigateToScreen(nextScreen);
  };

  const handleShareNow = async payload => {
    if (!shareSession) {
      return;
    }

    const {
      destination = 'system',
      composedImageUri,
      media,
      text: editorShareText,
    } = payload ?? {};

    const {
      block,
      writingTitle,
      sectionTitle,
      passageText,
      sentences: cachedSentences,
    } = shareSession;
    const sectionLine = sectionTitle ? `, ${sectionTitle}` : '';
    const baseText =
      typeof passageText === 'string' ? passageText : getShareableBlockText(block);
    const parsedSentences = Array.isArray(cachedSentences)
      ? cachedSentences
      : extractPassageSentences(baseText);
    const sentenceTexts = parsedSentences.map(sentence =>
      typeof sentence === 'string' ? sentence : sentence?.text ?? '',
    );

    const selectedBodyFromState = selectedSentenceIndexes.length > 0
      ? [...selectedSentenceIndexes]
          .filter(
            index =>
              typeof index === 'number' &&
              index >= 0 &&
              index < sentenceTexts.length,
          )
          .sort((a, b) => a - b)
          .slice(0, SHARE_SELECTION_LIMIT)
          .map(index => sentenceTexts[index])
          .filter(Boolean)
          .join('\n\n')
      : '';
    const fallbackShareText =
      cleanBlockText(block?.shareText ?? baseText) || baseText || '';
    const shareBody = (editorShareText && editorShareText.trim())
      || selectedBodyFromState
      || fallbackShareText;
    const message = `"${shareBody}"\n\n— ${writingTitle}${sectionLine}`;

    const shareUrls = [];

    if (composedImageUri) {
      shareUrls.push(composedImageUri);
    } else if (media?.uri) {
      shareUrls.push(media.uri);
    }

    const baseOptions = {
      message,
    };

    if (shareUrls.length > 0) {
      baseOptions.url = shareUrls[0];
    }

    try {
      switch (destination) {
        case 'liquidSpirit': {
          const encodedMessage = encodeURIComponent(message);
          const url = `liquidspirit://share?text=${encodedMessage}`;
          const supported = await Linking.canOpenURL(url);
          if (!supported) {
            Alert.alert(
              'Liquid Spirit not installed',
              'Install the Liquid Spirit app to share directly, or choose another share option.',
            );
            return;
          }
          await Linking.openURL(url);
          break;
        }
        default:
          await NativeShare.share(baseOptions);
          break;
      }
    } catch (error) {
      console.warn('Unable to share passage', error);
      Alert.alert(
        'Unable to share',
        error?.message ?? 'We were unable to share this passage. Please try again later.',
      );
    }
  };

  const handleToggleShareSentence = rawIndex => {
    console.log('[Share] handleToggleShareSentence: toggle requested', {
      rawIndex,
    });
    const index = Number(rawIndex);
    if (!Number.isFinite(index) || index < 0) {
      console.log('[Share] handleToggleShareSentence: ignoring invalid index', {
        rawIndex,
        parsedIndex: index,
      });
      return;
    }
    setSelectedSentenceIndexes(previous => {
      const normalized = [];
      previous.forEach(item => {
        const parsed = Number(item);
        if (Number.isFinite(parsed) && parsed >= 0 && !normalized.includes(parsed)) {
          normalized.push(parsed);
        }
      });

      let nextSelection;

      if (normalized.includes(index)) {
        nextSelection = normalized.filter(item => item !== index);
      } else if (normalized.length >= SHARE_SELECTION_LIMIT) {
        const trimmed =
          SHARE_SELECTION_LIMIT > 1
            ? normalized.slice(-(SHARE_SELECTION_LIMIT - 1))
            : [];
        nextSelection = [...trimmed, index];
      } else {
        nextSelection = [...normalized, index];
      }

      console.log('[Share] handleToggleShareSentence: selection updated', {
        previous,
        normalized,
        index,
        nextSelection,
        shareSelectionLimit: SHARE_SELECTION_LIMIT,
      });

      return nextSelection;
    });
  };

  const handleProceedToShareEdit = () => {
    console.log('[Share] handleProceedToShareEdit: attempting to proceed', {
      currentSelection: selectedSentenceIndexes,
    });
    if (selectedSentenceIndexes.length === 0) {
      console.log('[Share] handleProceedToShareEdit: blocked, empty selection');
      return;
    }
    console.log('[Share] handleProceedToShareEdit: navigating to shareEdit screen');
    navigateToScreen('shareEdit');
  };

  const handleAddToProgram = ({
    block,
    writingId,
    writingTitle,
    sectionId,
    sectionTitle,
  }) => {
    const blockId = block?.id;
    if (!blockId) {
      return;
    }

    const existingItem = programPassages.find(
      item =>
        item?.block?.id === blockId &&
        (item.writingId ?? '') === (writingId ?? '') &&
        (item.sectionId ?? '') === (sectionId ?? ''),
    );

    if (existingItem) {
      removeProgramItem(existingItem.id);
      showToast('Removed from Devotional Program');
      return;
    }

    const programItem = createProgramItemFromBlock({
      block,
      writingId,
      writingTitle,
      sectionId,
      sectionTitle,
    });

    if (!programItem) {
      return;
    }

    const additions = addProgramItems([programItem]);
    if (additions > 0) {
      showToast('Added to Devotional Program');
    } else {
      showToast('Already in Devotional Program');
    }
  };

  const handleAddToMyVerses = payload => {
    const blockId = payload?.block?.id;
    if (!blockId) {
      return;
    }

    const writingId = payload?.writingId ?? '';
    const sectionId = payload?.sectionId ?? '';
    const existingVerse = (Array.isArray(myVerses) ? myVerses : []).find(
      item =>
        item?.block?.id === blockId &&
        (item.writingId ?? '') === writingId &&
        (item.sectionId ?? '') === sectionId,
    );

    if (existingVerse) {
      removeVerse(existingVerse.id);
      showToast('Removed from My Verses');
      return;
    }

    const additions = addVerseFromBlock(payload);
    if (additions > 0) {
      showToast('Added to My Verses');
    } else {
      showToast('Already in My Verses');
    }
  };

  const handleAddProgramSections = useCallback(
    sections => addProgramSections(sections),
    [addProgramSections],
  );

  // Works-backed mode: theme search is not wired yet (requires remote index/search endpoint).
  const searchSectionsByTheme = useCallback(() => [], []);

  const handleOpenProgram = () => {
    if (currentScreen === 'program') {
      return;
    }
    setProgramReturnScreen(currentScreen);
    navigateToScreen('program');
  };

  const handleCloseProgram = () => {
    setProgramReturnScreen(null);
    goBack();
  };

  const handleRemoveFromProgram = itemId => {
    removeProgramItem(itemId);
  };
  const handleRemoveCurrentUserFacilitator = useCallback(() => {
    setIncludeCurrentUserAsFacilitator(false);
  }, [setIncludeCurrentUserAsFacilitator]);

  const handleRestoreCurrentUserFacilitator = useCallback(() => {
    setIncludeCurrentUserAsFacilitator(true);
  }, [setIncludeCurrentUserAsFacilitator]);

  const handleRemoveFromMyVerses = verseId => {
    removeVerse(verseId);
  };

  const handleClearProgram = () => {
    clearProgram();
    setProgramSubmissionError(null);
    setProgramSubmissionSuccess(null);
  };

  const handleShareProgram = () => {
    if (programPassages.length === 0) {
      return;
    }
    shareProgram();
  };

  const handleSubmitProgram = async () => {
    const result = await submitProgram();
    if (result?.success) {
      Alert.alert(
        'Devotional submitted',
        'Your devotional program has been sent to Liquid Spirit for review.',
      );
    }
  };

  const handleProgramTitleChange = text => {
    setProgramTitle(text);
    clearProgramFieldError('title');
    if (text.trim().length > 0) {
      setProgramSubmissionError(null);
      setProgramSubmissionSuccess(null);
    }
  };

  const handleProgramNotesChange = text => {
    setProgramNotes(text);
    setProgramSubmissionSuccess(null);
  };

  const handleProgramSessionDateChange = value => {
    setProgramSessionDate(value);
    clearProgramFieldError('sessionDate');
  };

  const handleProgramSessionTimeChange = value => {
    setProgramSessionTime(value);
    clearProgramFieldError('sessionTime');
  };

  const handleProgramTimeZoneChange = value => {
    setProgramTimeZone(value);
    clearProgramFieldError('timeZone');
  };

  const handleSelectShareTheme = themeId => {
    setShareThemeId(themeId);
  };

  const handleOpenSettings = () => {
    navigateToScreen('settings');
  };

  const handleLogout = useCallback(async () => {
    await logout();
    setActiveCollectionKey(null);
    setSelectedWritingId(null);
    setSelectedSectionId(null);
    setRandomPassage(null);
  }, [logout]);

  const handleBackToHome = () => {
    goBack();
    setSelectedWritingId(null);
    setSelectedSectionId(null);
    setRandomPassage(null);
    setProgramReturnScreen(null);
  };

  const handleBackToSections = () => {
    goBack();
  };

  const handleSelectFontScale = value => {
    setFontScale(value);
  };

  const selectedSection = useMemo(
    () =>
      writingSections.find(section => section.id === selectedSectionId) ?? null,
    [selectedSectionId, writingSections],
  );

  const programBadgeLabel = programCount > 9 ? '9+' : `${programCount}`;
  const isReflectionModalVisible = Boolean(reflectionModalContext);
  const renderBlockContent = useBlockRenderer({
    styles,
    scaledTypography,
    activeSearchHighlight,
    selectedSectionId,
    selectedWritingId,
    onShowReflection: handleShowReflectionModal,
  });

  const displayName = authenticatedUser?.name ?? 'Kali';
  const toastBottomOffset =
    (safeAreaInsets.bottom ?? 0) + (isInAppFlow ? 72 : 16);

  if (!hasHydratedAuth) {
    return (
      <BaseScreen
        styles={styles}
        variant="plain"
        includeBottomInset
        style={styles.centerContent}
      >
        <ActivityIndicator color="#8c6239" />
      </BaseScreen>
    );
  }

  const renderScreenSurface = child => (
    <View style={styles.container}>
      <View style={styles.screenContentWrapper}>{child}</View>
      <ToastNotification
        styles={styles}
        message={toastMessage}
        visible={toastVisible}
        bottomOffset={toastBottomOffset}
      />
      <ReflectionModal
        visible={isReflectionModalVisible}
        styles={styles}
        context={reflectionModalContext}
        inputValue={reflectionInput}
        onChangeInput={setReflectionInput}
        onCancel={handleCloseReflectionModal}
        onSubmit={handleSubmitReflection}
      />
    </View>
  );

  const screenState = {
    styles,
    scaledTypography,
    displayName,
    authenticatedUser,
    auth: {
      email: authEmail,
      bahaiId: authBahaiId,
      password: authPassword,
      verificationCode: authVerificationCode,
      resetToken: authResetToken,
      error: authError,
      isAuthenticating,
    },
    content: {
      collectionOptions,
      activeCollection,
      scopedWritings,
      selectedWriting,
      writingSections,
      selectedSection,
      randomPassage,
      searchableSections,
      activeSearchHighlight,
      sectionPagerRef,
      sectionPageWidth,
      sectionViewabilityConfig,
      sectionViewableItemsChanged,
      renderBlockContent,
      recentComments,
      recentCommentsLoading,
      recentCommentsError,
    },
    program: {
      passages: programPassages,
      backButtonLabel: programBackButtonLabel,
      hasPassages: hasProgramPassages,
      badgeLabel: programBadgeLabel,
      title: programTitle,
      notes: programNotes,
      sessionDate: programSessionDate,
      sessionTime: programSessionTime,
      timeZone: programTimeZone,
      defaultTimeZone: defaultProgramTimeZone,
      frequencyOptions: PROGRAM_FREQUENCY_OPTIONS,
      frequency: programFrequency,
      participants: programParticipants,
      facilitators: programFacilitators,
      includeCurrentUserFacilitator: includeCurrentUserAsFacilitator,
      fieldErrors: programFieldErrors,
      submissionError: programSubmissionError,
      submissionSuccess: programSubmissionSuccess,
      isSubmitting: isSubmittingProgram,
    },
    share: {
      session: shareSession,
      backButtonLabel: shareBackButtonLabel,
      selectedSentenceIndexes,
      activeTheme: activeShareTheme,
      themes: shareThemes,
      themeId: shareThemeId,
      selectionLimit: SHARE_SELECTION_LIMIT,
    },
    settings: {
      fontOptions,
      fontScale,
    },
    profile: {
      email: authenticatedUser?.email ?? authEmail ?? '',
      memberRef:
        typeof authenticatedUser?.memberRef === 'string'
          ? authenticatedUser.memberRef
          : typeof authenticatedUser?.userId === 'string'
            ? authenticatedUser.userId
            : '',
      isAuthenticated: Boolean(authenticatedUser),
    },
    verses: {
      items: myVerses,
    },
    handlers: {
      startSignIn: handleStartSignIn,
      startRegister: handleStartRegister,
      openVerifyRegistration: handleOpenVerifyRegistration,
      openForgotPassword: handleOpenForgotPassword,
      openResetPassword: handleOpenResetPassword,
      continueAsGuest: handleContinueAsGuest,
      changeBahaiId: setAuthBahaiId,
      changeEmail: setAuthEmail,
      changePassword: setAuthPassword,
      changeVerificationCode: setAuthVerificationCode,
      changeResetToken: setAuthResetToken,
      signIn: handleSignIn,
      register: handleRegister,
      verifyRegistration: handleVerifyRegistration,
      requestPasswordReset: handleRequestPasswordReset,
      validateResetToken: handleValidateResetToken,
      resetPassword: handleResetPassword,
      cancelSignIn: handleCancelSignIn,
      readWritings: handleOpenCollections,
      openPrayers: handleOpenPrayers,
      chooseRandom: handleShowRandomPassage,
      createDevotional: handleOpenProgram,
      selectCollection: handleSelectCollection,
      openCollections: handleOpenCollections,
      selectWriting: handleSelectWriting,
      openSettings: handleOpenSettings,
      openProgram: handleOpenProgram,
      selectFontScale: handleSelectFontScale,
      logout: handleLogout,
      toggleShareSentence: handleToggleShareSentence,
      closeShare: handleCloseShare,
      proceedToShareEdit: handleProceedToShareEdit,
      selectShareTheme: handleSelectShareTheme,
      shareNow: handleShareNow,
      closeProgram: handleCloseProgram,
      clearProgram: handleClearProgram,
      submitProgram: handleSubmitProgram,
      shareProgram: handleShareProgram,
      removeFromProgram: handleRemoveFromProgram,
      searchProgramTheme: searchSectionsByTheme,
      addProgramSections: handleAddProgramSections,
      changeProgramTitle: handleProgramTitleChange,
      changeProgramNotes: handleProgramNotesChange,
      changeProgramSessionDate: handleProgramSessionDateChange,
      changeProgramSessionTime: handleProgramSessionTimeChange,
      changeProgramTimeZone: handleProgramTimeZoneChange,
      selectProgramFrequency: setProgramFrequency,
      changeProgramParticipants: setProgramParticipants,
      changeProgramFacilitators: setProgramFacilitators,
      removeCurrentUserFacilitator: handleRemoveCurrentUserFacilitator,
      restoreCurrentUserFacilitator: handleRestoreCurrentUserFacilitator,
      backToHome: handleBackToHome,
      backToSections: handleBackToSections,
      selectSection: handleSelectSection,
      addToProgram: handleAddToProgram,
      addToMyVerses: handleAddToMyVerses,
      sharePassage: handleOpenShare,
      showAnotherPassage: handleShowRandomPassage,
      continueSection: handleContinueRandomPassage,
      openSearchResult: handleOpenSearchResult,
      removeVerse: handleRemoveFromMyVerses,
      openVerse: handleOpenVerse,
      openRecentComment: comment => {
        // MVP: just open the work (writing) view. (Deep-linking into section + opening modal can come next.)
        const workId = comment?.workId;
        if (workId) {
          handleSelectWriting(workId);
        }
      },
    },
  };

  return (
    <AppNavigationContainer
      navigationRef={navigationRef}
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
    >
      {isInAppFlow ? (
        <AppNavigator
          key="app"
          renderScreenSurface={renderScreenSurface}
          screenState={screenState}
        />
      ) : (
        <AuthNavigator
          key="auth"
          renderScreenSurface={renderScreenSurface}
          screenState={screenState}
        />
      )}
    </AppNavigationContainer>
  );
}

export default AppContent;
