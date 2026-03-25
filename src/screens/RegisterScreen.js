import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BaseScreen from '../components/BaseScreen';

export default function RegisterScreen({
  styles,
  authBahaiId,
  authEmail,
  authError,
  isAuthenticating,
  onChangeBahaiId,
  onChangeEmail,
  onRegister,
  onOpenVerify,
  onOpenSignIn,
  onCancel,
}) {
  return (
    <BaseScreen
      styles={styles}
      topNav={{ backAccessibilityLabel: 'Back', onBack: onCancel }}
    >
      <View style={styles.authFormContainer}>
        <Text style={styles.authFormTitle}>Register</Text>
        <Text style={styles.authFormSubtitle}>
          Enter your Bahai ID and email to receive a verification code.
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
          onPress={onRegister}
          style={[
            styles.authPrimaryButton,
            isAuthenticating && styles.authPrimaryButtonDisabled,
          ]}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authPrimaryButtonLabel}>Register</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenVerify} style={styles.authLinkButton}>
          <Text style={styles.authLinkLabel}>Already have a code? Verify account</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOpenSignIn} style={styles.authLinkButton}>
          <Text style={styles.authLinkLabel}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </BaseScreen>
  );
}
