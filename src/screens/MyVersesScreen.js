import React, { useCallback } from 'react';
import { FlatList, Text } from 'react-native';
import BaseScreen from '../components/BaseScreen';
import ScreenTitle from '../components/ScreenTitle';
import VerseCard from '../components/VerseCard';

export default function MyVersesScreen({
  styles,
  scaledTypography,
  verses,
  onRemoveVerse,
  onOpenVerse,
}) {
  const hasVerses = Array.isArray(verses) && verses.length > 0;

  const renderVerseCard = useCallback(
    ({ item }) => (
      <VerseCard
        styles={styles}
        verse={item}
        onRemove={onRemoveVerse}
        onPress={onOpenVerse}
      />
    ),
    [styles, onRemoveVerse, onOpenVerse],
  );

  if (!hasVerses) {
    return (
      <BaseScreen styles={styles} variant="plain" style={styles.homeContainer}>
        <ScreenTitle styles={styles} title="My Verses" />
        <Text style={[styles.detailSubtitle, scaledTypography.detailSubtitle]}>
          Save passages from sections or the daily passage and they will appear
          here.
        </Text>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen styles={styles} variant="plain" style={styles.homeContainer}>
      <ScreenTitle styles={styles} title="My Verses" />
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
    </BaseScreen>
  );
}
