import React, { useCallback } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const DEFAULT_ICON_COLOR = '#3b2a15';

export default function TopNav({
  styles,
  onBack,
  backAccessibilityLabel = 'Back',
  rightAccessory = null,
  iconColor = DEFAULT_ICON_COLOR,
  containerStyle,
  title = null,
  titleStyle,
  showBack = true,
}) {
  const navigation = useNavigation();

  const handleBack = useCallback(() => {
    if (typeof onBack === 'function') {
      onBack();
      return;
    }
    if (navigation?.canGoBack?.()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('explore');
  }, [navigation, onBack]);

  const accessory =
    rightAccessory != null ? (
      <View style={styles.topBarRightAccessory}>{rightAccessory}</View>
    ) : (
      <View style={styles.topBarRightPlaceholder} />
    );

  return (
    <View style={[styles.topBar, containerStyle]}>
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          style={styles.shareBackIconButton}
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
        >
          <Ionicons name="chevron-back" size={22} color={iconColor} />
        </TouchableOpacity>
      ) : (
        <View style={styles.shareBackIconButton} />
      )}
      {title ? (
        <View pointerEvents="none" style={styles.topBarTitleOverlay}>
          {typeof title === 'string' ? (
            <Text
              style={[styles.topBarTitle, titleStyle]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : (
            title
          )}
        </View>
      ) : null}
      {accessory}
    </View>
  );
}
