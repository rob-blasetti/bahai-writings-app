import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ProgramIconButton } from '../components/IconButtons';
import { NavigationTopBar } from '../components/NavigationTopBar';

export default function SectionScreen({
  styles,
  scaledTypography,
  selectedWriting,
  selectedSection,
  activeSearchHighlight,
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
  const blockScrollRefs = useRef({});
  const blockScrollMetrics = useRef({});
  const highlightCenterRequestRef = useRef(null);

  const registerBlockScrollRef = useCallback((blockId, ref) => {
    if (!blockId) {
      return;
    }
    if (ref) {
      blockScrollRefs.current[blockId] = ref;
    } else {
      delete blockScrollRefs.current[blockId];
    }
  }, []);

  const updateBlockScrollMetrics = useCallback((blockId, updates) => {
    if (!blockId || !updates) {
      return;
    }
    blockScrollMetrics.current[blockId] = {
      ...(blockScrollMetrics.current[blockId] ?? {}),
      ...updates,
    };
  }, []);

  const centerActiveHighlight = useCallback(() => {
    if (
      !activeSearchHighlight ||
      !activeSearchHighlight.blockId ||
      activeSearchHighlight.sectionId !== selectedSection?.id
    ) {
      return true;
    }

    const blockId = activeSearchHighlight.blockId;
    const ref = blockScrollRefs.current[blockId];
    const metrics = blockScrollMetrics.current[blockId];

    if (!ref || !metrics?.height || !metrics?.contentHeight) {
      return false;
    }

    const viewportHeight = metrics.height;
    const contentHeight = metrics.contentHeight;
    const blockLength =
      typeof activeSearchHighlight.blockTextLength === 'number' &&
      activeSearchHighlight.blockTextLength > 0
        ? activeSearchHighlight.blockTextLength
        : 0;
    const matchIndex =
      typeof activeSearchHighlight.matchIndex === 'number' &&
      activeSearchHighlight.matchIndex >= 0
        ? activeSearchHighlight.matchIndex
        : 0;

    let ratio = blockLength > 0 ? matchIndex / blockLength : 0;
    ratio = Math.min(Math.max(ratio, 0), 1);

    const targetOffset = Math.max(
      0,
      Math.min(
        contentHeight - viewportHeight,
        ratio * contentHeight - viewportHeight / 2,
      ),
    );

    ref.scrollTo({ y: targetOffset, animated: true });
    return true;
  }, [activeSearchHighlight, selectedSection]);

  useEffect(() => {
    let attempts = 0;

    const attemptCenter = () => {
      const success = centerActiveHighlight();
      if (!success && attempts < 5) {
        attempts += 1;
        highlightCenterRequestRef.current = requestAnimationFrame(attemptCenter);
      }
    };

    attemptCenter();

    return () => {
      if (highlightCenterRequestRef.current) {
        cancelAnimationFrame(highlightCenterRequestRef.current);
        highlightCenterRequestRef.current = null;
      }
    };
  }, [centerActiveHighlight]);

  const renderSectionBlock = useCallback(
    ({ item, index }) => {
      const blockId =
        item?.id ?? `${selectedSection?.id ?? 'section'}-block-${index}`;

      return (
        <View
          style={[styles.sectionPagerItem, { width: sectionPageWidth }]}
        >
          <ScrollView
            ref={ref => registerBlockScrollRef(blockId, ref)}
            style={styles.sectionPagerScrollView}
            contentContainerStyle={styles.sectionPagerScroll}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
            onLayout={({ nativeEvent }) => {
              updateBlockScrollMetrics(blockId, {
                height: nativeEvent.layout.height,
              });
              if (activeSearchHighlight?.blockId === blockId) {
                centerActiveHighlight();
              }
            }}
            onContentSizeChange={(_, contentHeight) => {
              updateBlockScrollMetrics(blockId, { contentHeight });
              if (activeSearchHighlight?.blockId === blockId) {
                centerActiveHighlight();
              }
            }}
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
              accessibilityLabel="Add passage to devotional program"
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
              <Ionicons name="book-outline" size={20} color="#3b2a15" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Share this passage"
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
              <Ionicons name="share-social-outline" size={20} color="#3b2a15" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Add passage to My Verses"
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
              <Ionicons name="heart-outline" size={20} color="#3b2a15" />
            </TouchableOpacity>
          </View>
        </View>
      );
    },
    [
      activeSearchHighlight,
      centerActiveHighlight,
      onAddToMyVerses,
      onAddToProgram,
      onShare,
      registerBlockScrollRef,
      renderBlockContent,
      sectionPageWidth,
      selectedSection,
      selectedWriting,
      styles,
      updateBlockScrollMetrics,
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
