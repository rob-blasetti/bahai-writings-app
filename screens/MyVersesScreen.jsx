import React from 'react';
import { Text, View } from 'react-native';

export default function MyVersesScreen({ styles, hasProgramPassages }) {
  return (
    <View style={styles.bottomNavScreen}>
      <Text style={styles.bottomNavScreenTitle}>My Verses</Text>
      <Text style={styles.bottomNavScreenSubtitle}>
        {hasProgramPassages
          ? 'Saved passages will appear here in a future update.'
          : 'Save passages to build your own devotional set.'}
      </Text>
    </View>
  );
}

