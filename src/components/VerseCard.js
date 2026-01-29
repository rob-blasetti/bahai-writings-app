import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { cleanBlockText } from '../writings/passageUtils';

const MAX_PREVIEW_LENGTH = 160;

export default function VerseCard({
  styles,
  verse,
  onPress,
  onRemove,
}) {
  const savedAtLabel =
    typeof verse?.savedAt === 'number' && Number.isFinite(verse.savedAt)
      ? new Date(verse.savedAt).toLocaleDateString()
      : null;

  const previewText = useMemo(() => {
    const rawText =
      typeof verse?.block?.shareText === 'string' && verse.block.shareText.length > 0
        ? verse.block.shareText
        : verse?.block?.text ?? '';
    const cleaned = cleanBlockText(rawText);
    if (!cleaned) {
      return '';
    }
    if (cleaned.length <= MAX_PREVIEW_LENGTH) {
      return cleaned;
    }
    return `${cleaned.slice(0, MAX_PREVIEW_LENGTH).trimEnd()}…`;
  }, [verse]);

  return (
    <TouchableOpacity
      onPress={() => onPress?.(verse)}
      style={styles.verseCard}
      accessibilityRole="button"
    >
      <View style={styles.verseCardHeader}>
        <Text style={styles.verseCardLabel}>Saved verse</Text>
        {typeof onRemove === 'function' ? (
          <TouchableOpacity
            onPress={() => onRemove(verse.id)}
            style={styles.verseCardRemoveButton}
            accessibilityRole="button"
            accessibilityLabel="Remove saved verse"
          >
            <Text style={styles.verseCardRemoveLabel}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.verseCardWriting}>
        {verse?.writingTitle ?? 'Saved passage'}
      </Text>
      {verse?.sectionTitle ? (
        <Text style={styles.verseCardSection}>{verse.sectionTitle}</Text>
      ) : null}
      {previewText ? (
        <Text style={styles.verseCardPreview} numberOfLines={3}>
          {previewText}
        </Text>
      ) : null}
      {savedAtLabel ? (
        <Text style={styles.verseCardSavedAt}>Saved {savedAtLabel}</Text>
      ) : null}
    </TouchableOpacity>
  );
}
