import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

export default function ToastNotification({
  message,
  visible = false,
  styles,
  bottomOffset = 0,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: visible ? 1 : 0,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: visible ? 0 : 8,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, visible]);

  if (!message) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.toastContainer,
        { bottom: bottomOffset },
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.toastCard}>
        <Text style={styles.toastLabel} accessibilityRole="alert">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}
