import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import BaseScreen from '../components/BaseScreen';

export default function WritingScreen({
  styles,
  scaledTypography,
  selectedWriting,
  writingSections,
  collectionLabel,
  onSelectSection,
}) {
  const renderSectionItem = useCallback(
    ({ item, index }) => {
      const rangeLabel =
        item?.start && item?.end ? `${item.start} → ${item.end}` : null;

      return (
        <TouchableOpacity
          onPress={() => onSelectSection(item.id)}
          style={styles.sectionRow}
        >
          <Text style={styles.sectionRowTitle}>
            {index + 1}. {item.title}
          </Text>
          <Text style={styles.sectionRowDescription}>
            {rangeLabel || 'Tap to read'}
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
    <BaseScreen
      styles={styles}
      variant="plain"
      style={styles.homeContainer}
      topNav={{
        title: (
          <View style={styles.topBarTitleStack}>
            <Text
              style={styles.topBarTitlePrimary}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedWriting.title}
            </Text>
            <Text
              style={styles.topBarTitleSecondary}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {collectionLabel ?? "Baha'i Writings"}
            </Text>
          </View>
        ),
        backAccessibilityLabel: 'Back',
      }}
    >
      <Text
        style={[
          styles.detailSubtitle,
          scaledTypography.detailSubtitle,
          { marginTop: 0 },
        ]}
      >
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
    </BaseScreen>
  );
}
