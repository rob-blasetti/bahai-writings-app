import React from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';

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
  if (!randomPassage) {
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
