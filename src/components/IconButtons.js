import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function ProgramIconButton({
  styles,
  style,
  showLabel = false,
  hasProgramPassages,
  programBadgeLabel,
  onPress,
  accessibilityHint =
    'Review or share the passages you have gathered.',
}) {
  const badge = hasProgramPassages ? (
    <View style={styles.iconBadge}>
      <Text style={styles.iconBadgeLabel}>{programBadgeLabel}</Text>
    </View>
  ) : null;

  if (showLabel) {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={[styles.homeActionButton, style]}
        accessibilityRole="button"
        accessibilityLabel={
          hasProgramPassages
            ? `Open devotional program, ${programBadgeLabel} passages added`
            : 'Open devotional program'
        }
        accessibilityHint={accessibilityHint}
      >
        <View style={styles.iconButton}>
          <Ionicons name="book-outline" size={22} color="#3b2a15" />
          {badge}
        </View>
        <Text style={styles.homeActionLabel}>Create Devotional</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.iconButtonContainer, style]}
      accessibilityRole="button"
      accessibilityLabel={
        hasProgramPassages
          ? `Open devotional program, ${programBadgeLabel} passages added`
          : 'Open devotional program'
      }
      accessibilityHint={accessibilityHint}
    >
      <View style={styles.iconButton}>
        <Ionicons name="book-outline" size={22} color="#3b2a15" />
        {badge}
      </View>
    </TouchableOpacity>
  );
}

export function RandomIconButton({
  styles,
  style,
  hasPassages,
  onPress,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!hasPassages}
      style={[
        styles.homeActionButton,
        style,
        !hasPassages && styles.buttonDisabled,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Read a random passage"
      accessibilityHint="Opens a random passage from the library."
    >
      <View style={styles.iconButton}>
        <Ionicons name="sparkles-outline" size={22} color="#3b2a15" />
      </View>
      <Text style={styles.homeActionLabel}>Read at Random</Text>
    </TouchableOpacity>
  );
}

export function SettingsIconButton({
  styles,
  style,
  onPress,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.iconButtonContainer, style]}
      accessibilityRole="button"
      accessibilityLabel="Open settings"
      accessibilityHint="Adjust reading preferences."
    >
      <View style={styles.iconButton}>
        <Ionicons name="settings-outline" size={22} color="#3b2a15" />
      </View>
    </TouchableOpacity>
  );
}
