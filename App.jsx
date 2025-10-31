import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
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
  const [selectedId, setSelectedId] = useState(
    writings.length > 0 ? writings[0].id : null,
  );
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const selectedWriting = useMemo(
    () => writings.find(item => item.id === selectedId) ?? null,
    [selectedId, writings],
  );
  const writingSections = useMemo(() => {
    if (!selectedWriting) {
      return [];
    }

    if (
      Array.isArray(selectedWriting.sections) &&
      selectedWriting.sections.length > 0
    ) {
      return selectedWriting.sections
        .map((section, index) => {
          const sectionId =
            section.id ?? `${selectedWriting.id}-section-${index + 1}`;
          const blocks = normalizeSectionBlocks(
            section,
            sectionId,
            selectedWriting.text ?? '',
          );
          return {
            id: sectionId,
            title: section.title ?? `Section ${index + 1}`,
            blocks,
          };
        })
        .filter(section => section.blocks.length > 0);
    }

    const fallbackId = `${selectedWriting.id}-full`;
    return [
      {
        id: fallbackId,
        title: 'Full Text',
        blocks: normalizeSectionBlocks(
          { blocks: [], paragraphs: [] },
          fallbackId,
          selectedWriting.text ?? '',
        ),
      },
    ];
  }, [selectedWriting]);

  useEffect(() => {
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
  }, [writingSections]);

  const selectedSection = useMemo(
    () =>
      writingSections.find(section => section.id === selectedSectionId) ??
      writingSections[0] ??
      null,
    [selectedSectionId, writingSections],
  );

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
      <View style={styles.menuContainer}>
        <Text style={styles.sectionTitle}>Baha'i Writings</Text>
        <FlatList
          data={writings}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.menuListContent}
          ItemSeparatorComponent={() => <View style={styles.menuSeparator} />}
          renderItem={({ item }) => {
            const isSelected = item.id === selectedId;
            return (
              <TouchableOpacity
                onPress={() => setSelectedId(item.id)}
                style={[
                  styles.menuItem,
                  isSelected && styles.menuItemSelected,
                ]}
              >
                <Text
                  style={[
                    styles.menuItemText,
                    isSelected && styles.menuItemTextSelected,
                  ]}
                >
                  {item.title}
                </Text>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyMenuText}>
              Add XHTML files to `assets/writings` and run `npm run process:writings`.
            </Text>
          }
        />
      </View>
      <View style={styles.contentContainer}>
        {selectedWriting ? (
          <ScrollView contentContainerStyle={styles.contentScroll}>
            <Text style={styles.contentTitle}>{selectedWriting.title}</Text>
            {writingSections.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.sectionTabs}
              >
                {writingSections.map(section => {
                  const isActive = section.id === selectedSection?.id;
                  return (
                    <TouchableOpacity
                      key={section.id}
                      onPress={() => setSelectedSectionId(section.id)}
                      style={[
                        styles.sectionTab,
                        isActive && styles.sectionTabActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.sectionTabText,
                          isActive && styles.sectionTabTextActive,
                        ]}
                      >
                        {section.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            {selectedSection?.blocks.length === 0 ? (
              <Text style={styles.contentParagraph}>
                This writing does not contain any readable text.
              </Text>
            ) : (
              selectedSection.blocks.map((block, index) => {
                if (block.type === 'heading') {
                  return (
                    <Text
                      key={block.id}
                      style={[
                        styles.contentHeading,
                        index === 0 && styles.contentHeadingFirst,
                      ]}
                    >
                      {block.text}
                    </Text>
                  );
                }

                if (block.type === 'quote') {
                  return (
                    <View
                      key={block.id}
                      style={[
                        styles.quoteBlock,
                        index === 0 && styles.firstBlock,
                      ]}
                    >
                      <Text style={styles.quoteText}>{block.text}</Text>
                    </View>
                  );
                }

                if (block.type === 'poetry') {
                  return (
                    <View
                      key={block.id}
                      style={[
                        styles.poetryBlock,
                        index === 0 && styles.firstBlock,
                      ]}
                    >
                      {block.text.split('\n').map((line, lineIndex) => (
                        <Text
                          key={`${block.id}-line-${lineIndex}`}
                          style={styles.poetryLine}
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
                      key={block.id}
                      style={[
                        styles.listBlock,
                        index === 0 && styles.firstBlock,
                      ]}
                    >
                      {block.text.split('\n').map((line, lineIndex) => (
                        <Text
                          key={`${block.id}-item-${lineIndex}`}
                          style={styles.listItemText}
                        >
                          {line}
                        </Text>
                      ))}
                    </View>
                  );
                }

                return (
                  <Text
                    key={block.id}
                    style={[
                      styles.contentParagraph,
                      index === 0 && styles.contentParagraphFirst,
                    ]}
                  >
                    {block.text}
                  </Text>
                );
              })
            )}
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No writings available yet. Add XHTML files to `assets/writings`
              and run `npm run process:writings` to generate the library.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f4ef',
  },
  menuContainer: {
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#2c1f0c',
  },
  menuListContent: {
    paddingHorizontal: 4,
  },
  menuSeparator: {
    width: 8,
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#e0d5c2',
  },
  menuItemSelected: {
    backgroundColor: '#c6a87d',
  },
  menuItemText: {
    fontSize: 16,
    color: '#3c2b16',
  },
  menuItemTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyMenuText: {
    color: '#6f5a35',
    fontStyle: 'italic',
  },
  contentContainer: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  contentScroll: {
    paddingBottom: 40,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2c1f0c',
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
  sectionTabs: {
    paddingVertical: 8,
    paddingHorizontal: 4,
    flexDirection: 'row',
  },
  sectionTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d7c5a8',
    backgroundColor: '#f7f0e3',
    marginRight: 8,
  },
  sectionTabActive: {
    backgroundColor: '#c6a87d',
    borderColor: '#c6a87d',
  },
  sectionTabText: {
    fontSize: 15,
    color: '#4b3218',
  },
  sectionTabTextActive: {
    color: '#fff',
    fontWeight: '600',
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
