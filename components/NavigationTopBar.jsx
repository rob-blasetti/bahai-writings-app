import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export function NavigationTopBar({
  styles,
  onBack,
  backAccessibilityLabel,
  rightAccessory = null,
  iconColor = '#3b2a15',
  containerStyle,
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
      {accessory}
    </View>
  );
}
