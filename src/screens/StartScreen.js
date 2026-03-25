import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import BaseScreen from '../components/BaseScreen';

export default function StartScreen({
  styles,
  displayName,
  onStartSignIn,
  onStartRegister,
  onContinueAsGuest,
}) {
  return (
    <BaseScreen
      styles={styles}
      variant="plain"
      includeBottomInset
      style={styles.authContainer}
    >
      <View style={styles.authIntro}>
        <Text style={styles.authGreeting}>Welcome</Text>
        <Text style={styles.authName}>{displayName}</Text>
        <Text style={styles.authSubtitle}>
          Log in or register with Liquid Spirit, or keep exploring as a guest.
        </Text>
      </View>
      <View style={styles.authActions}>
        <TouchableOpacity
          onPress={onStartSignIn}
          style={styles.authPrimaryButton}
        >
          <Text style={styles.authPrimaryButtonLabel}>
            Log In With Liquid Spirit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onStartRegister}
          style={styles.authSecondaryButton}
        >
          <Text style={styles.authSecondaryButtonLabel}>Register</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onContinueAsGuest}
          style={styles.authLinkButton}
        >
          <Text style={styles.authLinkLabel}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}
