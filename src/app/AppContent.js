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
import writingsManifest from '../../assets/generated/writings.json';
import ReflectionModal from '../components/ReflectionModal';
import BaseScreen from '../components/BaseScreen';
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
  buildSearchableSections,
  searchSectionsByTheme as findSectionsByTheme,
} from '../writings/searchEngine';
import {
  cleanBlockText,
  extractPassageSentences,
  selectRandomPassage,
} from '../writings/passageUtils';
import { getSectionsForWriting } from '../writings/writingParser';
import {
  WRITING_COLLECTIONS,
  inferCollectionKey,
} from '../writings/collectionUtils';
import { getShareableBlockText } from '../sharing/shareUtils';
import { useBlockRenderer } from '../writings/useBlockRenderer';
import { appStyles } from '../styles/components';

const styles = appStyles;
const SHARE_SELECTION_LIMIT = 2;
const SEARCH_HIGHLIGHT_DURATION_MS = 2500;
const sectionPagerRef = { current: null };
const pendingSectionBlockIndexRef = { current: null };
const searchHighlightTimeoutRef = { current: null };
const sectionViewabilityConfig = {
  viewAreaCoveragePercentThreshold: 60,
};

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const writings = useMemo(
    () => (writingsManifest?.items ?? []).filter(item => item.text?.length),
    [],
  );
  const writingsWithCollections = useMemo(
    () =>
      writings.map(writing => ({
        ...writing,
        collectionKey: inferCollectionKey(writing),
      })),
    [writings],
  );
  const enrichedWritings = useMemo(
    () =>
      writingsWithCollections.map(writing => ({
        ...writing,
        sectionsData: getSectionsForWriting(writing),
      })),
    [writingsWithCollections],
  );

  const {
    user: authenticatedUser,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authError,
    setAuthError,
    isAuthenticating,
    hasHydratedAuth,
    authMode,
    signIn,
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
  const collectionCounts = useMemo(() => {
    const counts = WRITING_COLLECTIONS.reduce((acc, collection) => {
      acc[collection.key] = 0;
      return acc;
    }, {});
    enrichedWritings.forEach(writing => {
      const key = writing.collectionKey;
      if (key && Object.prototype.hasOwnProperty.call(counts, key)) {
        counts[key] += 1;
      }
    });
    return counts;
  }, [enrichedWritings]);
  const collectionOptions = useMemo(
    () =>
      WRITING_COLLECTIONS.map(collection => ({
        ...collection,
        count: collectionCounts[collection.key] ?? 0,
      })),
    [collectionCounts],
  );
  const activeCollection = useMemo(
    () =>
      WRITING_COLLECTIONS.find(
        collection => collection.key === activeCollectionKey,
      ) ?? null,
    [activeCollectionKey],
  );
  const scopedWritings = useMemo(() => {
    if (!activeCollectionKey) {
      return enrichedWritings;
    }
    return enrichedWritings.filter(
      writing => writing.collectionKey === activeCollectionKey,
    );
  }, [activeCollectionKey, enrichedWritings]);
  const searchableSections = useMemo(
    () => buildSearchableSections(scopedWritings),
    [scopedWritings],
  );
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
  useEffect(() => {
    return () => {
      if (searchHighlightTimeoutRef.current) {
        clearTimeout(searchHighlightTimeoutRef.current);
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
  const selectedWriting = useMemo(
    () =>
      scopedWritings.find(item => item.id === selectedWritingId) ?? null,
    [selectedWritingId, scopedWritings],
  );
  const writingSections = selectedWriting?.sectionsData ?? [];
  const availablePassages = useMemo(
    () =>
      scopedWritings.flatMap(writing =>
        writing.sectionsData.flatMap(section =>
          section.blocks.map((block, blockIndex) => ({
            writingId: writing.id,
            writingTitle: writing.title,
            sectionId: section.id,
            sectionTitle: section.title,
            block,
            blockIndex,
          })),
        ),
      ),
    [scopedWritings],
  );
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

  const handleSelectWriting = writingId => {
    setSelectedWritingId(writingId);
    navigateToScreen('writing');
  };

  const handleSelectSection = sectionId => {
    setSelectedSectionId(sectionId);
    navigateToScreen('section');
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
    navigateToScreen('collections');
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

    addProgramItems([programItem]);
  };

  const handleAddToMyVerses = payload => {
    addVerseFromBlock(payload);
  };

  const handleAddProgramSections = useCallback(
    sections => addProgramSections(sections),
    [addProgramSections],
  );

  const searchSectionsByTheme = useCallback(
    (theme, options) => findSectionsByTheme(searchableSections, theme, options),
    [searchableSections],
  );

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
  }, []);

  const handleRestoreCurrentUserFacilitator = useCallback(() => {
    setIncludeCurrentUserAsFacilitator(true);
  }, []);
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

  if (!hasHydratedAuth) {
    return (
      <BaseScreen
        styles={styles}
        variant="plain"
        includeBottomInset
        style={{ alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator color="#8c6239" />
      </BaseScreen>
    );
  }

  const renderScreenSurface = child => (
    <View style={styles.container}>
      <View style={styles.screenContentWrapper}>{child}</View>
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
      password: authPassword,
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
      continueAsGuest: handleContinueAsGuest,
      changeEmail: setAuthEmail,
      changePassword: setAuthPassword,
      signIn: handleSignIn,
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
