import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function NavigationTopBar({
  styles,
  onBack,
  backAccessibilityLabel,
  rightAccessory = null,
  iconColor = '#3b2a15',
  containerStyle,
  title = null,
}) {
  const accessory =
    rightAccessory != null ? (
      <View style={styles.topBarRightAccessory}>{rightAccessory}</View>
    ) : (
      <View style={styles.topBarRightPlaceholder} />
    );

  return (
    <View style={[styles.topBar, containerStyle]}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.shareBackIconButton}
        accessibilityRole="button"
        accessibilityLabel={backAccessibilityLabel}
      >
        <Ionicons name="chevron-back" size={22} color={iconColor} />
      </TouchableOpacity>
      {title ? (
        <View pointerEvents="none" style={styles.topBarTitleOverlay}>
          {typeof title === 'string' ? (
            <Text style={styles.topBarTitle}>{title}</Text>
          ) : (
            title
          )}
        </View>
      ) : null}
      {accessory}
    </View>
  );
}
