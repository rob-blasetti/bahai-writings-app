import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const MAX_RESULTS = 50;
const MAX_RECENT_QUERIES = 6;
const DEFAULT_RECENT_QUERIES = ['Unity', 'Joy', 'Detachment', 'Love'];

function SearchResultCard({ styles, item, onPress }) {
  return (
    <TouchableOpacity
      onPress={() => onPress(item)}
      style={styles.searchResultCard}
    >
      <Text style={styles.searchResultTitle}>{item.sectionTitle}</Text>
      <Text style={styles.searchResultWriting}>{item.writingTitle}</Text>
      {item.preview ? (
        <Text style={styles.searchResultPreview} numberOfLines={3}>
          {item.preview}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

export default function SearchScreen({
  styles,
  scaledTypography,
  searchableSections,
  onSelectSection,
}) {
  const [query, setQuery] = useState('');
  const [recentQueries, setRecentQueries] = useState([]);

  const normalizedQuery = useMemo(
    () => query.trim().toLowerCase(),
    [query],
  );

  const results = useMemo(() => {
    if (
      !Array.isArray(searchableSections) ||
      searchableSections.length === 0 ||
      normalizedQuery.length === 0
    ) {
      return [];
    }

    return searchableSections
      .filter(section =>
        section.searchableText?.includes(normalizedQuery),
      )
      .slice(0, MAX_RESULTS)
      .map(section => {
        const blockSearchTexts = Array.isArray(section.blockSearchTexts)
          ? section.blockSearchTexts
          : [];
        const blocks = Array.isArray(section.blocks) ? section.blocks : [];
        const blockIndex = blockSearchTexts.findIndex(blockText =>
          blockText?.includes(normalizedQuery),
        );
        const safeIndex =
          blockIndex >= 0 && blockIndex < blocks.length ? blockIndex : 0;
        const block = blocks[safeIndex] ?? null;
        const normalizedBlockText = blockSearchTexts[safeIndex] ?? '';
        const matchIndex = normalizedBlockText.indexOf(normalizedQuery);
        const previewText =
          (typeof block?.shareText === 'string' && block.shareText.length > 0
            ? block.shareText
            : typeof block?.text === 'string'
            ? block.text
            : null) ?? section.preview ?? '';

        return {
          id: section.id,
          writingId: section.writingId,
          writingTitle: section.writingTitle ?? 'Untitled writing',
          sectionId: section.sectionId,
          sectionTitle: section.sectionTitle ?? 'Section',
          preview: previewText,
          blockIndex: safeIndex,
          blockId: block?.id ?? null,
          matchIndex,
          blockTextLength: normalizedBlockText.length,
        };
      });
  }, [searchableSections, normalizedQuery]);

  const recentSuggestions =
    recentQueries.length > 0 ? recentQueries : DEFAULT_RECENT_QUERIES;

  const handleSelectResult = useCallback(
    item => {
      if (typeof onSelectSection === 'function' && item) {
        const trimmedQuery = query.trim();
        if (trimmedQuery.length > 0) {
          const normalized = trimmedQuery.toLowerCase();
          setRecentQueries(previous => {
            const existing = previous.filter(
              entry => entry.toLowerCase() !== normalized,
            );
            return [trimmedQuery, ...existing].slice(0, MAX_RECENT_QUERIES);
          });
        }
        onSelectSection({
          writingId: item.writingId,
          sectionId: item.sectionId,
          blockId: item.blockId,
          blockIndex: item.blockIndex,
          query: query.trim(),
          matchIndex: item.matchIndex,
          blockTextLength: item.blockTextLength,
        });
      }
    },
    [onSelectSection, query],
  );

  const handleApplyRecentQuery = useCallback(
    value => {
      if (typeof value !== 'string' || value.trim().length === 0) {
        return;
      }
      setQuery(value);
    },
    [],
  );

  const hasQuery = normalizedQuery.length > 0;
  const hasResults = results.length > 0;

  return (
    <View style={styles.screenSurface}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search sections"
        placeholderTextColor="#b8a58b"
        style={styles.searchInput}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
      <View style={styles.searchDivider} />
      {hasQuery ? (
        <>
          <Text style={styles.searchResultCount}>
            {hasResults
              ? `${results.length} section${
                  results.length === 1 ? '' : 's'
                } found`
              : '0 sections found'}
          </Text>
          <FlatList
            data={results}
            keyExtractor={item => item.id}
            style={styles.searchResultsList}
            contentContainerStyle={styles.searchResultsListContent}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <SearchResultCard
                styles={styles}
                item={item}
                onPress={handleSelectResult}
              />
            )}
          />
        </>
      ) : (
        <View style={styles.recentSearchesWrapper}>
          <Text style={styles.recentSearchHeading}>Recent searches</Text>
          <View style={styles.recentSearchChips}>
            {recentSuggestions.map(suggestion => (
              <TouchableOpacity
                key={suggestion}
                onPress={() => handleApplyRecentQuery(suggestion)}
                style={styles.recentSearchChip}
              >
                <Text style={styles.recentSearchChipLabel}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
