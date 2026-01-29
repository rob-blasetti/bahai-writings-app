import React from 'react';
import StartScreen from '../screens/StartScreen';
import SignInScreen from '../screens/SignInScreen';
import { Stack } from './StackNavigator';
import { getStackScreenOptions } from './stackOptions';

export default function AuthNavigator({ renderScreenSurface, screenState }) {
  const stackScreenOptions = getStackScreenOptions;

  const { styles, displayName, auth, handlers } = screenState;
  const {
    email: authEmail,
    password: authPassword,
    error: authError,
    isAuthenticating,
  } = auth;
  const {
    startSignIn,
    continueAsGuest,
    changeEmail,
    changePassword,
    signIn,
    cancelSignIn,
  } = handlers;

  return (
    <Stack.Navigator initialRouteName="start" screenOptions={stackScreenOptions}>
      <Stack.Screen name="start">
        {() =>
          renderScreenSurface(
            <StartScreen
              styles={styles}
              displayName={displayName}
              onStartSignIn={startSignIn}
              onContinueAsGuest={continueAsGuest}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="signin">
        {() =>
          renderScreenSurface(
            <SignInScreen
              styles={styles}
              authEmail={authEmail}
              authPassword={authPassword}
              authError={authError}
              isAuthenticating={isAuthenticating}
              onChangeEmail={changeEmail}
              onChangePassword={changePassword}
              onSignIn={signIn}
              onCancel={cancelSignIn}
            />,
          )
        }
      </Stack.Screen>
    </Stack.Navigator>
  );
}
