import React, { useCallback, useMemo } from 'react';
import { SectionList, Text, TouchableOpacity, View } from 'react-native';
import { SettingsIconButton } from '../components/IconButtons';
import BaseScreen from '../components/BaseScreen';

function normalizeAuthor(author) {
  const trimmed = String(author ?? '').trim();
  return trimmed || 'Unknown';
}

export default function LibraryScreen({
  styles,
  writings,
  collectionLabel,
  onSelectWriting,
  onOpenSettings,
}) {
  const sections = useMemo(() => {
    const groups = new Map();

    (Array.isArray(writings) ? writings : []).forEach(work => {
      const author = normalizeAuthor(work?.author);
      if (!groups.has(author)) {
        groups.set(author, []);
      }
      groups.get(author).push(work);
    });

    const authorNames = Array.from(groups.keys()).sort((a, b) => {
      if (a === 'Unknown') return 1;
      if (b === 'Unknown') return -1;
      return a.localeCompare(b);
    });

    return authorNames.map(author => {
      const data = (groups.get(author) || []).slice().sort((a, b) =>
        String(a?.title ?? '').localeCompare(String(b?.title ?? '')),
      );
      return { title: author, data };
    });
  }, [writings]);

  const renderWritingItem = useCallback(
    ({ item }) => (
      <TouchableOpacity
        onPress={() => onSelectWriting(item.id)}
        style={styles.homeCard}
      >
        <Text style={styles.homeCardTitle}>{item.title}</Text>
        <Text style={styles.homeCardSubtitle}>Tap to explore this writing</Text>
      </TouchableOpacity>
    ),
    [onSelectWriting, styles],
  );

  const renderSectionHeader = useCallback(
    ({ section }) => (
      <Text style={styles.libraryAuthorHeader}>{section.title}</Text>
    ),
    [styles.libraryAuthorHeader],
  );

  const listEmptyComponent = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>No writings available yet.</Text>
    </View>
  );

  return (
    <BaseScreen
      styles={styles}
      variant="plain"
      style={styles.homeContainer}
      topNav={{
        title: collectionLabel ?? "Baha'i Writings",
        titleStyle: styles.topBarTitleSmall,
        backAccessibilityLabel: 'Back',
        rightAccessory: (
          <SettingsIconButton styles={styles} onPress={onOpenSettings} />
        ),
      }}
    >
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        style={styles.homeList}
        contentContainerStyle={
          sections.length === 0 ? styles.homeListEmpty : styles.homeListContent
        }
        renderItem={renderWritingItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={listEmptyComponent}
        stickySectionHeadersEnabled={false}
      />
    </BaseScreen>
  );
}
