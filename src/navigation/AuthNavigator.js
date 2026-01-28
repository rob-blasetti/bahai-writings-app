import React, { useCallback } from 'react';
import StartScreen from '../screens/StartScreen';
import SignInScreen from '../screens/SignInScreen';
import { Stack } from './StackNavigator';
import { isBottomTabRoute } from './BottomTabs';

export default function AuthNavigator({ renderScreenSurface, screenState }) {
  const stackScreenOptions = useCallback(({ route }) => {
    const isBottomTabScreen = isBottomTabRoute(route.name);
    if (isBottomTabScreen) {
      return {
        headerShown: false,
        gestureEnabled: false,
        fullScreenGestureEnabled: false,
        animation: 'none',
      };
    }
    return {
      headerShown: false,
      gestureEnabled: true,
      fullScreenGestureEnabled: true,
      animation: 'slide_from_right',
    };
  }, []);

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
