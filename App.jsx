import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  Share,
  Dimensions,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import writingsManifest from './assets/generated/writings.json';

function cleanBlockText(block) {
  return block
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim();
}

function normalizeSectionBlocks(section, fallbackSectionId, fallbackText = '') {
  const ensureId = (value, index) =>
    value ?? `${fallbackSectionId}-block-${index + 1}`;

  if (Array.isArray(section?.blocks) && section.blocks.length > 0) {
    return section.blocks
      .map((block, index) => {
        const text = cleanBlockText(block?.text ?? '');
        if (!text) {
          return null;
        }
        return {
          id: ensureId(block?.id, index),
          type: block?.type ?? 'paragraph',
          text,
          sourceId: block?.sourceId ?? null,
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
    return 'Back to home';
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
    setShareContext({
      block,
      writingTitle,
      sectionTitle,
      returnScreen,
    });
    setCurrentScreen('share');
  };

  const handleCloseShare = () => {
    const nextScreen = shareContext?.returnScreen ?? 'home';
    setShareContext(null);
    setCurrentScreen(nextScreen);
  };

  const handleShareNow = async () => {
    if (!shareContext) {
      return;
    }

    const { block, writingTitle, sectionTitle } = shareContext;
    const sectionLine = sectionTitle ? `, ${sectionTitle}` : '';
    const message = `"${block.text}"\n\n— ${writingTitle}${sectionLine}`;

    try {
      await Share.share({ message });
    } catch (error) {
      console.warn('Unable to share passage', error);
    }
  };

  const handleSelectShareTheme = themeId => {
    setShareThemeId(themeId);
  };

  const handleOpenSettings = () => {
    setCurrentScreen('settings');
  };

  const handleCloseSettings = () => {
    setCurrentScreen('home');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedWritingId(null);
    setSelectedSectionId(null);
    setRandomPassage(null);
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

  const renderBlockContent = (block, index) => {
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
      return (
        <View
          style={[styles.quoteBlock, index === 0 && styles.firstBlock]}
        >
          <Text
            style={[styles.quoteText, scaledTypography.quoteText]}
          >
            {block.text}
          </Text>
        </View>
      );
    }

    if (block.type === 'poetry') {
      return (
        <View
          style={[styles.poetryBlock, index === 0 && styles.firstBlock]}
        >
          {block.text.split('\n').map((line, lineIndex) => (
            <Text
              key={`${block.id}-line-${lineIndex}`}
              style={[styles.poetryLine, scaledTypography.poetryLine]}
            >
              {line}
            </Text>
          ))}
        </View>
      );
    }

    if (block.type === 'list') {
      return (
        <View
          style={[styles.listBlock, index === 0 && styles.firstBlock]}
        >
          {block.text.split('\n').map((line, lineIndex) => (
            <Text
              key={`${block.id}-item-${lineIndex}`}
              style={[styles.listItemText, scaledTypography.listItemText]}
            >
              {line}
            </Text>
          ))}
        </View>
      );
    }

    return (
      <Text
        style={[
          styles.contentParagraph,
          index === 0 && styles.contentParagraphFirst,
          scaledTypography.contentParagraph,
        ]}
      >
        {block.text}
      </Text>
    );
  };

  let screenContent = null;

  if (currentScreen === 'home') {
    screenContent = (
      <View style={styles.homeContainer}>
        <View style={styles.homeHeader}>
          <Text style={styles.sectionTitle}>Baha'i Writings</Text>
          <TouchableOpacity
            onPress={handleOpenSettings}
            style={styles.settingsButton}
          >
            <Text style={styles.settingsButtonLabel}>Settings</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={handleShowRandomPassage}
          disabled={!hasPassages}
          style={[
            styles.randomButton,
            !hasPassages && styles.randomButtonDisabled,
          ]}
        >
          <Text style={styles.randomButtonLabel}>Read a random passage</Text>
          <Text style={styles.randomButtonHint}>
            A gentle prompt for your morning or evening devotion
          </Text>
        </TouchableOpacity>
        <FlatList
          data={writings}
          keyExtractor={item => item.id}
          style={styles.homeList}
          contentContainerStyle={
            writings.length === 0 ? styles.homeListEmpty : styles.homeListContent
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleSelectWriting(item.id)}
              style={styles.homeCard}
            >
              <Text style={styles.homeCardTitle}>{item.title}</Text>
              <Text style={styles.homeCardSubtitle}>Tap to explore this writing</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No writings available yet. Add XHTML files to `assets/writings`
                and run `npm run process:writings` to generate the library.
              </Text>
            </View>
          )}
        />
      </View>
    );
  } else if (currentScreen === 'settings') {
    screenContent = (
      <View style={styles.screenSurface}>
        <TouchableOpacity
          onPress={handleCloseSettings}
          style={styles.backButton}
        >
          <Text style={styles.backButtonLabel}>Back to home</Text>
        </TouchableOpacity>
        <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
          Settings
        </Text>
        <Text
          style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}
        >
          Adjust your reading experience.
        </Text>
        <View style={styles.settingsGroup}>
          <Text style={styles.settingsGroupLabel}>Font size</Text>
          {fontOptions.map(option => {
            const isSelected = fontScale === option.value;
            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelectFontScale(option.value)}
                style={[
                  styles.settingsOption,
                  isSelected && styles.settingsOptionSelected,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={styles.settingsOptionHeader}>
                  <Text style={styles.settingsOptionLabel}>
                    {option.label}
                  </Text>
                  {isSelected ? (
                    <View style={styles.settingsOptionBadge}>
                      <Text style={styles.settingsOptionBadgeLabel}>
                        Selected
                      </Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.settingsOptionDescription}>
                  {option.description}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  } else if (currentScreen === 'share' && shareContext) {
    screenContent = (
      <View style={styles.screenSurface}>
        <TouchableOpacity
          onPress={handleCloseShare}
          style={styles.backButton}
        >
          <Text style={styles.backButtonLabel}>{shareBackButtonLabel}</Text>
        </TouchableOpacity>
        <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
          Share this passage
        </Text>
        <Text
          style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}
        >
          Pick a layout and send this inspiration to someone you love.
        </Text>
        <View
          style={[
            styles.sharePreviewCard,
            {
              backgroundColor: activeShareTheme.backgroundColor,
              borderColor: activeShareTheme.accentColor,
            },
          ]}
        >
          <View style={styles.sharePreviewContent}>
            <Text
              style={[
                styles.sharePreviewQuote,
                scaledTypography.contentParagraph,
                { color: activeShareTheme.textColor },
              ]}
            >
              {shareContext.block.text}
            </Text>
            <View style={styles.sharePreviewMeta}>
              <Text
                style={[
                  styles.sharePreviewMetaLabel,
                  { color: activeShareTheme.tagColor },
                ]}
              >
                From
              </Text>
              <Text
                style={[
                  styles.sharePreviewTitle,
                  { color: activeShareTheme.textColor },
                ]}
              >
                {shareContext.writingTitle}
              </Text>
              {shareContext.sectionTitle ? (
                <Text
                  style={[
                    styles.sharePreviewSection,
                    { color: activeShareTheme.tagColor },
                  ]}
                >
                  {shareContext.sectionTitle}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
        <View style={styles.shareThemeRow}>
          {shareThemes.map(theme => {
            const isActive = theme.id === shareThemeId;
            return (
              <TouchableOpacity
                key={theme.id}
                onPress={() => handleSelectShareTheme(theme.id)}
                style={[
                  styles.shareThemeChip,
                  isActive && styles.shareThemeChipSelected,
                  {
                    borderColor: theme.accentColor,
                    backgroundColor: isActive ? theme.backgroundColor : '#fff',
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View
                  style={[
                    styles.shareThemeSwatch,
                    { backgroundColor: theme.accentColor },
                  ]}
                />
                <Text style={styles.shareThemeLabel}>{theme.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <TouchableOpacity
          onPress={handleShareNow}
          style={styles.shareNowButton}
        >
          <Text style={styles.shareNowButtonLabel}>Share passage</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (currentScreen === 'writing' && selectedWriting) {
    screenContent = (
      <View style={styles.screenSurface}>
        <TouchableOpacity
          onPress={handleBackToHome}
          style={styles.backButton}
        >
          <Text style={styles.backButtonLabel}>Back to library</Text>
        </TouchableOpacity>
        <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
          {selectedWriting.title}
        </Text>
        <Text
          style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}
        >
          Choose a section to read.
        </Text>
        {writingSections.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              This writing does not contain any readable sections yet.
            </Text>
          </View>
        ) : (
          <FlatList
            data={writingSections}
            keyExtractor={item => item.id}
            style={styles.sectionList}
            contentContainerStyle={styles.sectionListContent}
            renderItem={({ item, index }) => {
              const blockCount = item.blocks.length;
              const blockLabel = blockCount === 1 ? 'passage' : 'passages';
              return (
                <TouchableOpacity
                  onPress={() => handleSelectSection(item.id)}
                  style={styles.sectionRow}
                >
                  <Text style={styles.sectionRowTitle}>
                    {index + 1}. {item.title}
                  </Text>
                  <Text style={styles.sectionRowDescription}>
                    {blockCount} {blockLabel}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  } else if (
    currentScreen === 'section' &&
    selectedWriting &&
    selectedSection
  ) {
    screenContent = (
      <View style={[styles.screenSurface, styles.sectionScreenSurface]}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity
            onPress={handleBackToSections}
            style={styles.backButton}
          >
            <Text style={styles.backButtonLabel}>Back to sections</Text>
          </TouchableOpacity>
          <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
            {selectedWriting.title}
          </Text>
          <Text
            style={[
              styles.sectionDetailTitle,
              scaledTypography.sectionDetailTitle,
            ]}
          >
            {selectedSection.title}
          </Text>
        </View>
        {selectedSection.blocks.length === 0 ? (
          <Text
            style={[
              styles.contentParagraph,
              styles.sectionEmptyText,
              scaledTypography.contentParagraph,
            ]}
          >
            This section does not contain any readable text.
          </Text>
        ) : (
          <>
            <View style={styles.sectionPagerIndicator}>
              <Text style={styles.sectionPagerIndicatorLabel}>
                Passage {sectionBlockIndex + 1} of {selectedSection.blocks.length}
              </Text>
            </View>
            <View style={styles.sectionPagerWrapper}>
              <FlatList
                ref={sectionPagerRef}
                data={selectedSection.blocks}
                horizontal
                pagingEnabled
                decelerationRate="fast"
                snapToAlignment="start"
                snapToInterval={sectionPageWidth}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => `${selectedSection.id}-${item.id ?? index}`}
                style={styles.sectionPagerList}
                contentContainerStyle={styles.sectionPagerContent}
                onViewableItemsChanged={sectionViewableItemsChanged.current}
                viewabilityConfig={sectionViewabilityConfig.current}
                getItemLayout={(_, index) => ({
                  length: sectionPageWidth,
                  offset: sectionPageWidth * index,
                  index,
                })}
                renderItem={({ item, index }) => (
                  <View
                    style={[
                      styles.sectionPagerItem,
                      { width: sectionPageWidth },
                    ]}
                  >
                    <ScrollView
                      style={styles.sectionPagerScrollView}
                      contentContainerStyle={styles.sectionPagerScroll}
                      showsVerticalScrollIndicator={false}
                      nestedScrollEnabled
                    >
                      <View style={styles.sectionPagerBlock}>
                        {renderBlockContent(item, index)}
                      </View>
                    </ScrollView>
                    <View style={styles.sectionPagerFooter}>
                      <TouchableOpacity
                        onPress={() =>
                          handleOpenShare({
                            block: item,
                            writingTitle: selectedWriting.title,
                            sectionTitle: selectedSection.title,
                            returnScreen: 'section',
                          })
                        }
                        style={styles.shareActionChip}
                      >
                        <Text style={styles.shareActionChipLabel}>Share</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          </>
        )}
      </View>
    );
  } else if (currentScreen === 'passage' && randomPassage) {
    screenContent = (
      <View style={styles.screenSurface}>
        <TouchableOpacity
          onPress={handleBackToHome}
          style={styles.backButton}
        >
          <Text style={styles.backButtonLabel}>Back to library</Text>
        </TouchableOpacity>
        <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
          Daily Passage
        </Text>
        <View style={styles.passageMeta}>
          <Text style={styles.passageMetaLabel}>From</Text>
          <Text
            style={[
              styles.passageMetaWriting,
              scaledTypography.passageMetaWriting,
            ]}
          >
            {randomPassage.writingTitle}
          </Text>
          <Text
            style={[
              styles.passageMetaSection,
              scaledTypography.passageMetaSection,
            ]}
          >
            {randomPassage.sectionTitle}
          </Text>
        </View>
        <ScrollView contentContainerStyle={styles.contentScroll}>
          <View style={styles.passageCard}>
            <View style={styles.blockWrapper}>
              {renderBlockContent(randomPassage.block, 0)}
              <TouchableOpacity
                onPress={() =>
                  handleOpenShare({
                    block: randomPassage.block,
                    writingTitle: randomPassage.writingTitle,
                    sectionTitle: randomPassage.sectionTitle,
                    returnScreen: 'passage',
                  })
                }
                style={styles.shareActionChip}
              >
                <Text style={styles.shareActionChipLabel}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <TouchableOpacity
          onPress={handleShowRandomPassage}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonLabel}>Show another passage</Text>
        </TouchableOpacity>
      </View>
    );
  } else {
    screenContent = (
      <View style={styles.screenSurface}>
        <TouchableOpacity
          onPress={handleBackToHome}
          style={styles.backButton}
        >
          <Text style={styles.backButtonLabel}>Back to library</Text>
        </TouchableOpacity>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            The selected content is not available.
          </Text>
        </View>
      </View>
    );
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
  homeContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2c1f0c',
  },
  settingsButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f0e4d2',
  },
  settingsButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b2a15',
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
  randomButton: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: '#c6a87d',
    borderWidth: 1,
    borderColor: '#b18d5c',
    marginTop: 8,
  },
  randomButtonDisabled: {
    opacity: 0.5,
  },
  randomButtonLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  randomButtonHint: {
    fontSize: 14,
    color: '#f2e6d4',
    marginTop: 6,
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
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f0e4d2',
    marginBottom: 16,
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
    alignSelf: 'flex-end',
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
    alignItems: 'flex-end',
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
  shareThemeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 4,
    marginHorizontal: -4,
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
  firstBlock: {
    marginTop: 0,
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
