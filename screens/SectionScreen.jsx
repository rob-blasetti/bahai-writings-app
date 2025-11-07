import React, { useCallback } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';
import { NavigationTopBar } from '../components/NavigationTopBar';

export default function SectionScreen({
  styles,
  scaledTypography,
  selectedWriting,
  selectedSection,
  sectionBlockIndex,
  onBack,
  sectionPagerRef,
  sectionPageWidth,
  sectionViewabilityConfig,
  sectionViewableItemsChanged,
  renderBlockContent,
  onAddToProgram,
  onAddToMyVerses,
  onShare,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
}) {
  const renderSectionBlock = useCallback(
    ({ item, index }) => (
      <View
        style={[styles.sectionPagerItem, { width: sectionPageWidth }]}
      >
        <ScrollView
          style={styles.sectionPagerScrollView}
          contentContainerStyle={styles.sectionPagerScroll}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
        >
          <View style={styles.sectionPagerBlock}>
            {renderBlockContent(item, index, {
              writingTitle: selectedWriting.title,
              sectionTitle: selectedSection.title,
            })}
          </View>
        </ScrollView>
        <View style={[styles.sectionPagerFooter, styles.actionChipRow]}>
          <TouchableOpacity
            onPress={() =>
              onAddToProgram({
                block: item,
                writingId: selectedWriting.id,
                writingTitle: selectedWriting.title,
                sectionId: selectedSection.id,
                sectionTitle: selectedSection.title,
              })
            }
            style={[styles.shareActionChip, styles.chipInRow]}
          >
            <Text style={styles.shareActionChipLabel}>Add to program</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              onShare({
                block: item,
                writingTitle: selectedWriting.title,
                sectionTitle: selectedSection.title,
                returnScreen: 'section',
              })
            }
            style={[
              styles.shareActionChip,
              styles.chipInRow,
              styles.chipSpacing,
            ]}
          >
            <Text style={styles.shareActionChipLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              onAddToMyVerses({
                block: item,
                writingId: selectedWriting.id,
                writingTitle: selectedWriting.title,
                sectionId: selectedSection.id,
                sectionTitle: selectedSection.title,
              })
            }
            style={[
              styles.shareActionChip,
              styles.chipInRow,
              styles.chipSpacing,
            ]}
          >
            <Text style={styles.shareActionChipLabel}>Add to my verses</Text>
          </TouchableOpacity>
        </View>
      </View>
    ),
    [
      onAddToProgram,
      onShare,
      renderBlockContent,
      sectionPageWidth,
      selectedSection,
      selectedWriting,
      onAddToMyVerses,
      styles,
    ],
  );

  if (!selectedWriting || !selectedSection) {
    return null;
  }

  return (
    <View style={[styles.screenSurface, styles.sectionScreenSurface]}>
      <View style={styles.sectionHeader}>
        <NavigationTopBar
          styles={styles}
          onBack={onBack}
          backAccessibilityLabel="Back to sections"
          containerStyle={styles.sectionHeaderTopRow}
          rightAccessory={
            <ProgramIconButton
              styles={styles}
              hasProgramPassages={hasProgramPassages}
              programBadgeLabel={programBadgeLabel}
              onPress={onOpenProgram}
            />
          }
        />
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
              keyExtractor={(item, index) =>
                `${selectedSection.id}-${item.id ?? index}`
              }
              style={styles.sectionPagerList}
              contentContainerStyle={styles.sectionPagerContent}
              onViewableItemsChanged={sectionViewableItemsChanged.current}
              viewabilityConfig={sectionViewabilityConfig.current}
              getItemLayout={(_, index) => ({
                length: sectionPageWidth,
                offset: sectionPageWidth * index,
                index,
              })}
              renderItem={renderSectionBlock}
            />
          </View>
        </>
      )}
    </View>
  );
}
