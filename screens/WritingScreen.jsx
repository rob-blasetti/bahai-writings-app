import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';

export default function WritingScreen({
  styles,
  scaledTypography,
  selectedWriting,
  writingSections,
  onBack,
  onSelectSection,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
}) {
  const renderSectionItem = useCallback(
    ({ item, index }) => {
      const blockCount = item.blocks.length;
      const blockLabel = blockCount === 1 ? 'passage' : 'passages';
      return (
        <TouchableOpacity
          onPress={() => onSelectSection(item.id)}
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
    },
    [onSelectSection, styles],
  );

  const listEmptyComponent = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        This writing does not contain any readable sections yet.
      </Text>
    </View>
  );

  if (!selectedWriting) {
    return null;
  }

  return (
    <View style={styles.screenSurface}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonLabel}>Back to library</Text>
        </TouchableOpacity>
        <ProgramIconButton
          styles={styles}
          hasProgramPassages={hasProgramPassages}
          programBadgeLabel={programBadgeLabel}
          onPress={onOpenProgram}
        />
      </View>
      <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
        {selectedWriting.title}
      </Text>
      <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
        Choose a section to read.
      </Text>
      <FlatList
        data={writingSections}
        keyExtractor={item => item.id}
        style={styles.sectionList}
        contentContainerStyle={styles.sectionListContent}
        renderItem={renderSectionItem}
        ListEmptyComponent={listEmptyComponent}
      />
    </View>
  );
}
