import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import {
  ProgramIconButton,
  RandomIconButton,
  SettingsIconButton,
} from '../components/IconButtons';

export default function LibraryScreen({
  styles,
  writings,
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
    <View style={styles.homeContainer}>
      <View style={styles.homeHeader}>
        <View style={styles.homeHeaderTopRow}>
          <Text style={styles.sectionTitle}>Baha'i Writings</Text>
          <SettingsIconButton styles={styles} onPress={onOpenSettings} />
        </View>
        <View style={styles.homeHeaderActions}>
          <ProgramIconButton
            styles={styles}
            showLabel
            style={styles.homeActionButtonSpacing}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
            onPress={onOpenProgram}
          />
          <RandomIconButton
            styles={styles}
            hasPassages={hasPassages}
            onPress={onShowRandomPassage}
          />
        </View>
      </View>
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
    </View>
  );
}
