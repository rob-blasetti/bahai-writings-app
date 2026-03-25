import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BaseScreen from '../components/BaseScreen';

export default function ForgotPasswordScreen({
  styles,
  authEmail,
  authError,
  isAuthenticating,
  onChangeEmail,
  onSubmit,
  onOpenResetPassword,
  onOpenSignIn,
  onCancel,
}) {
  return (
    <BaseScreen
      styles={styles}
      topNav={{ backAccessibilityLabel: 'Back', onBack: onCancel }}
    >
      <View style={styles.authFormContainer}>
        <Text style={styles.authFormTitle}>Forgot password</Text>
        <Text style={styles.authFormSubtitle}>
          Enter your email and we&apos;ll send you a reset link.
        </Text>
        {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}
        <TextInput
          value={authEmail}
          onChangeText={onChangeEmail}
          style={styles.authInput}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholderTextColor="#9b8a6a"
          editable={!isAuthenticating}
        />
        <TouchableOpacity
          onPress={onSubmit}
          style={[
            styles.authPrimaryButton,
            isAuthenticating && styles.authPrimaryButtonDisabled,
          ]}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authPrimaryButtonLabel}>Send reset email</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenResetPassword} style={styles.authLinkButton}>
          <Text style={styles.authLinkLabel}>Already have a token? Reset password</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenSignIn} style={styles.authLinkButton}>
          <Text style={styles.authLinkLabel}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}
