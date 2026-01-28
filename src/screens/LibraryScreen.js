import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { SettingsIconButton } from '../components/IconButtons';
import BaseScreen from '../components/BaseScreen';
import { NavigationTopBar } from '../components/NavigationTopBar';

export default function LibraryScreen({
  styles,
  writings,
  collectionLabel,
  onBack,
  onSelectWriting,
  onOpenSettings,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
  hasPassages,
  onShowRandomPassage,
}) {
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

  const listEmptyComponent = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        No writings available yet. Add XHTML files to `assets/writings`
        and run `npm run process:writings` to generate the library.
      </Text>
    </View>
  );

  return (
    <BaseScreen styles={styles} variant="plain" style={styles.homeContainer}>
      <NavigationTopBar
        styles={styles}
        onBack={onBack}
        backAccessibilityLabel="Back to collections"
        title={collectionLabel ?? "Baha'i Writings"}
        titleStyle={styles.topBarTitleSmall}
        rightAccessory={
          <SettingsIconButton styles={styles} onPress={onOpenSettings} />
        }
      />
      <FlatList
        data={writings}
        keyExtractor={item => item.id}
        style={styles.homeList}
        contentContainerStyle={
          writings.length === 0 ? styles.homeListEmpty : styles.homeListContent
        }
        renderItem={renderWritingItem}
        ListEmptyComponent={listEmptyComponent}
      />
    </BaseScreen>
  );
}
