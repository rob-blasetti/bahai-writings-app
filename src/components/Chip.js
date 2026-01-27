import React from 'react';
import { Text, View } from 'react-native';

export default function Chip({ styles, label }) {
  if (label == null || label === '') {
    return null;
  }

  return (
    <View style={styles.chip}>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}
