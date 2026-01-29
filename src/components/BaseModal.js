import React from 'react';
import { Modal, Pressable, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function BaseModal({
  visible,
  onClose,
  styles,
  children,
  animationType = 'fade',
  backdropStyle,
  contentStyle,
  showClose = true,
  closeAccessibilityLabel = 'Close',
  closeIconColor = '#3b2a15',
  closeIconSize = 18,
  closeButtonStyle,
  allowBackdropClose = true,
}) {
  if (!visible) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType={animationType}
      onRequestClose={onClose}
    >
      <View style={[styles.baseModalBackdrop, backdropStyle]}>
        {allowBackdropClose ? (
          <Pressable style={styles.baseModalOverlay} onPress={onClose} />
        ) : (
          <View style={styles.baseModalOverlay} pointerEvents="none" />
        )}
        <View
          style={[styles.baseModalContent, contentStyle]}
          accessibilityViewIsModal
        >
          {showClose ? (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.baseModalCloseButton, closeButtonStyle]}
              accessibilityRole="button"
              accessibilityLabel={closeAccessibilityLabel}
            >
              <Ionicons name="close" size={closeIconSize} color={closeIconColor} />
            </TouchableOpacity>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}
