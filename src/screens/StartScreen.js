import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import BaseScreen from '../components/BaseScreen';

const liquidSpiritLogo = require('../../assets/images/liquid-spirit-logo.png');

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
        <View style={styles.authPrimaryActionRow}>
          <TouchableOpacity
            onPress={onStartRegister}
            style={[styles.authSecondaryButton, styles.authPrimaryActionButton]}
          >
            <Text style={styles.authSecondaryButtonLabel}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onStartSignIn}
            style={[
              styles.authSecondaryButton,
              styles.authPrimaryActionButton,
              styles.authPrimaryActionButtonSpacing,
            ]}
          >
            <Text style={styles.authSecondaryButtonLabel}>Log In</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={onStartSignIn}
          style={styles.authPrimaryButton}
        >
          <View style={styles.authPrimaryButtonContent}>
            <View style={styles.authPrimaryButtonLogoWrap}>
              <Image
                source={liquidSpiritLogo}
                style={styles.authPrimaryButtonLogo}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
              />
            </View>
            <Text style={styles.authPrimaryButtonLabel}>
              Log In With Liquid Spirit
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onContinueAsGuest}
          style={styles.authGuestButton}
        >
          <Text style={styles.authGuestButtonLabel}>Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}
