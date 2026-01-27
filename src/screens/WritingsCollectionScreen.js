import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BaseScreen from '../components/BaseScreen';

const formatCount = count => {
  if (count === 0) {
    return 'No writings yet';
  }
  if (count === 1) {
    return '1 writing';
  }
  return `${count} writings`;
};

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
      <View style={styles.homeList}>
        {collections.map(collection => (
          <TouchableOpacity
            key={collection.key}
            onPress={() => onSelectCollection?.(collection.key)}
            style={styles.homeCard}
            accessibilityRole="button"
            accessibilityLabel={collection.label}
            accessibilityHint={`Opens ${collection.label}`}
          >
            <Text style={styles.homeCardTitle}>{collection.label}</Text>
            <Text style={styles.homeCardSubtitle}>
              {formatCount(collection.count ?? 0)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </BaseScreen>
  );
}
