import React from 'react';
import { Text, View } from 'react-native';

export default function ScreenTitle({ styles, title, style, textStyle }) {
  if (!title) {
    return null;
  }

  return (
    <View style={[styles.tabScreenTitleWrapper, style]}>
      <Text style={[styles.tabScreenTitle, textStyle]}>{title}</Text>
    </View>
  );
}
