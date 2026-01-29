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
import Passage from '../components/Passage';
import BaseScreen from '../components/BaseScreen';

const EDGE_SWIPE_DISTANCE = 32;

export default function PassageScreen({
  styles,
  scaledTypography,
  randomPassage,
  programPassages,
  myVerses,
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
  const programKeySet = useMemo(() => {
    const items = Array.isArray(programPassages) ? programPassages : [];
    return new Set(
      items.map(
        item =>
          `${item.block?.id ?? ''}::${item.writingId ?? ''}::${
            item.sectionId ?? ''
          }`,
      ),
    );
  }, [programPassages]);
  const verseKeySet = useMemo(() => {
    const items = Array.isArray(myVerses) ? myVerses : [];
    return new Set(
      items.map(
        item =>
          `${item.block?.id ?? ''}::${item.writingId ?? ''}::${
            item.sectionId ?? ''
          }`,
      ),
    );
  }, [myVerses]);

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

  const passageKey = `${randomPassage.block?.id ?? ''}::${
    randomPassage.writingId ?? ''
  }::${randomPassage.sectionId ?? ''}`;
  const isInProgram = programKeySet.has(passageKey);
  const isInMyVerses = verseKeySet.has(passageKey);

  return (
    <BaseScreen
      styles={styles}
      variant="plain"
      topNav={{
        title: 'Choose At Random',
        backAccessibilityLabel: 'Back',
        rightAccessory: (
          <ProgramIconButton
            styles={styles}
            hasProgramPassages={hasProgramPassages}
            programBadgeLabel={programBadgeLabel}
            onPress={onOpenProgram}
          />
        ),
        onBack,
      }}
      {...panResponder.panHandlers}
    >
      <ScrollView>
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
                <Ionicons
                  name={isInProgram ? 'book' : 'book-outline'}
                  size={20}
                  color="#3b2a15"
                />
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
                <Ionicons
                  name={isInMyVerses ? 'heart' : 'heart-outline'}
                  size={20}
                  color="#3b2a15"
                />
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
    </BaseScreen>
  );
}
