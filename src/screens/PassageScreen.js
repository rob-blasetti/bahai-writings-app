import React, { useMemo } from 'react';
import {
  PanResponder,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ProgramIconButton } from '../components/IconButtons';
import { NavigationTopBar } from '../components/NavigationTopBar';
import Passage from '../components/Passage';

const EDGE_SWIPE_DISTANCE = 32;

export default function PassageScreen({
  styles,
  scaledTypography,
  randomPassage,
  onBack,
  renderBlockContent,
  onAddToProgram,
  onAddToMyVerses,
  onShare,
  onShowAnother,
  onOpenProgram,
  hasProgramPassages,
  programBadgeLabel,
  onContinueSection,
}) {
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: evt =>
          evt?.nativeEvent?.pageX <= EDGE_SWIPE_DISTANCE,
        onMoveShouldSetPanResponder: (evt, gestureState) => {
          if ((evt?.nativeEvent?.pageX ?? 0) > EDGE_SWIPE_DISTANCE) {
            return false;
          }
          const { dx, dy } = gestureState;
          const isHorizontalSwipe =
            Math.abs(dx) > Math.abs(dy) && dx > 10;
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
      <ScrollView contentContainerStyle={styles.contentScroll}>
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
          {randomPassage.sectionTitle ? (
            <Text
              style={[
                styles.passageMetaSection,
                scaledTypography.passageMetaSection,
              ]}
            >
              {randomPassage.sectionTitle}
            </Text>
          ) : null}
        </View>
        <Passage>
          <View style={styles.blockWrapper}>
            {renderBlockContent(randomPassage.block, 0, {
              writingTitle: randomPassage.writingTitle,
              sectionTitle: randomPassage.sectionTitle,
            })}
            <View style={styles.actionChipRow}>
              <TouchableOpacity
                accessibilityLabel="Add passage to devotional program"
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
                <Ionicons name="book-outline" size={20} color="#3b2a15" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Share this passage"
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
                <Ionicons name="paper-plane-outline" size={20} color="#3b2a15" />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityLabel="Add passage to My Verses"
                onPress={() =>
                  onAddToMyVerses({
                    block: randomPassage.block,
                    writingId: randomPassage.writingId,
                    writingTitle: randomPassage.writingTitle,
                    sectionId: randomPassage.sectionId,
                    sectionTitle: randomPassage.sectionTitle,
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
        </Passage>
        {typeof onContinueSection === 'function' ? (
          <TouchableOpacity
            onPress={onContinueSection}
            style={styles.passageContinueButton}
          >
            <Text style={styles.passageContinueButtonLabel}>
              Continue this section
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
      <TouchableOpacity onPress={onShowAnother} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonLabel}>Show another passage</Text>
      </TouchableOpacity>
    </View>
  );
}
