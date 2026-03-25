import React from 'react';
import StartScreen from '../screens/StartScreen';
import SignInScreen from '../screens/SignInScreen';
import RegisterScreen from '../screens/RegisterScreen';
import VerifyRegistrationScreen from '../screens/VerifyRegistrationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import { Stack } from './StackNavigator';
import { getStackScreenOptions } from './stackOptions';

export default function AuthNavigator({ renderScreenSurface, screenState }) {
  const stackScreenOptions = getStackScreenOptions;

  const { styles, displayName, auth, handlers } = screenState;
  const {
    email: authEmail,
    bahaiId: authBahaiId,
    password: authPassword,
    verificationCode: authVerificationCode,
    resetToken: authResetToken,
    error: authError,
    isAuthenticating,
  } = auth;
  const {
    startSignIn,
    startRegister,
    openVerifyRegistration,
    openForgotPassword,
    openResetPassword,
    continueAsGuest,
    changeBahaiId,
    changeEmail,
    changePassword,
    changeVerificationCode,
    changeResetToken,
    signIn,
    register,
    verifyRegistration,
    requestPasswordReset,
    validateResetToken,
    resetPassword,
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
              onStartRegister={startRegister}
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
              onOpenRegister={startRegister}
              onOpenForgotPassword={openForgotPassword}
              onCancel={cancelSignIn}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="register">
        {() =>
          renderScreenSurface(
            <RegisterScreen
              styles={styles}
              authBahaiId={authBahaiId}
              authEmail={authEmail}
              authError={authError}
              isAuthenticating={isAuthenticating}
              onChangeBahaiId={changeBahaiId}
              onChangeEmail={changeEmail}
              onRegister={register}
              onOpenVerify={openVerifyRegistration}
              onOpenSignIn={startSignIn}
              onCancel={cancelSignIn}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="verify">
        {() =>
          renderScreenSurface(
            <VerifyRegistrationScreen
              styles={styles}
              authBahaiId={authBahaiId}
              authVerificationCode={authVerificationCode}
              authPassword={authPassword}
              authError={authError}
              isAuthenticating={isAuthenticating}
              onChangeBahaiId={changeBahaiId}
              onChangeVerificationCode={changeVerificationCode}
              onChangePassword={changePassword}
              onVerify={verifyRegistration}
              onOpenRegister={startRegister}
              onCancel={cancelSignIn}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="forgotPassword">
        {() =>
          renderScreenSurface(
            <ForgotPasswordScreen
              styles={styles}
              authEmail={authEmail}
              authError={authError}
              isAuthenticating={isAuthenticating}
              onChangeEmail={changeEmail}
              onSubmit={requestPasswordReset}
              onOpenResetPassword={openResetPassword}
              onOpenSignIn={startSignIn}
              onCancel={cancelSignIn}
            />,
          )
        }
      </Stack.Screen>
      <Stack.Screen name="resetPassword">
        {() =>
          renderScreenSurface(
            <ResetPasswordScreen
              styles={styles}
              authResetToken={authResetToken}
              authPassword={authPassword}
              authError={authError}
              isAuthenticating={isAuthenticating}
              onChangeResetToken={changeResetToken}
              onChangePassword={changePassword}
              onValidateToken={validateResetToken}
              onResetPassword={resetPassword}
              onOpenSignIn={startSignIn}
              onCancel={cancelSignIn}
            />,
          )
        }
      </Stack.Screen>
    </Stack.Navigator>
  );
}
