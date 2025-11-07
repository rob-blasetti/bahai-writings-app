import React, { useState } from 'react';
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationTopBar } from '../components/NavigationTopBar';
import Ionicons from 'react-native-vector-icons/Ionicons';

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
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  return (
    <View style={styles.screenSurface}>
      <NavigationTopBar
        styles={styles}
        onBack={onCancel}
        backAccessibilityLabel="Back"
      />
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
        <View style={styles.authPasswordInputContainer}>
          <TextInput
            value={authPassword}
            onChangeText={onChangePassword}
            style={styles.authPasswordInput}
            placeholder="Password"
            secureTextEntry={!isPasswordVisible}
            textContentType="password"
            placeholderTextColor="#9b8a6a"
            editable={!isAuthenticating}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(prev => !prev)}
            accessibilityRole="button"
            accessibilityLabel={
              isPasswordVisible ? 'Hide password' : 'Show password'
            }
            style={styles.authPasswordToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#6f5a35"
            />
          </TouchableOpacity>
        </View>
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
