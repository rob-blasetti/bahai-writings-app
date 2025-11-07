import React from 'react';
import { Text, View } from 'react-native';

export default function ProfileScreen({
  styles,
  displayName = 'Friend',
  email = '',
  isAuthenticated = false,
}) {
  const normalizedEmail =
    typeof email === 'string' && email.trim().length > 0 ? email.trim() : '';

  return (
    <View style={styles.bottomNavScreen}>
      <Text style={styles.bottomNavScreenTitle}>Profile</Text>
      {isAuthenticated ? (
        <>
          <Text style={styles.bottomNavScreenSubtitle}>
            Signed in as {displayName}.
          </Text>
          {normalizedEmail ? (
            <Text style={styles.bottomNavScreenSubtitle}>{normalizedEmail}</Text>
          ) : null}
          <Text style={styles.bottomNavScreenSubtitle}>
            Personalization controls will appear here.
          </Text>
        </>
      ) : (
        <Text style={styles.bottomNavScreenSubtitle}>
          Sign in with your Liquid Spirit account to personalize the app.
        </Text>
      )}
    </View>
  );
}
