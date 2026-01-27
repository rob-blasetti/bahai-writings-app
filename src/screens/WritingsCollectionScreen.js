import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import BaseScreen from '../components/BaseScreen';
import Card from '../components/Card';

const formatCount = count => `${count ?? 0}`;

export default function WritingsCollectionScreen({
  styles,
  collections = [],
  onSelectCollection,
}) {
  return (
    <BaseScreen styles={styles} variant="plain" style={styles.homeContainer}>
      <View style={styles.homeHeader}>
        <Text style={styles.sectionTitle}>Choose Writings</Text>
        <Text style={styles.homeHeaderSubtitle}>
          Select a collection to explore the library.
        </Text>
      </View>
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
