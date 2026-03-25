import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BaseScreen from '../components/BaseScreen';

export default function ResetPasswordScreen({
  styles,
  authResetToken,
  authPassword,
  authError,
  isAuthenticating,
  onChangeResetToken,
  onChangePassword,
  onValidateToken,
  onResetPassword,
  onOpenSignIn,
  onCancel,
}) {
  return (
    <BaseScreen
      styles={styles}
      topNav={{ backAccessibilityLabel: 'Back', onBack: onCancel }}
    >
      <View style={styles.authFormContainer}>
        <Text style={styles.authFormTitle}>Reset password</Text>
        <Text style={styles.authFormSubtitle}>
          Paste your reset token and choose a new password.
        </Text>
        {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}
        <TextInput
          value={authResetToken}
          onChangeText={onChangeResetToken}
          style={styles.authInput}
          placeholder="Reset token"
          autoCapitalize="none"
          placeholderTextColor="#9b8a6a"
          editable={!isAuthenticating}
        />
        <TextInput
          value={authPassword}
          onChangeText={onChangePassword}
          style={styles.authInput}
          placeholder="New password"
          secureTextEntry
          textContentType="newPassword"
          placeholderTextColor="#9b8a6a"
          editable={!isAuthenticating}
        />
        <TouchableOpacity
          onPress={onValidateToken}
          style={styles.authSecondaryButton}
          disabled={isAuthenticating}
        >
          <Text style={styles.authSecondaryButtonLabel}>Validate token</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onResetPassword}
          style={[
            styles.authPrimaryButton,
            isAuthenticating && styles.authPrimaryButtonDisabled,
          ]}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authPrimaryButtonLabel}>Reset password</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenSignIn} style={styles.authLinkButton}>
          <Text style={styles.authLinkLabel}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}
