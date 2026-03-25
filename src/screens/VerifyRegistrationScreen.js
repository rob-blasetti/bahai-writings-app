import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BaseScreen from '../components/BaseScreen';

export default function VerifyRegistrationScreen({
  styles,
  authBahaiId,
  authVerificationCode,
  authPassword,
  authError,
  isAuthenticating,
  onChangeBahaiId,
  onChangeVerificationCode,
  onChangePassword,
  onVerify,
  onOpenRegister,
  onCancel,
}) {
  return (
    <BaseScreen
      styles={styles}
      topNav={{ backAccessibilityLabel: 'Back', onBack: onCancel }}
    >
      <View style={styles.authFormContainer}>
        <Text style={styles.authFormTitle}>Verify account</Text>
        <Text style={styles.authFormSubtitle}>
          Enter your Bahai ID, the verification code you received, and a password.
        </Text>
        {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}
        <TextInput
          value={authBahaiId}
          onChangeText={onChangeBahaiId}
          style={styles.authInput}
          placeholder="Bahai ID"
          autoCapitalize="characters"
          placeholderTextColor="#9b8a6a"
          editable={!isAuthenticating}
        />
        <TextInput
          value={authVerificationCode}
          onChangeText={onChangeVerificationCode}
          style={styles.authInput}
          placeholder="Verification code"
          autoCapitalize="none"
          placeholderTextColor="#9b8a6a"
          editable={!isAuthenticating}
        />
        <TextInput
          value={authPassword}
          onChangeText={onChangePassword}
          style={styles.authInput}
          placeholder="Password"
          secureTextEntry
          textContentType="newPassword"
          placeholderTextColor="#9b8a6a"
          editable={!isAuthenticating}
        />
        <TouchableOpacity
          onPress={onVerify}
          style={[
            styles.authPrimaryButton,
            isAuthenticating && styles.authPrimaryButtonDisabled,
          ]}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authPrimaryButtonLabel}>Verify and continue</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenRegister} style={styles.authLinkButton}>
          <Text style={styles.authLinkLabel}>Need a code? Register first</Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}
