import React from 'react';
import { Text, View } from 'react-native';

export default function SearchScreen({ styles }) {
  return (
    <View style={styles.bottomNavScreen}>
      <Text style={styles.bottomNavScreenTitle}>Search</Text>
      <Text style={styles.bottomNavScreenSubtitle}>
        Find passages, writings, and sections. This experience is coming soon.
      </Text>
    </View>
  );
}

