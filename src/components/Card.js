import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import Chip from './Chip';

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
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.cardContainer, styles.cardHalfWidth, containerStyle]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.cardImageWrapper}>
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.cardImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]} />
        )}
        {chipLabel != null ? (
          <View style={styles.cardChip}>
            <Chip styles={styles} label={chipLabel} />
          </View>
        ) : null}
      </View>
      <View style={styles.cardText}>
        <Text style={styles.cardTitle}>{title}</Text>
        {subtitle ? (
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
