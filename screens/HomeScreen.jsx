import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen({
  styles,
  displayName,
  onStartSignIn,
  onContinueAsGuest,
}) {
  return (
    <View style={styles.authContainer}>
      <View style={styles.authIntro}>
        <Text style={styles.authGreeting}>Welcome</Text>
        <Text style={styles.authName}>{displayName}</Text>
        <Text style={styles.authSubtitle}>
          Sign in with your Liquid Spirit account or continue exploring as a guest.
        </Text>
      </View>
      <View style={styles.authActions}>
        <TouchableOpacity
          onPress={onStartSignIn}
          style={styles.authPrimaryButton}
        >
          <Text style={styles.authPrimaryButtonLabel}>
            Sign In With Liquid Spirit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onContinueAsGuest}
          style={styles.authSecondaryButton}
        >
          <Text style={styles.authSecondaryButtonLabel}>
            Continue as Guest
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
