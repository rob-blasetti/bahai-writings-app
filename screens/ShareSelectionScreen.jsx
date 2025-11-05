import React, { Fragment, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { ProgramIconButton } from '../components/IconButtons';
import { extractPassageSentences } from './shareUtils';

export default function ShareSelectionScreen({
  styles,
  scaledTypography,
  shareContext,
  shareBackButtonLabel,
  selectedSentenceIndexes,
  onToggleSentence,
  onClose,
  onOpenProgram,
  onNext,
  hasProgramPassages,
  programBadgeLabel,
  maxSelections = 2,
}) {
  const sentences = useMemo(
    () => extractPassageSentences(shareContext?.block?.text ?? ''),
    [shareContext],
  );

  const selectionCount = selectedSentenceIndexes.length;
  const selectionLimitReached = selectionCount >= maxSelections;

  return (
    <View style={styles.screenSurface}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonLabel}>{shareBackButtonLabel}</Text>
        </TouchableOpacity>
        <ProgramIconButton
          styles={styles}
          hasProgramPassages={hasProgramPassages}
          programBadgeLabel={programBadgeLabel}
          onPress={onOpenProgram}
        />
      </View>
      <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
        Choose what to share
      </Text>
      <Text style={[styles.detailSubtitle, styles.shareSelectHelper]}>
        Tap the sentences you would like to highlight. You can pick up to {maxSelections}.
      </Text>
      <View style={styles.shareSelectionInfoRow}>
        <Text style={styles.shareSelectionSourceLabel}>
          — {shareContext?.writingTitle}
        </Text>
        {shareContext?.sectionTitle ? (
          <Text style={styles.shareSelectionSection}>
            {shareContext.sectionTitle}
          </Text>
        ) : null}
      </View>
      <ScrollView
        style={styles.shareSelectList}
        contentContainerStyle={styles.shareSelectListContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.contentParagraph, styles.shareSelectionPassage]}>
          {sentences.map(({ text, trailing }, index) => {
            const isSelected = selectedSentenceIndexes.includes(index);
            return (
              <Fragment key={index}>
                <Text
                  style={[
                    styles.shareSentenceText,
                    isSelected && styles.shareSentenceTextSelected,
                  ]}
                  onPress={() => onToggleSentence(index)}
                >
                  {text}
                </Text>
                <Text>{trailing || (index === sentences.length - 1 ? '' : ' ')}</Text>
              </Fragment>
            );
          })}
        </Text>
      </ScrollView>
      <View style={styles.shareSelectionFooter}>
        <Text style={styles.shareSelectionCount}>
          {selectionCount}/{maxSelections} selected
          {selectionLimitReached ? ' — limit reached' : ''}
        </Text>
        <TouchableOpacity
          onPress={onNext}
          disabled={selectionCount === 0}
          style={[
            styles.shareNextButton,
            selectionCount === 0 && styles.shareNextButtonDisabled,
          ]}
          accessibilityRole="button"
          accessibilityState={{ disabled: selectionCount === 0 }}
        >
          <Text style={styles.shareNextButtonLabel}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
