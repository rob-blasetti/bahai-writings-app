import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Chip from './Chip';

const DEFAULT_CARD_BACKGROUNDS = ['#d6bc8c', '#b7d0c8', '#c6ceb0', '#d8beb6'];

const resolveCardBackground = (title, fallbackIndex = 0) => {
  if (typeof title !== 'string' || title.length === 0) {
    return DEFAULT_CARD_BACKGROUNDS[fallbackIndex % DEFAULT_CARD_BACKGROUNDS.length];
  }
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) {
    hash = (hash + title.charCodeAt(i)) % 4096;
  }
  const index = hash % DEFAULT_CARD_BACKGROUNDS.length;
  return DEFAULT_CARD_BACKGROUNDS[index];
};

export default function Card({
  styles,
  title,
  subtitle,
  imageSource,
  chipLabel,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  containerStyle,
}) {
  const backgroundColor = resolveCardBackground(title);
  const imageStyle = [styles.cardImage, { backgroundColor }];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.cardContainer, styles.cardHalfWidth, containerStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
    >
      <View style={[styles.cardImageWrapper, { backgroundColor }]}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={imageStyle}
            resizeMode="cover"
          />
        ) : (
          <View style={imageStyle} />
        )}
        <View style={styles.cardTintOverlay} />
        <View style={styles.cardTextOverlay}>
          <Text style={styles.cardTitle}>{title}</Text>
          {subtitle ? (
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          ) : null}
        </View>
        {chipLabel != null ? (
          <View style={styles.cardChip}>
            <Chip styles={styles} label={chipLabel} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
