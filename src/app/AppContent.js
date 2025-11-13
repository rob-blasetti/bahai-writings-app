import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Share as NativeShare,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigationContainerRef } from '@react-navigation/native';
import writingsManifest from '../../assets/generated/writings.json';
import StartScreen from '../screens/StartScreen';
import SignInScreen from '../screens/SignInScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ShareSelectionScreen from '../screens/ShareSelectionScreen';
import ShareEditorScreen from '../screens/ShareEditorScreen';
import ProgramScreen from '../screens/ProgramScreen';
import WritingScreen from '../screens/WritingScreen';
import SectionScreen from '../screens/SectionScreen';
import PassageScreen from '../screens/PassageScreen';
import UnavailableScreen from '../screens/UnavailableScreen';
import SearchScreen from '../screens/SearchScreen';
import ProfileScreen from '../screens/ProfileScreen';
import MyVersesScreen from '../screens/MyVersesScreen';
import { BottomNavigationBar } from '../components/BottomNavigationBar';
import ReflectionModal from '../components/ReflectionModal';
import {
  AppNavigationContainer,
  BOTTOM_TAB_SET,
  Stack,
} from '../navigation';
import { useAuth } from '../auth/authContext';
import { useProgram } from '../programs/programContext';
import { PROGRAM_FREQUENCY_OPTIONS } from '../programs/programUtils';
import { useShare } from '../sharing/shareContext';
import { useReflection } from '../reflection/reflectionContext';
import { useVerses } from '../myVerses/versesContext';
import {
  buildSearchableSections,
  searchSectionsByTheme as findSectionsByTheme,
} from '../writings/searchEngine';
import { cleanBlockText, extractPassageSentences } from '../writings/passageUtils';
import { getSectionsForWriting } from '../writings/writingParser';
import { getShareableBlockText } from '../sharing/shareUtils';
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
  const enrichedWritings = useMemo(
    () =>
      writings.map(writing => ({
        ...writing,
        sectionsData: getSectionsForWriting(writing),
      })),
    [writings],
  );
  const searchableSections = useMemo(
    () => buildSearchableSections(enrichedWritings),
    [enrichedWritings],
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
  } = useProgram();
  const {
    shareThemes,
    shareThemeId,
    setShareThemeId,
    shareSession,
    setShareSession,
    selectedSentenceIndexes,
    setSelectedSentenceIndexes,
  } = useShare();
  const {
    reflectionModalContext,
    reflectionInput,
    setReflectionInput,
    showReflection,
    closeReflection,
    submitReflection,
  } = useReflection();
  const { verses: myVerses, addVerseFromBlock, removeVerse } = useVerses();
  const navigationRef = useNavigationContainerRef();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const pendingNavigationRef = useRef(null);
  const [currentScreen, setCurrentScreen] = useState('start');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [selectedWritingId, setSelectedWritingId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [randomPassage, setRandomPassage] = useState(null);
  const [activeSearchHighlight, setActiveSearchHighlight] = useState(null);
  const [sectionBlockIndex, setSectionBlockIndex] = useState(0);
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
  const windowWidth = Dimensions.get('window').width;
  const horizontalInsets =
    (safeAreaInsets.left ?? 0) + (safeAreaInsets.right ?? 0);
  const sectionPageWidth = Math.max(windowWidth - horizontalInsets, 320);
  const sectionViewableItemsChanged = ({ viewableItems }) => {
    if (!Array.isArray(viewableItems) || viewableItems.length === 0) {
      return;
    }
    const nextIndex = viewableItems[0].index ?? 0;
    setSectionBlockIndex(nextIndex);
  };
  const navigationReady = isNavigationReady && navigationRef.isReady();
  const flushPendingNavigation = useCallback(() => {
    if (!navigationReady || !pendingNavigationRef.current) {
      return;
    }
    const { screenName, params } = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    if (params) {
      navigationRef.navigate(screenName, params);
    } else {
      navigationRef.navigate(screenName);
    }
  }, [navigationReady, navigationRef]);
  useEffect(() => {
    flushPendingNavigation();
  }, [flushPendingNavigation]);
  const navigateToScreen = useCallback(
    (screenName, params) => {
      if (navigationReady) {
        if (params) {
          navigationRef.navigate(screenName, params);
        } else {
          navigationRef.navigate(screenName);
        }
        return;
      }
      pendingNavigationRef.current = { screenName, params };
    },
    [navigationReady, navigationRef],
  );
  const handleNavigationReady = useCallback(() => {
    setIsNavigationReady(true);
    const initialRoute = navigationRef.getCurrentRoute();
    if (initialRoute?.name) {
      setCurrentScreen(initialRoute.name);
    }
  }, [navigationRef]);
  const handleNavigationStateChange = useCallback(() => {
    const nextRouteName = navigationRef.getCurrentRoute()?.name;
    if (nextRouteName) {
      setCurrentScreen(previous => (previous === nextRouteName ? previous : nextRouteName));
    }
  }, [navigationRef]);
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
  const selectedWriting = useMemo(
    () =>
      enrichedWritings.find(item => item.id === selectedWritingId) ?? null,
    [selectedWritingId, enrichedWritings],
  );
  const writingSections = selectedWriting?.sectionsData ?? [];
  const availablePassages = useMemo(
    () =>
      enrichedWritings.flatMap(writing =>
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
    [enrichedWritings],
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
      setSectionBlockIndex(nextIndex);
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
        setSectionBlockIndex(normalizedBlockIndex);
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

  const handleShowRandomPassage = () => {
    if (availablePassages.length === 0) {
      setRandomPassage(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePassages.length);
    setRandomPassage(availablePassages[randomIndex]);
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

  const handleBottomTabPress = useCallback(
    tabKey => {
      if (!BOTTOM_TAB_SET.has(tabKey)) {
        return;
      }
      navigateToScreen(tabKey);
    },
    [navigateToScreen],
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
    navigateToScreen('home');
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
      navigateToScreen('home');
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
    const nextScreen = programReturnScreen ?? 'home';
    setProgramReturnScreen(null);
    navigateToScreen(nextScreen);
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

  const handleCloseSettings = () => {
    navigateToScreen('home');
  };

  const handleLogout = useCallback(async () => {
    await logout();
    navigateToScreen('start');
  }, [logout, navigateToScreen]);

  const handleBackToHome = () => {
    navigateToScreen('home');
    setSelectedWritingId(null);
    setSelectedSectionId(null);
    setRandomPassage(null);
    setProgramReturnScreen(null);
  };

  const handleBackToSections = () => {
    navigateToScreen('writing');
  };

  const handleSelectFontScale = value => {
    setFontScale(value);
  };

  const selectedSection = useMemo(
    () =>
      writingSections.find(section => section.id === selectedSectionId) ?? null,
    [selectedSectionId, writingSections],
  );

  const hasPassages = availablePassages.length > 0;
  const programBadgeLabel = programCount > 9 ? '9+' : `${programCount}`;
  const isReflectionModalVisible = Boolean(reflectionModalContext);
  useEffect(() => {
    if (BOTTOM_TAB_SET.has(currentScreen)) {
      setActiveBottomTab(currentScreen);
    }
  }, [currentScreen]);
  const showBottomNav = currentScreen !== 'start';
  const containerBottomPadding = showBottomNav
    ? 0
    : safeAreaInsets.bottom;

  const renderBlockContent = (block, index, options = {}) => {
    if (!block) {
      return null;
    }
    const { writingTitle = null, sectionTitle = null } = options;
    const normalizedBlockText =
      typeof block.text === 'string' ? block.text.trim() : '';
    const canOpenReflection = normalizedBlockText.length > 0;
    const isHighlightedBlock =
      activeSearchHighlight &&
      activeSearchHighlight.blockId === block.id &&
      activeSearchHighlight.sectionId === selectedSectionId &&
      activeSearchHighlight.writingId === selectedWritingId;
    const highlightTerm =
      isHighlightedBlock && activeSearchHighlight.normalizedTerm
        ? activeSearchHighlight.normalizedTerm
        : null;

    const renderHighlightedContent = text => {
      if (
        !highlightTerm ||
        typeof text !== 'string' ||
        text.length === 0
      ) {
        return text;
      }
      try {
        const regex = new RegExp(`(${escapeRegExp(highlightTerm)})`, 'ig');
        return text.split(regex).map((part, idx) => {
          if (part.length === 0) {
            return null;
          }
          if (part.toLowerCase() === highlightTerm) {
            return (
              <Text
                key={`${block.id}-highlight-${idx}`}
                style={styles.searchHighlightText}
              >
                {part}
              </Text>
            );
          }
          return part;
        });
      } catch (error) {
        return text;
      }
    };

    const wrapBlock = (
      children,
      wrapperStyle = [styles.blockContainer, index === 0 && styles.firstBlock],
    ) => {
      const baseStyles = Array.isArray(wrapperStyle)
        ? wrapperStyle
        : [wrapperStyle];
      const styleArray = baseStyles.filter(Boolean);
      if (canOpenReflection) {
        return (
          <TouchableOpacity
            style={styleArray}
            activeOpacity={0.85}
            onPress={() =>
              handleShowReflectionModal({
                block,
                writingTitle,
                sectionTitle,
              })
            }
          >
            {children}
          </TouchableOpacity>
        );
      }
      return <View style={styleArray}>{children}</View>;
    };

    const renderTextWithNumber = ({
      text,
      style,
      key,
      numberStyle,
    }) => {
      if (typeof text !== 'string' || text.length === 0) {
        return null;
      }

      const numberMatch =
        text.match(/^(\d{1,3})([.)]\s+)([\s\S]+)$/) ||
        text.match(/^(\d{1,3})(\s{2,})([\s\S]+)$/);

      if (!numberMatch) {
        return (
          <Text key={key} style={style}>
            {renderHighlightedContent(text)}
          </Text>
        );
      }

      const number = numberMatch[1];
      const delimiter = numberMatch[2];
      const remainder = numberMatch[3] ?? '';
      const normalizedDelimiter = /\s{2,}/.test(delimiter)
        ? ' '
        : delimiter;
      const numberStyleArray = Array.isArray(numberStyle)
        ? numberStyle
        : numberStyle
        ? [numberStyle]
        : [];

      return (
        <Text key={key} style={style}>
          <Text
            style={[
              styles.passageNumber,
              scaledTypography.passageNumber,
              ...numberStyleArray,
            ]}
          >
            {number}
          </Text>
          {normalizedDelimiter}
          {renderHighlightedContent(remainder)}
        </Text>
      );
    };

    const hasFootnotes = Array.isArray(block.footnotes) && block.footnotes.length > 0;
    const hasAttribution =
      typeof block.attribution === 'string' && block.attribution.length > 0;
    const renderMeta = () => {
      if (!hasFootnotes && !hasAttribution) {
        return null;
      }
      return (
        <>
          {hasAttribution ? (
            <Text
              style={[
                styles.attributionText,
                scaledTypography.attributionText,
              ]}
            >
              {block.attribution}
            </Text>
          ) : null}
          {hasFootnotes ? (
            <View style={styles.footnoteContainer}>
              {block.footnotes.map((footnote, footnoteIndex) => (
                renderTextWithNumber({
                  key: `${block.id}-footnote-${footnoteIndex}`,
                  text: footnote,
                  style: [
                    styles.footnoteText,
                    scaledTypography.footnoteText,
                  ],
                })
              ))}
            </View>
          ) : null}
        </>
      );
    };

    if (block.type === 'heading') {
      return (
        <Text
          style={[
            styles.contentHeading,
            index === 0 && styles.contentHeadingFirst,
            scaledTypography.contentHeading,
          ]}
        >
          {renderHighlightedContent(block.text)}
        </Text>
      );
    }

    if (block.type === 'quote') {
      const meta = renderMeta();
      return wrapBlock(
        <>
          <View style={[styles.quoteBlock, index === 0 && styles.firstBlock]}>
            <Text style={[styles.quoteText, scaledTypography.quoteText]}>
              {renderHighlightedContent(block.text)}
            </Text>
          </View>
          {meta}
        </>,
        [styles.blockContainer],
      );
    }

    if (block.type === 'poetry') {
      const meta = renderMeta();
      return wrapBlock(
        <>
          <View style={[styles.poetryBlock, index === 0 && styles.firstBlock]}>
            {block.text.split('\n').map((line, lineIndex) =>
              renderTextWithNumber({
                key: `${block.id}-line-${lineIndex}`,
                text: line,
                style: [styles.poetryLine, scaledTypography.poetryLine],
              }),
            )}
          </View>
          {meta}
        </>,
      );
    }

    if (block.type === 'list') {
      const meta = renderMeta();
      return wrapBlock(
        <>
          <View style={[styles.listBlock, index === 0 && styles.firstBlock]}>
            {block.text.split('\n').map((line, lineIndex) =>
              renderTextWithNumber({
                key: `${block.id}-item-${lineIndex}`,
                text: line,
                style: [styles.listItemText, scaledTypography.listItemText],
              }),
            )}
          </View>
          {meta}
        </>,
      );
    }

    const meta = renderMeta();
    return wrapBlock(
      <>
        {block.text
          ? renderTextWithNumber({
              text: block.text,
              style: [
                styles.contentParagraph,
                index === 0 && styles.contentParagraphFirst,
                scaledTypography.contentParagraph,
              ],
            })
          : null}
        {meta}
      </>,
    );
  };

  const displayName = authenticatedUser?.name ?? 'Kali';

  const stackScreenOptions = useMemo(
    () => ({
      headerShown: false,
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
      gestureDirection: 'horizontal',
      animation: 'slide_from_right',
    }),
    [],
  );

  if (!hasHydratedAuth) {
    return (
      <View
        style={[
          styles.container,
          {
            paddingTop: safeAreaInsets.top,
            paddingBottom: safeAreaInsets.bottom,
            paddingLeft: safeAreaInsets.left,
            paddingRight: safeAreaInsets.right,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <ActivityIndicator color="#8c6239" />
      </View>
    );
  }

  const renderScreenSurface = child => (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: containerBottomPadding,
          paddingLeft: safeAreaInsets.left,
          paddingRight: safeAreaInsets.right,
        },
      ]}
    >
      <View style={styles.screenContentWrapper}>{child}</View>
      {showBottomNav ? (
        <BottomNavigationBar
          activeTab={activeBottomTab}
          onTabPress={handleBottomTabPress}
          safeAreaInsets={safeAreaInsets}
        />
      ) : null}
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

  return (
    <AppNavigationContainer
      navigationRef={navigationRef}
      onReady={handleNavigationReady}
      onStateChange={handleNavigationStateChange}
    >
      <Stack.Navigator
        initialRouteName="start"
        screenOptions={stackScreenOptions}
      >
        <Stack.Screen name="start">
          {() =>
            renderScreenSurface(
              <StartScreen
                styles={styles}
                displayName={displayName}
                onStartSignIn={handleStartSignIn}
                onContinueAsGuest={handleContinueAsGuest}
              />,
            )
          }
        </Stack.Screen>
        <Stack.Screen name="signin">
          {() =>
            renderScreenSurface(
              <SignInScreen
                styles={styles}
                authEmail={authEmail}
                authPassword={authPassword}
                authError={authError}
                isAuthenticating={isAuthenticating}
                onChangeEmail={setAuthEmail}
                onChangePassword={setAuthPassword}
                onSignIn={handleSignIn}
                onCancel={handleCancelSignIn}
              />,
            )
          }
        </Stack.Screen>
        <Stack.Screen name="home">
          {() =>
            renderScreenSurface(
              <LibraryScreen
                styles={styles}
                writings={enrichedWritings}
                onSelectWriting={handleSelectWriting}
                onOpenSettings={handleOpenSettings}
                onOpenProgram={handleOpenProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
                hasPassages={hasPassages}
                onShowRandomPassage={handleShowRandomPassage}
              />,
            )
          }
        </Stack.Screen>
        <Stack.Screen name="settings">
          {() =>
            renderScreenSurface(
              <SettingsScreen
                styles={styles}
                scaledTypography={scaledTypography}
                onClose={handleCloseSettings}
                onOpenProgram={handleOpenProgram}
                hasProgramPassages={hasProgramPassages}
                programBadgeLabel={programBadgeLabel}
                fontOptions={fontOptions}
                fontScale={fontScale}
                onSelectFontScale={handleSelectFontScale}
                onLogout={handleLogout}
              />,
            )
          }
        </Stack.Screen>
        <Stack.Screen name="shareSelect">
          {() =>
            renderScreenSurface(
              shareSession ? (
                <ShareSelectionScreen
                  styles={styles}
                  scaledTypography={scaledTypography}
                  shareSession={shareSession}
                  shareBackButtonLabel={shareBackButtonLabel}
                  selectedSentenceIndexes={selectedSentenceIndexes}
                  onToggleSentence={handleToggleShareSentence}
                  onClose={handleCloseShare}
                  onOpenProgram={handleOpenProgram}
                  onNext={handleProceedToShareEdit}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                  maxSelections={SHARE_SELECTION_LIMIT}
                />
              ) : (
                <UnavailableScreen
                  styles={styles}
                  onBack={handleBackToHome}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                />
              ),
            )
          }
        </Stack.Screen>
        <Stack.Screen name="shareEdit">
          {() =>
            renderScreenSurface(
              shareSession ? (
                <ShareEditorScreen
                  styles={styles}
                  scaledTypography={scaledTypography}
                  shareSession={shareSession}
                  shareBackButtonLabel={shareBackButtonLabel}
                  selectedSentenceIndexes={selectedSentenceIndexes}
                  onClose={handleCloseShare}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                  activeShareTheme={activeShareTheme}
                  shareThemes={shareThemes}
                  shareThemeId={shareThemeId}
                  onSelectShareTheme={handleSelectShareTheme}
                  onShareNow={handleShareNow}
                />
              ) : (
                <UnavailableScreen
                  styles={styles}
                  onBack={handleBackToHome}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                />
              ),
            )
          }
        </Stack.Screen>
        <Stack.Screen name="program">
          {() =>
            renderScreenSurface(
              <ProgramScreen
                styles={styles}
                scaledTypography={scaledTypography}
                authenticatedUser={authenticatedUser}
                programPassages={programPassages}
                programBackButtonLabel={programBackButtonLabel}
                hasProgramPassages={hasProgramPassages}
                onClose={handleCloseProgram}
                onClearProgram={handleClearProgram}
                renderBlockContent={renderBlockContent}
                programTitle={programTitle}
                onChangeProgramTitle={handleProgramTitleChange}
                programNotes={programNotes}
                onChangeProgramNotes={handleProgramNotesChange}
                programSessionDate={programSessionDate}
                onChangeProgramSessionDate={handleProgramSessionDateChange}
                programSessionTime={programSessionTime}
                onChangeProgramSessionTime={handleProgramSessionTimeChange}
                programTimeZone={programTimeZone}
                onChangeProgramTimeZone={handleProgramTimeZoneChange}
                defaultProgramTimeZone={defaultProgramTimeZone}
                programFrequencyOptions={PROGRAM_FREQUENCY_OPTIONS}
                programFrequency={programFrequency}
                onSelectProgramFrequency={setProgramFrequency}
                programParticipants={programParticipants}
                onChangeProgramParticipants={setProgramParticipants}
                programFacilitators={programFacilitators}
                onChangeProgramFacilitators={setProgramFacilitators}
                includeCurrentUserFacilitator={includeCurrentUserAsFacilitator}
                onRemoveCurrentUserFacilitator={handleRemoveCurrentUserFacilitator}
                onRestoreCurrentUserFacilitator={handleRestoreCurrentUserFacilitator}
                programFieldErrors={programFieldErrors}
                onShareProgram={handleShareProgram}
                onSubmitProgram={handleSubmitProgram}
                programSubmissionError={programSubmissionError}
                programSubmissionSuccess={programSubmissionSuccess}
                isSubmittingProgram={isSubmittingProgram}
                onRemoveFromProgram={handleRemoveFromProgram}
                onSearchProgramTheme={searchSectionsByTheme}
                onAddProgramSections={handleAddProgramSections}
              />,
            )
          }
        </Stack.Screen>
        <Stack.Screen name="writing">
          {() =>
            renderScreenSurface(
              selectedWriting ? (
                <WritingScreen
                  styles={styles}
                  scaledTypography={scaledTypography}
                  selectedWriting={selectedWriting}
                  writingSections={writingSections}
                  onBack={handleBackToHome}
                  onSelectSection={handleSelectSection}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                />
              ) : (
                <UnavailableScreen
                  styles={styles}
                  onBack={handleBackToHome}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                />
              ),
            )
          }
        </Stack.Screen>
        <Stack.Screen name="section">
          {() =>
            renderScreenSurface(
              selectedWriting && selectedSection ? (
                <SectionScreen
                  styles={styles}
                  scaledTypography={scaledTypography}
                  selectedWriting={selectedWriting}
                  selectedSection={selectedSection}
                  activeSearchHighlight={activeSearchHighlight}
                  sectionBlockIndex={sectionBlockIndex}
                  onBack={handleBackToSections}
                  sectionPagerRef={sectionPagerRef}
                  sectionPageWidth={sectionPageWidth}
                  sectionViewabilityConfig={sectionViewabilityConfig}
                  sectionViewableItemsChanged={sectionViewableItemsChanged}
                  renderBlockContent={renderBlockContent}
                  onAddToProgram={handleAddToProgram}
                  onAddToMyVerses={handleAddToMyVerses}
                  onShare={handleOpenShare}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                />
              ) : (
                <UnavailableScreen
                  styles={styles}
                  onBack={handleBackToHome}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                />
              ),
            )
          }
        </Stack.Screen>
        <Stack.Screen name="passage">
          {() =>
            renderScreenSurface(
              randomPassage ? (
                <PassageScreen
                  styles={styles}
                  scaledTypography={scaledTypography}
                  randomPassage={randomPassage}
                  onBack={handleBackToHome}
                  renderBlockContent={renderBlockContent}
                  onAddToProgram={handleAddToProgram}
                  onAddToMyVerses={handleAddToMyVerses}
                  onShare={handleOpenShare}
                  onShowAnother={handleShowRandomPassage}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                  onContinueSection={handleContinueRandomPassage}
                />
              ) : (
                <UnavailableScreen
                  styles={styles}
                  onBack={handleBackToHome}
                  onOpenProgram={handleOpenProgram}
                  hasProgramPassages={hasProgramPassages}
                  programBadgeLabel={programBadgeLabel}
                />
              ),
            )
          }
        </Stack.Screen>
        <Stack.Screen name="search">
          {() =>
            renderScreenSurface(
              <SearchScreen
                styles={styles}
                scaledTypography={scaledTypography}
                searchableSections={searchableSections}
                onSelectSection={handleOpenSearchResult}
              />,
            )
          }
        </Stack.Screen>
        <Stack.Screen name="profile">
          {() =>
            renderScreenSurface(
              <ProfileScreen
                styles={styles}
                displayName={displayName}
                email={authenticatedUser?.email ?? authEmail ?? ''}
                memberRef={
                  typeof authenticatedUser?.memberRef === 'string'
                    ? authenticatedUser.memberRef
                    : typeof authenticatedUser?.userId === 'string'
                      ? authenticatedUser.userId
                      : ''
                }
                isAuthenticated={Boolean(authenticatedUser)}
              />,
            )
          }
        </Stack.Screen>
        <Stack.Screen name="myVerses">
          {() =>
            renderScreenSurface(
              <MyVersesScreen
                styles={styles}
                scaledTypography={scaledTypography}
                verses={myVerses}
                renderBlockContent={renderBlockContent}
                onRemoveVerse={handleRemoveFromMyVerses}
              />,
            )
          }
        </Stack.Screen>
      </Stack.Navigator>
    </AppNavigationContainer>
  );
}

export default AppContent;
