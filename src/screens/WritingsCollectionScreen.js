import React from 'react';
import { ScrollView } from 'react-native';
import BaseScreen from '../components/BaseScreen';
import Card from '../components/Card';

const formatCount = count => `${count ?? 0}`;

export default function WritingsCollectionScreen({
  styles,
  collections = [],
  onSelectCollection,
}) {
  return (
    <BaseScreen
      styles={styles}
      variant="plain"
      style={styles.homeContainer}
      topNav={{ title: 'Read The Writings', backAccessibilityLabel: 'Back' }}
    >
      <ScrollView
        style={styles.homeList}
        contentContainerStyle={[styles.homeListContent, styles.cardGrid]}
        showsVerticalScrollIndicator={false}
      >
        {collections.map(collection => (
          <Card
            key={collection.key}
            styles={styles}
            onPress={() => onSelectCollection?.(collection.key)}
            accessibilityLabel={collection.label}
            accessibilityHint={`Opens ${collection.label}`}
            title={collection.label}
            chipLabel={formatCount(collection.count)}
          />
        ))}
      </ScrollView>
    </BaseScreen>
  );
}
