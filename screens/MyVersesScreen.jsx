import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';

function VerseCard({ styles, item, index, renderBlockContent, onRemoveVerse }) {
  const savedAtLabel =
    typeof item.savedAt === 'number' && Number.isFinite(item.savedAt)
      ? new Date(item.savedAt).toLocaleDateString()
      : null;

  return (
    <View style={styles.passageCard}>
      <View style={styles.programCardHeader}>
        <View style={styles.programCardMeta}>
          <Text style={styles.programCardTitle}>
            {index + 1}. {item.writingTitle ?? 'Saved passage'}
          </Text>
          {item.sectionTitle ? (
            <Text style={styles.programCardSubtitle}>{item.sectionTitle}</Text>
          ) : null}
          {savedAtLabel ? (
            <Text style={styles.myVerseSavedAt}>Saved {savedAtLabel}</Text>
          ) : null}
        </View>
        {typeof onRemoveVerse === 'function' ? (
          <TouchableOpacity
            onPress={() => onRemoveVerse(item.id)}
            style={styles.programRemoveButton}
          >
            <Text style={styles.programRemoveLabel}>Remove</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <View style={styles.blockWrapper}>
        {renderBlockContent(item.block, 0, {
          writingTitle: item.writingTitle,
          sectionTitle: item.sectionTitle,
        })}
      </View>
    </View>
  );
}

export default function MyVersesScreen({
  styles,
  scaledTypography,
  verses,
  renderBlockContent,
  onRemoveVerse,
}) {
  const hasVerses = Array.isArray(verses) && verses.length > 0;

  const renderVerseCard = useCallback(
    ({ item, index }) => (
      <VerseCard
        styles={styles}
        item={item}
        index={index}
        renderBlockContent={renderBlockContent}
        onRemoveVerse={onRemoveVerse}
      />
    ),
    [styles, renderBlockContent, onRemoveVerse],
  );

  if (!hasVerses) {
    return (
      <View style={styles.bottomNavScreen}>
        <Text style={styles.bottomNavScreenTitle}>My Verses</Text>
        <Text style={styles.bottomNavScreenSubtitle}>
          Save passages from sections or the daily passage and they will appear
          here.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.screenSurface}>
      <Text style={[styles.contentTitle, scaledTypography.contentTitle]}>
        My Verses
      </Text>
      <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
        Your saved passages for quick reference and reflection.
      </Text>
      <FlatList
        data={verses}
        keyExtractor={item => item.id}
        style={styles.myVersesList}
        contentContainerStyle={styles.myVersesListContent}
        renderItem={renderVerseCard}
      />
    </View>
  );
}
