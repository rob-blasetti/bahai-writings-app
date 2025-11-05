import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import writingsManifest from './assets/generated/writings.json';
import { authenticateLiquidSpirit } from './services/liquidSpiritAuth';
import HomeScreen from './screens/HomeScreen';
import SignInScreen from './screens/SignInScreen';
import LibraryScreen from './screens/LibraryScreen';
import SettingsScreen from './screens/SettingsScreen';
import ShareSelectionScreen from './screens/ShareSelectionScreen';
import ShareEditorScreen from './screens/ShareEditorScreen';
import ProgramScreen from './screens/ProgramScreen';
import WritingScreen from './screens/WritingScreen';
import SectionScreen from './screens/SectionScreen';
import PassageScreen from './screens/PassageScreen';
import UnavailableScreen from './screens/UnavailableScreen';
import { extractPassageSentences } from './screens/shareUtils';

const LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT =
  global?.LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT ??
  'https://liquidspirit.example.com/api/devotionals';
const SHARE_SELECTION_LIMIT = 2;

function cleanBlockText(block) {
  const normalized = block
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();

  if (/^\d+\.\s*$/.test(normalized)) {
    return '';
  }

  return normalized;
}

function normalizeSectionBlocks(section, fallbackSectionId, fallbackText = '') {
  const ensureId = (value, index) =>
    value ?? `${fallbackSectionId}-block-${index + 1}`;

  if (Array.isArray(section?.blocks) && section.blocks.length > 0) {
    return section.blocks
      .map((block, index) => {
        const rawText = typeof block?.text === 'string' ? block.text : '';
        const text = cleanBlockText(rawText);
        const rawAttribution =
          typeof block?.attribution === 'string' ? block.attribution : '';
        const attribution = cleanBlockText(rawAttribution);
        const rawFootnotes = Array.isArray(block?.footnotes)
          ? block.footnotes
          : [];
        const footnotes = rawFootnotes
          .map(note => cleanBlockText(note))
          .filter(Boolean);
        const rawShareText =
          typeof block?.shareText === 'string' ? block.shareText : '';
        const shareText = cleanBlockText(rawShareText);

        const hasContent =
          text.length > 0 ||
          attribution.length > 0 ||
          footnotes.length > 0 ||
          shareText.length > 0;

        if (!hasContent) {
          return null;
        }
        return {
          id: ensureId(block?.id, index),
          type: block?.type ?? 'paragraph',
          text,
          sourceId: block?.sourceId ?? null,
          attribution: attribution.length > 0 ? attribution : null,
          footnotes,
          shareText:
            shareText.length > 0
              ? shareText
              : [text, attribution, ...footnotes]
                  .filter(Boolean)
                  .join('\n\n'),
        };
      })
      .filter(Boolean);
  }

  if (Array.isArray(section?.paragraphs) && section.paragraphs.length > 0) {
    return section.paragraphs
      .map((paragraph, index) => {
        const text = cleanBlockText(paragraph);
        if (!text) {
          return null;
        }
        return {
          id: `${fallbackSectionId}-paragraph-${index + 1}`,
          type: 'paragraph',
          text,
          sourceId: null,
        };
      })
      .filter(Boolean);
  }

  if (typeof fallbackText === 'string' && fallbackText.trim().length > 0) {
    const text = cleanBlockText(fallbackText);
    if (text.length === 0) {
      return [];
    }
    return [
      {
        id: `${fallbackSectionId}-full`,
        type: 'paragraph',
        text,
        sourceId: null,
      },
    ];
  }

  return [];
}

function getSectionsForWriting(writing) {
  if (!writing) {
    return [];
  }

  if (Array.isArray(writing.sections) && writing.sections.length > 0) {
    return writing.sections
      .map((section, index) => {
        const sectionId = section.id ?? `${writing.id}-section-${index + 1}`;
        const blocks = normalizeSectionBlocks(
          section,
          sectionId,
          writing.text ?? '',
        );
        return {
          id: sectionId,
          title: section.title ?? `Section ${index + 1}`,
          blocks,
        };
      })
      .filter(section => section.blocks.length > 0);
  }

  const fallbackId = `${writing.id}-full`;
  return [
    {
      id: fallbackId,
      title: 'Full Text',
      blocks: normalizeSectionBlocks(
        { blocks: [], paragraphs: [] },
        fallbackId,
        writing.text ?? '',
      ),
    },
  ].filter(section => section.blocks.length > 0);
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const writings = useMemo(
    () => (writingsManifest?.items ?? []).filter(item => item.text?.length),
    [],
  );
  const [currentScreen, setCurrentScreen] = useState('home');
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [selectedWritingId, setSelectedWritingId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [randomPassage, setRandomPassage] = useState(null);
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
  const shareThemes = useMemo(
    () => [
      {
        id: 'warmGlow',
        name: 'Warm glow',
        backgroundColor: '#f9f1e7',
        accentColor: '#d3b08a',
        textColor: '#3b2a15',
        tagColor: '#a67c52',
      },
      {
        id: 'dawnMist',
        name: 'Dawn mist',
        backgroundColor: '#eef4f8',
        accentColor: '#9bbad3',
        textColor: '#2a3c4f',
        tagColor: '#516a82',
      },
      {
        id: 'eveningRose',
        name: 'Evening rose',
        backgroundColor: '#f5e9ef',
        accentColor: '#ca9db9',
        textColor: '#412033',
        tagColor: '#8a4f6d',
      },
    ],
    [],
  );
  const [shareThemeId, setShareThemeId] = useState('warmGlow');
  const activeShareTheme = useMemo(
    () =>
      shareThemes.find(theme => theme.id === shareThemeId) ?? shareThemes[0],
    [shareThemeId, shareThemes],
  );
  const [shareContext, setShareContext] = useState(null);
  const [shareSelectedSentenceIndexes, setShareSelectedSentenceIndexes] = useState([]);
  const [programPassages, setProgramPassages] = useState([]);
  const [programReturnScreen, setProgramReturnScreen] = useState(null);
  const [programTitle, setProgramTitle] = useState('');
  const [programNotes, setProgramNotes] = useState('');
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false);
  const [programSubmissionError, setProgramSubmissionError] = useState(null);
  const [programSubmissionSuccess, setProgramSubmissionSuccess] = useState(null);
  const [sectionBlockIndex, setSectionBlockIndex] = useState(0);
  const sectionPagerRef = useRef(null);
  const sectionViewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 60,
  });
  const windowWidth = Dimensions.get('window').width;
  const sectionPageWidth = useMemo(() => {
    const horizontalInsets =
      (safeAreaInsets.left ?? 0) + (safeAreaInsets.right ?? 0);
    return Math.max(windowWidth - horizontalInsets, 320);
  }, [safeAreaInsets.left, safeAreaInsets.right, windowWidth]);
  const sectionViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!Array.isArray(viewableItems) || viewableItems.length === 0) {
      return;
    }
    const nextIndex = viewableItems[0].index ?? 0;
    setSectionBlockIndex(nextIndex);
  });
  const shareBackButtonLabel = useMemo(() => {
    if (!shareContext) {
      return 'Back';
    }
    if (shareContext.returnScreen === 'passage') {
      return 'Back to passage';
    }
    if (shareContext.returnScreen === 'section') {
      return 'Back to reading';
    }
    if (shareContext.returnScreen === 'library') {
      return 'Back to library';
    }
    return 'Back';
  }, [shareContext]);
  const selectedWriting = useMemo(
    () => writings.find(item => item.id === selectedWritingId) ?? null,
    [selectedWritingId, writings],
  );
  const writingSections = useMemo(
    () => getSectionsForWriting(selectedWriting),
    [selectedWriting],
  );
  const availablePassages = useMemo(
    () =>
      writings.flatMap(writing => {
        const sections = getSectionsForWriting(writing);
        return sections.flatMap(section =>
          section.blocks.map(block => ({
            writingId: writing.id,
            writingTitle: writing.title,
            sectionId: section.id,
            sectionTitle: section.title,
            block,
          })),
        );
      }),
    [writings],
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
    if (programReturnScreen === 'library') {
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
    setSectionBlockIndex(0);
    if (sectionPagerRef.current) {
      sectionPagerRef.current.scrollToOffset({
        offset: 0,
        animated: false,
      });
    }
  }, [selectedSectionId]);

  const handleSelectWriting = writingId => {
    setSelectedWritingId(writingId);
    setCurrentScreen('writing');
  };

  const handleSelectSection = sectionId => {
    setSelectedSectionId(sectionId);
    setCurrentScreen('section');
  };

  const handleShowRandomPassage = () => {
    if (availablePassages.length === 0) {
      setRandomPassage(null);
      return;
    }

    const randomIndex = Math.floor(Math.random() * availablePassages.length);
    setRandomPassage(availablePassages[randomIndex]);
    setCurrentScreen('passage');
  };

  const handleOpenShare = ({
    block,
    writingTitle,
    sectionTitle,
    returnScreen,
  }) => {
    if (!block) {
      return;
    }
    const baseText =
      typeof block?.text === 'string' && block.text.trim().length > 0
        ? block.text
        : block?.shareText ?? '';
    const sentences = extractPassageSentences(baseText);
    const defaultSelection = sentences.length === 0
      ? []
      : sentences.length === 1
      ? [0]
      : [0, 1].filter(index => index < sentences.length);

    setShareContext({
      block,
      writingTitle,
      sectionTitle,
      returnScreen,
    });
    setShareSelectedSentenceIndexes(defaultSelection);
    setCurrentScreen('shareSelect');
  };

  const handleContinueAsGuest = () => {
    setAuthenticatedUser(null);
    setAuthError(null);
    setAuthPassword('');
    setCurrentScreen('library');
  };

  const handleStartSignIn = () => {
    setAuthError(null);
    setCurrentScreen('signin');
  };

  const handleCancelSignIn = () => {
    setIsAuthenticating(false);
    setAuthError(null);
    setCurrentScreen('home');
  };

  const handleSignIn = async () => {
    const trimmedEmail = authEmail.trim();
    const hasPassword = authPassword.length > 0;

    if (!trimmedEmail || !hasPassword) {
      setAuthError('Enter both email and password to continue.');
      return;
    }

    setAuthEmail(trimmedEmail);
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await authenticateLiquidSpirit({
        email: trimmedEmail,
        password: authPassword,
      });
      const inferredName =
        result?.user?.name ??
        result?.profile?.name ??
        result?.name ??
        authenticatedUser?.name ??
        'Kali';

      setAuthenticatedUser({
        name: inferredName,
        email: trimmedEmail,
        token: result?.token ?? result?.accessToken ?? null,
      });
      setAuthPassword('');
      setCurrentScreen('library');
      Alert.alert(
        'Signed in',
        inferredName ? `Welcome, ${inferredName}!` : 'You are signed in.',
      );
    } catch (error) {
      setAuthError(error?.message ?? 'Unable to sign in. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCloseShare = () => {
    const nextScreen = shareContext?.returnScreen ?? 'library';
    setShareSelectedSentenceIndexes([]);
    setShareContext(null);
    setCurrentScreen(nextScreen);
  };

  const handleShareNow = async () => {
    if (!shareContext) {
      return;
    }

    const { block, writingTitle, sectionTitle } = shareContext;
    const sectionLine = sectionTitle ? `, ${sectionTitle}` : '';
    const baseText =
      typeof block?.text === 'string' && block.text.trim().length > 0
        ? block.text
        : block?.shareText ?? '';
    const sentences = extractPassageSentences(baseText);
    const selectedBody = shareSelectedSentenceIndexes.length > 0
      ? [...shareSelectedSentenceIndexes]
          .filter(
            index =>
              typeof index === 'number' &&
              index >= 0 &&
              index < sentences.length,
          )
          .sort((a, b) => a - b)
          .slice(0, SHARE_SELECTION_LIMIT)
          .map(index => sentences[index]?.text)
          .filter(Boolean)
          .join('\n\n')
      : '';
    const fallbackShareText = cleanBlockText(block?.shareText ?? baseText) || baseText || '';
    const shareBody = selectedBody || fallbackShareText;
    const message = `"${shareBody}"\n\n— ${writingTitle}${sectionLine}`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.warn('Unable to share passage', error);
    }
  };

  const handleToggleShareSentence = index => {
    setShareSelectedSentenceIndexes(previous => {
      if (previous.includes(index)) {
        return previous.filter(item => item !== index);
      }
      if (previous.length >= SHARE_SELECTION_LIMIT) {
        const trimmed =
          SHARE_SELECTION_LIMIT > 1
            ? previous.slice(-(SHARE_SELECTION_LIMIT - 1))
            : [];
        return [...trimmed, index];
      }
      return [...previous, index];
    });
  };

  const handleProceedToShareEdit = () => {
    if (shareSelectedSentenceIndexes.length === 0) {
      return;
    }
    setCurrentScreen('shareEdit');
  };

  const handleBackToShareSelection = () => {
    setCurrentScreen('shareSelect');
  };

  const handleAddToProgram = ({
    block,
    writingId,
    writingTitle,
    sectionId,
    sectionTitle,
  }) => {
    if (!block?.text) {
      return;
    }
    const timestamp = Date.now();
    const normalizedWritingId = writingId ?? null;
    const normalizedSectionId = sectionId ?? null;
    const blockId = block.id ?? `block-${timestamp}`;
    const safeBlock = {
      id: blockId,
      text: block.text,
      shareText: block.shareText ?? block.text,
      type: block.type ?? 'paragraph',
      sourceId: block.sourceId ?? null,
      attribution: block.attribution ?? null,
      footnotes: Array.isArray(block.footnotes) ? [...block.footnotes] : [],
    };
    const programItem = {
      id: `program-${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
      block: safeBlock,
      writingId: normalizedWritingId,
      writingTitle: writingTitle ?? 'Unknown writing',
      sectionId: normalizedSectionId,
      sectionTitle: sectionTitle ?? null,
    };

    setProgramPassages(previous => {
      if (
        previous.some(
          item =>
            item.block.id === blockId &&
            item.writingId === normalizedWritingId &&
            item.sectionId === normalizedSectionId,
        )
      ) {
        return previous;
      }
      return [...previous, programItem];
    });
    setProgramSubmissionError(null);
    setProgramSubmissionSuccess(null);
  };

  const handleOpenProgram = () => {
    if (currentScreen === 'program') {
      return;
    }
    setProgramReturnScreen(currentScreen);
    setCurrentScreen('program');
  };

  const handleCloseProgram = () => {
    const nextScreen = programReturnScreen ?? 'library';
    setProgramReturnScreen(null);
    setCurrentScreen(nextScreen);
  };

  const handleRemoveFromProgram = itemId => {
    setProgramPassages(previous =>
      previous.filter(item => item.id !== itemId),
    );
  };

  const handleClearProgram = () => {
    setProgramPassages([]);
    setProgramSubmissionError(null);
    setProgramSubmissionSuccess(null);
  };

  const handleShareProgram = async () => {
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

    try {
      await Share.share({ message });
    } catch (error) {
      console.warn('Unable to share devotional program', error);
    }
  };

  const handleSubmitProgram = async () => {
    if (programPassages.length === 0) {
      return;
    }

    const trimmedTitle = programTitle.trim();
    if (trimmedTitle.length === 0) {
      setProgramSubmissionError('Please add a devotional title before submitting.');
      setProgramSubmissionSuccess(null);
      return;
    }

    if (!LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT) {
      setProgramSubmissionError(
        'Liquid Spirit endpoint is not configured. Update LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT.',
      );
      setProgramSubmissionSuccess(null);
      return;
    }

    setIsSubmittingProgram(true);
    setProgramSubmissionError(null);
    setProgramSubmissionSuccess(null);

    const payload = {
      title: trimmedTitle,
      notes: programNotes.trim(),
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
    };

    try {
      const response = await fetch(LIQUID_SPIRIT_DEVOTIONAL_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || `Request failed with status ${response.status}`,
        );
      }

      let responseBody = null;
      try {
        responseBody = await response.json();
      } catch (parseError) {
        responseBody = null;
      }

      setProgramSubmissionSuccess(
        responseBody?.message ??
          'Devotional submitted to Liquid Spirit. Look for it on the activities dashboard.',
      );
      setProgramTitle('');
      setProgramNotes('');
      setProgramPassages([]);
      Alert.alert(
        'Devotional submitted',
        'Your devotional program has been sent to Liquid Spirit for review.',
      );
    } catch (error) {
      console.warn('Unable to submit devotional program', error);
      setProgramSubmissionError(
        error?.message ??
          'Unable to submit devotional program. Please try again in a moment.',
      );
    } finally {
      setIsSubmittingProgram(false);
    }
  };

  const handleProgramTitleChange = text => {
    setProgramTitle(text);
    if (text.trim().length > 0) {
      setProgramSubmissionError(null);
      setProgramSubmissionSuccess(null);
    }
  };

  const handleProgramNotesChange = text => {
    setProgramNotes(text);
    setProgramSubmissionSuccess(null);
  };

  const handleSelectShareTheme = themeId => {
    setShareThemeId(themeId);
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleCloseSettings = () => {
    setCurrentScreen('library');
  };

  const handleBackToHome = () => {
    setCurrentScreen('library');
    setSelectedWritingId(null);
    setSelectedSectionId(null);
    setRandomPassage(null);
    setProgramReturnScreen(null);
  };

  const handleBackToSections = () => {
    setCurrentScreen('writing');
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

  const renderBlockContent = (block, index) => {
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
            {text}
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
          {remainder}
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
          {block.text}
        </Text>
      );
    }

    if (block.type === 'quote') {
      const meta = renderMeta();
      return (
        <View style={styles.blockContainer}>
          <View
            style={[styles.quoteBlock, index === 0 && styles.firstBlock]}
          >
            <Text
              style={[styles.quoteText, scaledTypography.quoteText]}
            >
              {block.text}
            </Text>
          </View>
          {meta}
        </View>
      );
    }

    if (block.type === 'poetry') {
      const meta = renderMeta();
      return (
        <View style={styles.blockContainer}>
          <View
            style={[styles.poetryBlock, index === 0 && styles.firstBlock]}
          >
            {block.text.split('\n').map((line, lineIndex) => (
              renderTextWithNumber({
                key: `${block.id}-line-${lineIndex}`,
                text: line,
                style: [
                  styles.poetryLine,
                  scaledTypography.poetryLine,
                ],
              })
            ))}
          </View>
          {meta}
        </View>
      );
    }

    if (block.type === 'list') {
      const meta = renderMeta();
      return (
        <View style={styles.blockContainer}>
          <View
            style={[styles.listBlock, index === 0 && styles.firstBlock]}
          >
            {block.text.split('\n').map((line, lineIndex) => (
              renderTextWithNumber({
                key: `${block.id}-item-${lineIndex}`,
                text: line,
                style: [
                  styles.listItemText,
                  scaledTypography.listItemText,
                ],
              })
            ))}
          </View>
          {meta}
        </View>
      );
    }

    const meta = renderMeta();
    return (
      <View style={[styles.blockContainer, index === 0 && styles.firstBlock]}>
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
      </View>
    );
  };

  const displayName = authenticatedUser?.name ?? 'Kali';

  let screenContent = null;

  switch (currentScreen) {
    case 'home':
      screenContent = (
        <HomeScreen
          styles={styles}
          displayName={displayName}
          onStartSignIn={handleStartSignIn}
          onContinueAsGuest={handleContinueAsGuest}
        />
      );
      break;
    case 'signin':
      screenContent = (
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
        />
      );
      break;
    case 'library':
      screenContent = (
        <LibraryScreen
          styles={styles}
          writings={writings}
          onSelectWriting={handleSelectWriting}
          onOpenSettings={handleOpenSettings}
          onOpenProgram={handleOpenProgram}
          hasProgramPassages={hasProgramPassages}
          programBadgeLabel={programBadgeLabel}
          hasPassages={hasPassages}
          onShowRandomPassage={handleShowRandomPassage}
        />
      );
      break;
    case 'settings':
      screenContent = (
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
        />
      );
      break;
    case 'shareSelect':
      if (shareContext) {
        screenContent = (
          <ShareSelectionScreen
            styles={styles}
            scaledTypography={scaledTypography}
            shareContext={shareContext}
            shareBackButtonLabel={shareBackButtonLabel}
            selectedSentenceIndexes={shareSelectedSentenceIndexes}
            onToggleSentence={handleToggleShareSentence}
            onClose={handleCloseShare}
            onOpenProgram={handleOpenProgram}
            onNext={handleProceedToShareEdit}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
            maxSelections={SHARE_SELECTION_LIMIT}
          />
        );
      } else {
        screenContent = (
          <UnavailableScreen
            styles={styles}
            onBack={handleBackToHome}
            onOpenProgram={handleOpenProgram}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
          />
        );
      }
      break;
    case 'shareEdit':
      if (shareContext) {
        screenContent = (
          <ShareEditorScreen
            styles={styles}
            scaledTypography={scaledTypography}
            shareContext={shareContext}
            shareBackButtonLabel={shareBackButtonLabel}
            selectedSentenceIndexes={shareSelectedSentenceIndexes}
            onClose={handleCloseShare}
            onOpenProgram={handleOpenProgram}
            onChangeSelection={handleBackToShareSelection}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
            activeShareTheme={activeShareTheme}
            shareThemes={shareThemes}
            shareThemeId={shareThemeId}
            onSelectShareTheme={handleSelectShareTheme}
            onShareNow={handleShareNow}
          />
        );
      } else {
        screenContent = (
          <UnavailableScreen
            styles={styles}
            onBack={handleBackToHome}
            onOpenProgram={handleOpenProgram}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
          />
        );
      }
      break;
    case 'program':
      screenContent = (
        <ProgramScreen
          styles={styles}
          scaledTypography={scaledTypography}
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
          onShareProgram={handleShareProgram}
          onSubmitProgram={handleSubmitProgram}
          programSubmissionError={programSubmissionError}
          programSubmissionSuccess={programSubmissionSuccess}
          isSubmittingProgram={isSubmittingProgram}
          onRemoveFromProgram={handleRemoveFromProgram}
        />
      );
      break;
    case 'writing':
      if (selectedWriting) {
        screenContent = (
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
        );
      } else {
        screenContent = (
          <UnavailableScreen
            styles={styles}
            onBack={handleBackToHome}
            onOpenProgram={handleOpenProgram}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
          />
        );
      }
      break;
    case 'section':
      if (selectedWriting && selectedSection) {
        screenContent = (
          <SectionScreen
            styles={styles}
            scaledTypography={scaledTypography}
            selectedWriting={selectedWriting}
            selectedSection={selectedSection}
            sectionBlockIndex={sectionBlockIndex}
            onBack={handleBackToSections}
            sectionPagerRef={sectionPagerRef}
            sectionPageWidth={sectionPageWidth}
            sectionViewabilityConfig={sectionViewabilityConfig}
            sectionViewableItemsChanged={sectionViewableItemsChanged}
            renderBlockContent={renderBlockContent}
            onAddToProgram={handleAddToProgram}
            onShare={handleOpenShare}
            onOpenProgram={handleOpenProgram}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
          />
        );
      } else {
        screenContent = (
          <UnavailableScreen
            styles={styles}
            onBack={handleBackToHome}
            onOpenProgram={handleOpenProgram}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
          />
        );
      }
      break;
    case 'passage':
      if (randomPassage) {
        screenContent = (
          <PassageScreen
            styles={styles}
            scaledTypography={scaledTypography}
            randomPassage={randomPassage}
            onBack={handleBackToHome}
            renderBlockContent={renderBlockContent}
            onAddToProgram={handleAddToProgram}
            onShare={handleOpenShare}
            onShowAnother={handleShowRandomPassage}
            onOpenProgram={handleOpenProgram}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
          />
        );
      } else {
        screenContent = (
          <UnavailableScreen
            styles={styles}
            onBack={handleBackToHome}
            onOpenProgram={handleOpenProgram}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
          />
        );
      }
      break;
    default:
      screenContent = (
        <UnavailableScreen
          styles={styles}
          onBack={handleBackToHome}
          onOpenProgram={handleOpenProgram}
          hasProgramPassages={hasProgramPassages}
          programBadgeLabel={programBadgeLabel}
        />
      );
      break;
  }
  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
          paddingLeft: safeAreaInsets.left,
          paddingRight: safeAreaInsets.right,
        },
      ]}
    >
      {screenContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ef',
  },
  authContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    justifyContent: 'center',
  },
  authIntro: {
    marginBottom: 36,
  },
  authGreeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6f5a35',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  authName: {
    fontSize: 42,
    fontWeight: '700',
    color: '#2c1f0c',
    marginTop: 8,
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6f5a35',
    lineHeight: 24,
    marginTop: 12,
  },
  authActions: {
    flexDirection: 'column',
    marginTop: 12,
  },
  authPrimaryButton: {
    borderRadius: 18,
    backgroundColor: '#3b2a15',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  authPrimaryButtonDisabled: {
    opacity: 0.7,
  },
  authPrimaryButtonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  authSecondaryButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f7f0e3',
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authSecondaryButtonLabel: {
    color: '#3b2a15',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  authFormContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  authFormTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c1f0c',
    marginBottom: 8,
  },
  authFormSubtitle: {
    fontSize: 14,
    color: '#6f5a35',
    lineHeight: 20,
    marginBottom: 20,
  },
  authErrorText: {
    fontSize: 14,
    color: '#9b2c2c',
    marginBottom: 12,
  },
  authInput: {
    borderWidth: 1,
    borderColor: '#d7c5a8',
    borderRadius: 14,
    backgroundColor: '#fffdf8',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2c1f0c',
    marginBottom: 12,
  },
  homeContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  homeHeader: {
    marginBottom: 20,
  },
  homeHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  homeHeaderActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  iconButtonContainer: {
    marginLeft: 12,
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f7f0e3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeActionButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f7f0e3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 12,
  },
  homeActionButtonSpacing: {
    marginRight: 12,
  },
  homeActionLabel: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: '#3b2a15',
    textAlign: 'center',
    lineHeight: 18,
  },
  iconBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 9,
    backgroundColor: '#c86148',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeLabel: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 0,
    color: '#2c1f0c',
  },
  homeList: {
    flex: 1,
    marginTop: 20,
  },
  homeListContent: {
    paddingBottom: 20,
  },
  homeListEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeCard: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d7c5a8',
    marginBottom: 12,
  },
  homeCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c1f0c',
  },
  homeCardSubtitle: {
    fontSize: 14,
    color: '#6f5a35',
    marginTop: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  screenSurface: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  sectionScreenSurface: {
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 0,
    borderRadius: 0,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f0e4d2',
  },
  backButtonLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#3b2a15',
  },
  detailSubtitle: {
    fontSize: 16,
    color: '#6f5a35',
    marginTop: -4,
    marginBottom: 20,
  },
  sectionList: {
    flex: 1,
  },
  sectionListContent: {
    paddingBottom: 16,
  },
  sectionRow: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f7f0e3',
    marginBottom: 12,
  },
  sectionRowTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3b2a15',
  },
  sectionRowDescription: {
    fontSize: 14,
    color: '#6f5a35',
    marginTop: 4,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  sectionHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  passageMeta: {
    marginBottom: 16,
  },
  passageMetaLabel: {
    fontSize: 14,
    color: '#6f5a35',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  passageMetaWriting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#3b2a15',
    marginTop: 4,
  },
  passageMetaSection: {
    fontSize: 16,
    color: '#6f5a35',
    marginTop: 2,
  },
  passageCard: {
    borderRadius: 18,
    backgroundColor: '#f7f0e3',
    borderWidth: 1,
    borderColor: '#d7c5a8',
    padding: 20,
    marginBottom: 24,
  },
  programList: {
    flex: 1,
    marginTop: 16,
  },
  programListContent: {
    paddingBottom: 32,
  },
  programForm: {
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  programFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c1f0c',
    marginBottom: 8,
  },
  programFormHint: {
    fontSize: 14,
    color: '#6f5a35',
    marginBottom: 16,
  },
  programInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b2a15',
    marginBottom: 6,
  },
  programTextInput: {
    borderWidth: 1,
    borderColor: '#d7c5a8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fffaf3',
    fontSize: 16,
    color: '#3b2a15',
    marginBottom: 16,
  },
  programTextArea: {
    minHeight: 96,
  },
  programCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  programCardMeta: {
    flex: 1,
    paddingRight: 12,
  },
  programCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c1f0c',
  },
  programCardSubtitle: {
    fontSize: 14,
    color: '#6f5a35',
    marginTop: 4,
  },
  programRemoveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f0e4d2',
  },
  programRemoveLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b2a15',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  programClearButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f7f0e3',
  },
  programClearLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b2a15',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  programActions: {
    paddingVertical: 24,
    alignItems: 'stretch',
  },
  programActionButton: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  submitButton: {
    alignSelf: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 18,
    backgroundColor: '#6d9c7c',
    borderWidth: 1,
    borderColor: '#598467',
    alignItems: 'center',
  },
  submitButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  programStatusError: {
    fontSize: 14,
    color: '#b04b3c',
    textAlign: 'center',
    marginTop: 4,
  },
  programStatusSuccess: {
    fontSize: 14,
    color: '#3a7a5a',
    textAlign: 'center',
    marginTop: 4,
  },
  secondaryButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#c6a87d',
    backgroundColor: '#f0e4d2',
    marginTop: 8,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b2a15',
  },
  blockWrapper: {
    marginBottom: 18,
  },
  shareActionChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f0e4d2',
    marginTop: 12,
  },
  shareActionChipLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b2a15',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  actionChipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chipInRow: {
    alignSelf: 'auto',
  },
  chipSpacing: {
    marginLeft: 12,
  },
  sectionPagerIndicator: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0e4d2',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  sectionPagerIndicatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b2a15',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  sectionPagerList: {
    flexGrow: 1,
    flex: 1,
  },
  sectionPagerContent: {
    paddingHorizontal: 0,
  },
  sectionPagerWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  sectionPagerItem: {
    flex: 1,
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'space-between',
  },
  sectionPagerScrollView: {
    flex: 1,
  },
  sectionPagerScroll: {
    paddingBottom: 16,
  },
  sectionPagerBlock: {
    paddingBottom: 12,
  },
  sectionPagerFooter: {
    paddingTop: 8,
  },
  sectionEmptyText: {
    paddingHorizontal: 20,
  },
  settingsGroup: {
    marginTop: 16,
  },
  settingsGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6f5a35',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  settingsOption: {
    borderWidth: 1,
    borderColor: '#d7c5a8',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#f7f0e3',
    marginBottom: 12,
  },
  settingsOptionSelected: {
    borderColor: '#c6a87d',
    backgroundColor: '#f0e4d2',
  },
  settingsOptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingsOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c1f0c',
  },
  settingsOptionBadge: {
    borderRadius: 10,
    backgroundColor: '#e6d2b5',
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  settingsOptionBadgeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3b2a15',
  },
  settingsOptionDescription: {
    fontSize: 14,
    color: '#6f5a35',
    marginTop: 6,
  },
  sharePreviewCard: {
    borderRadius: 22,
    borderWidth: 2,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sharePreviewContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharePreviewQuote: {
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '500',
  },
  sharePreviewMeta: {
    marginTop: 20,
  },
  sharePreviewMetaLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sharePreviewTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  sharePreviewSection: {
    fontSize: 14,
    marginTop: 4,
  },
  sharePreviewAuthor: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  shareSelectStage: {
    flex: 1,
  },
  shareSelectHelper: {
    color: '#6f5a35',
    marginBottom: 16,
  },
  shareSelectionInfoRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  shareSelectionSourceLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b2a15',
  },
  shareSelectionSection: {
    fontSize: 14,
    color: '#6f5a35',
    marginLeft: 12,
    marginTop: 4,
  },
  shareSelectList: {
    flex: 1,
    marginBottom: 12,
  },
  shareSelectListContent: {
    paddingBottom: 16,
  },
  shareSelectionPassage: {
    lineHeight: 28,
  },
  shareSentenceText: {
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: 6,
  },
  shareSentenceTextSelected: {
    backgroundColor: '#f2e6d4',
  },
  shareSelectionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  shareSelectionCount: {
    fontSize: 13,
    color: '#6f5a35',
  },
  shareNextButton: {
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: '#c6a87d',
    borderWidth: 1,
    borderColor: '#b18d5c',
    alignItems: 'center',
  },
  shareNextButtonDisabled: {
    backgroundColor: '#e5d6be',
    borderColor: '#d5c3a5',
  },
  shareNextButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  shareEditorContainer: {
    flex: 1,
  },
  shareEditorHeader: {
    marginBottom: 12,
  },
  shareEditorBody: {
    flex: 1,
  },
  sharePreviewWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  shareChangeSelectionButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f8f2e7',
    marginBottom: 12,
  },
  shareChangeSelectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6f5a35',
  },
  sharePalette: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f8f2e7',
    padding: 16,
    marginBottom: 16,
  },
  sharePaletteTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 12,
  },
  sharePaletteTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#efe2ce',
    marginHorizontal: 4,
    marginBottom: 8,
  },
  sharePaletteTabActive: {
    backgroundColor: '#c6a87d',
    borderColor: '#b18d5c',
  },
  sharePaletteTabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a4524',
    textAlign: 'center',
  },
  sharePaletteTabLabelActive: {
    color: '#ffffff',
  },
  shareToolbar: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f8f2e7',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  shareToolbarTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    marginBottom: 8,
  },
  shareToolbarContent: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 96,
  },
  sharePaletteContent: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 140,
    maxHeight: 220,
  },
  sharePaletteScroll: {
    maxHeight: 200,
  },
  sharePaletteScrollContent: {
    paddingBottom: 12,
  },
  sharePaletteChipRow: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  sharePaletteChip: {
    marginBottom: 0,
    marginRight: 8,
  },
  sharePaletteOptionRow: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sharePaletteOptionCard: {
    width: 160,
    marginRight: 12,
  },
  sharePaletteSwatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  sharePaletteColorSwatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginHorizontal: 6,
    marginBottom: 0,
  },
  sharePaletteLayoutRow: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  sharePaletteLayoutCard: {
    width: 200,
    marginRight: 12,
    marginBottom: 0,
  },
  sharePaletteLayoutColumn: {
    paddingBottom: 4,
  },
  shareThemeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
    marginHorizontal: -4,
  },
  shareEditorScroll: {
    paddingBottom: 36,
  },
  shareEditorSection: {
    marginBottom: 24,
  },
  shareEditorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b2a15',
    marginBottom: 12,
  },
  shareThemeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  shareThemeChipSelected: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  shareThemeSwatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 10,
  },
  shareThemeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b2a15',
  },
  shareEditorOptionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  shareEditorOption: {
    width: '48%',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f8f2e7',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginHorizontal: 6,
    marginBottom: 12,
  },
  shareEditorOptionSelected: {
    borderColor: '#c6a87d',
    backgroundColor: '#f2e6d4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  shareEditorOptionLabel: {
    fontSize: 20,
    marginBottom: 6,
    color: '#2c1f0c',
  },
  shareEditorOptionName: {
    fontSize: 14,
    color: '#6f5a35',
  },
  shareEditorColorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  shareEditorColorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginHorizontal: 4,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  shareEditorColorSwatchSelected: {
    borderColor: '#c6a87d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  shareEditorBackgroundPreview: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d7c5a8',
    marginBottom: 6,
  },
  shareEditorOptionsColumn: {
    flexDirection: 'column',
  },
  shareEditorLayoutCard: {
    borderWidth: 1,
    borderColor: '#d7c5a8',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#f8f2e7',
    marginBottom: 12,
  },
  shareEditorLayoutCardSelected: {
    borderColor: '#c6a87d',
    backgroundColor: '#f2e6d4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  shareEditorLayoutTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3b2a15',
    marginBottom: 6,
  },
  shareEditorLayoutDescription: {
    fontSize: 14,
    color: '#6f5a35',
  },
  shareEditorHelperText: {
    fontSize: 13,
    color: '#6f5a35',
    marginBottom: 12,
  },
  shareSegmentList: {
    flexDirection: 'column',
  },
  shareSegmentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#d7c5a8',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  shareSegmentCardSelected: {
    borderColor: '#c6a87d',
    backgroundColor: '#f7ecda',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  shareSegmentBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#c6a87d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  shareSegmentBadgeLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
  shareSegmentPreview: {
    flex: 1,
    fontSize: 14,
    color: '#3b2a15',
    lineHeight: 20,
  },
  shareNowButton: {
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 18,
    backgroundColor: '#c6a87d',
    borderWidth: 1,
    borderColor: '#b18d5c',
  },
  shareNowButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  contentScroll: {
    paddingBottom: 40,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2c1f0c',
  },
  sectionDetailTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#3b2a15',
  },
  contentHeading: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 18,
    marginBottom: 4,
    color: '#3b2a15',
  },
  contentHeadingFirst: {
    marginTop: 0,
  },
  contentParagraph: {
    fontSize: 16,
    lineHeight: 26,
    color: '#3b2a15',
    marginTop: 4,
    marginBottom: 12,
  },
  contentParagraphFirst: {
    marginTop: 0,
  },
  blockContainer: {
    marginBottom: 16,
  },
  quoteBlock: {
    borderLeftWidth: 3,
    borderLeftColor: '#d7c5a8',
    paddingLeft: 12,
    marginTop: 12,
    marginBottom: 16,
  },
  quoteText: {
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    color: '#4a371c',
  },
  poetryBlock: {
    marginTop: 12,
    marginBottom: 16,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#d7c5a8',
  },
  poetryLine: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3b2a15',
  },
  listBlock: {
    marginTop: 8,
    marginBottom: 16,
    paddingLeft: 16,
  },
  listItemText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3b2a15',
    marginBottom: 4,
  },
  passageNumber: {
    color: '#8c6239',
    fontWeight: '700',
  },
  firstBlock: {
    marginTop: 0,
  },
  footnoteContainer: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#d7c5a8',
    paddingTop: 10,
  },
  footnoteText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#5c4827',
    marginTop: 4,
  },
  attributionText: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    color: '#4a371c',
    textAlign: 'right',
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6f5a35',
  },
});

export default App;
