import React from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SignInScreen({
  styles,
  authEmail,
  authPassword,
  authError,
  isAuthenticating,
  onChangeEmail,
  onChangePassword,
  onSignIn,
  onCancel,
}) {
  return (
    <View style={styles.screenSurface}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Text style={styles.backButtonLabel}>Back</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.authFormContainer}>
        <Text style={styles.authFormTitle}>Sign in to Liquid Spirit</Text>
        <Text style={styles.authFormSubtitle}>
          Enter your email and password to continue.
        </Text>
        {authError ? (
          <Text style={styles.authErrorText}>{authError}</Text>
        ) : null}
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
        <TextInput
          value={authPassword}
          onChangeText={onChangePassword}
          style={styles.authInput}
          placeholder="Password"
          secureTextEntry
          textContentType="password"
          placeholderTextColor="#9b8a6a"
          editable={!isAuthenticating}
        />
        <TouchableOpacity
          onPress={onSignIn}
          style={[
            styles.authPrimaryButton,
            isAuthenticating && styles.authPrimaryButtonDisabled,
          ]}
          disabled={isAuthenticating}
        >
          {isAuthenticating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.authPrimaryButtonLabel}>Sign In</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
