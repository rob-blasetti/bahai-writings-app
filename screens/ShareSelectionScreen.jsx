import React, { Fragment, useMemo } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { NavigationTopBar } from '../components/NavigationTopBar';
import { extractPassageSentences, getShareableBlockText } from './shareUtils';

export default function ShareSelectionScreen({
  styles,
  scaledTypography,
  shareContext,
  shareBackButtonLabel,
  selectedSentenceIndexes,
  onToggleSentence,
  onClose,
  onNext,
  maxSelections = 2,
}) {
  const sentences = useMemo(() => {
    if (Array.isArray(shareContext?.sentences)) {
      return shareContext.sentences;
    }
    const fallbackText = getShareableBlockText(shareContext?.block);
    return extractPassageSentences(fallbackText);
  }, [shareContext?.sentences, shareContext?.block]);

  const normalizedSelection = useMemo(() => {
    if (!Array.isArray(selectedSentenceIndexes)) {
      return [];
    }
    const parsed = selectedSentenceIndexes
      .map(item =>
        typeof item === 'string' ? Number.parseInt(item, 10) : item,
      )
      .filter(Number.isFinite);
    return Array.from(new Set(parsed));
  }, [selectedSentenceIndexes]);

  const selectionCount = normalizedSelection.length;
  const selectionLimitReached = selectionCount >= maxSelections;

  return (
    <View style={styles.screenSurface}>
      <NavigationTopBar
        styles={styles}
        onBack={onClose}
        backAccessibilityLabel={shareBackButtonLabel}
      />
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
            const isSelected = normalizedSelection.includes(index);
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
