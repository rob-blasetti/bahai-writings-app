import React, { useMemo } from 'react';
import {
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';
import { NavigationTopBar } from '../components/NavigationTopBar';

export default function PassageScreen({
  styles,
  scaledTypography,
  randomPassage,
  onBack,
  renderBlockContent,
  onAddToProgram,
  onShare,
  onShowAnother,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
}) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const { dx, dy } = gestureState;
          const isHorizontalSwipe =
            Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
          return isHorizontalSwipe;
        },
        onPanResponderRelease: (_, gestureState) => {
          const { dx, vx } = gestureState;
          const shouldGoBack = dx > 80 || vx > 0.6;
          if (shouldGoBack) {
            onBack();
          }
        },
      }),
    [onBack],
  );

  if (!randomPassage) {
    return null;
  }

  return (
    <View style={styles.screenSurface} {...panResponder.panHandlers}>
      <NavigationTopBar
        styles={styles}
        onBack={onBack}
        backAccessibilityLabel="Back"
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
            <View style={styles.actionChipRow}>
              <TouchableOpacity
                onPress={() =>
                  onAddToProgram({
                    block: randomPassage.block,
                    writingId: randomPassage.writingId,
                    writingTitle: randomPassage.writingTitle,
                    sectionId: randomPassage.sectionId,
                    sectionTitle: randomPassage.sectionTitle,
                  })
                }
                style={[styles.shareActionChip, styles.chipInRow]}
              >
                <Text style={styles.shareActionChipLabel}>Add to program</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  onShare({
                    block: randomPassage.block,
                    writingTitle: randomPassage.writingTitle,
                    sectionTitle: randomPassage.sectionTitle,
                    returnScreen: 'passage',
                  })
                }
                style={[styles.shareActionChip, styles.chipInRow, styles.chipSpacing]}
              >
                <Text style={styles.shareActionChipLabel}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity onPress={onShowAnother} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonLabel}>Show another passage</Text>
      </TouchableOpacity>
    </View>
  );
}
