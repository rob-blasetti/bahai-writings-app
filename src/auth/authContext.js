import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  authenticateLiquidSpirit,
  registerLiquidSpirit,
  requestLiquidSpiritPasswordReset,
  resetLiquidSpiritPassword,
  validateLiquidSpiritResetToken,
  verifyLiquidSpiritRegistration,
} from './authService';
import {
  clearPersistedAuthState,
  loadPersistedAuthState,
  savePersistedAuthState,
} from './storage';
import {
  inferAuthExpirationMs,
  normalizeDisplayString,
  resolveAuthToken,
  resolveUserDisplayName,
  resolveUserEmail,
  resolveUserId,
} from './tokenUtils';

const AuthContext = createContext(null);

function normalizeObjectRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value;
}

function pickFirstObject(...candidates) {
  for (const candidate of candidates) {
    const normalized = normalizeObjectRecord(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function resolveAuthUserDetails(payload) {
  return pickFirstObject(
    payload?.user,
    payload?.data?.user,
    payload?.auth?.user,
    payload?.profile,
    payload?.data?.profile,
    payload?.auth?.profile,
  );
}

function resolveKaliUserDetails(payload) {
  return pickFirstObject(
    payload?.kaliUser,
    payload?.kali_user,
    payload?.data?.kaliUser,
    payload?.data?.kali_user,
    payload?.auth?.kaliUser,
    payload?.auth?.kali_user,
    payload?.user?.kaliUser,
    payload?.user?.kali_user,
    payload?.data?.user?.kaliUser,
    payload?.data?.user?.kali_user,
  );
}

function usePersistedUserState() {
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authBahaiId, setAuthBahaiId] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authVerificationCode, setAuthVerificationCode] = useState('');
  const [authResetToken, setAuthResetToken] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasHydratedAuth, setHasHydratedAuth] = useState(false);
  const [authMode, setAuthMode] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      const persisted = await loadPersistedAuthState();
      if (!isMounted) {
        return;
      }

      if (persisted?.mode === 'user') {
        const normalizedUser = {
          name: persisted.name ?? 'Kali',
          email: persisted.email ?? '',
          token: persisted.token ?? null,
          tokenExpiresAt: persisted.tokenExpiresAt ?? null,
          memberRef: persisted.memberRef ?? null,
          userId: persisted.userId ?? persisted.memberRef ?? null,
          user: normalizeObjectRecord(persisted.user),
          kaliUser: normalizeObjectRecord(persisted.kaliUser),
          rawPayload: normalizeObjectRecord(persisted.rawPayload),
        };
        setUser(normalizedUser);
        setAuthEmail(persisted.email ?? '');
        setAuthMode('user');
      }

      if (persisted?.mode === 'guest') {
        setUser(null);
        setAuthMode('guest');
      }

      setHasHydratedAuth(true);
    };

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    user,
    setUser,
    authEmail,
    setAuthEmail,
    authBahaiId,
    setAuthBahaiId,
    authPassword,
    setAuthPassword,
    authVerificationCode,
    setAuthVerificationCode,
    authResetToken,
    setAuthResetToken,
    authError,
    setAuthError,
    isAuthenticating,
    setIsAuthenticating,
    hasHydratedAuth,
    setHasHydratedAuth,
    authMode,
    setAuthMode,
  };
}

export function AuthProvider({ children }) {
  const {
    user,
    setUser,
    authEmail,
    setAuthEmail,
    authBahaiId,
    setAuthBahaiId,
    authPassword,
    setAuthPassword,
    authVerificationCode,
    setAuthVerificationCode,
    authResetToken,
    setAuthResetToken,
    authError,
    setAuthError,
    isAuthenticating,
    setIsAuthenticating,
    hasHydratedAuth,
    authMode,
    setAuthMode,
  } = usePersistedUserState();

  const normalizeUserFromPayload = useCallback(
    (payload, fallbackEmail) => {
      const inferredName = resolveUserDisplayName(
        payload,
        user?.name ?? 'Kali',
        fallbackEmail,
      );
      const normalizedEmailResponse = resolveUserEmail(payload, fallbackEmail);
      const resolvedEmail =
        normalizeDisplayString(normalizedEmailResponse) ?? fallbackEmail;
      const token = resolveAuthToken(payload);
      const tokenExpiresAt = inferAuthExpirationMs(payload, token);
      const memberRef = resolveUserId(payload, token);
      const resolvedUser = resolveAuthUserDetails(payload);
      const resolvedKaliUser = resolveKaliUserDetails(payload);

      return {
        name: inferredName,
        email: resolvedEmail,
        token,
        tokenExpiresAt: tokenExpiresAt ?? null,
        memberRef: memberRef ?? null,
        userId: memberRef ?? null,
        user: resolvedUser,
        kaliUser: resolvedKaliUser,
        rawPayload: normalizeObjectRecord(payload),
      };
    },
    [user?.name],
  );

  const signIn = useCallback(async () => {
    const trimmedEmail = authEmail.trim();
    const hasPassword = authPassword.length > 0;

    if (!trimmedEmail || !hasPassword) {
      const message = 'Enter both email and password to continue.';
      setAuthError(message);
      return { success: false, error: message };
    }

    setAuthEmail(trimmedEmail);
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await authenticateLiquidSpirit({
        email: trimmedEmail,
        password: authPassword,
      });
      const normalizedUser = normalizeUserFromPayload(result, trimmedEmail);
      setUser(normalizedUser);
      setAuthMode('user');
      await savePersistedAuthState({
        mode: 'user',
        ...normalizedUser,
        savedAt: Date.now(),
      });
      setAuthPassword('');
      return { success: true, user: normalizedUser, payload: result };
    } catch (error) {
      const message = error?.message ?? 'Unable to sign in. Please try again.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    authEmail,
    authPassword,
    normalizeUserFromPayload,
    setAuthEmail,
    setAuthError,
    setAuthMode,
    setAuthPassword,
    setIsAuthenticating,
    setUser,
  ]);

  const continueAsGuest = useCallback(async () => {
    setUser(null);
    setAuthError(null);
    setAuthPassword('');
    setAuthMode('guest');
    await savePersistedAuthState({
      mode: 'guest',
      savedAt: Date.now(),
    });
  }, [setAuthError, setAuthPassword, setAuthMode, setUser]);

  const register = useCallback(async () => {
    const trimmedBahaiId = authBahaiId.trim();
    const trimmedEmail = authEmail.trim();

    if (!trimmedBahaiId || !trimmedEmail) {
      const message = 'Enter both your Bahai ID and email to register.';
      setAuthError(message);
      return { success: false, error: message };
    }

    setAuthBahaiId(trimmedBahaiId);
    setAuthEmail(trimmedEmail);
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await registerLiquidSpirit({
        bahaiId: trimmedBahaiId,
        email: trimmedEmail,
      });
      return { success: true, payload: result };
    } catch (error) {
      const message = error?.message ?? 'Unable to register. Please try again.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    authBahaiId,
    authEmail,
    setAuthBahaiId,
    setAuthEmail,
    setAuthError,
    setIsAuthenticating,
  ]);

  const verifyRegistration = useCallback(async () => {
    const trimmedBahaiId = authBahaiId.trim();
    const trimmedVerificationCode = authVerificationCode.trim();
    const hasPassword = authPassword.length > 0;

    if (!trimmedBahaiId || !trimmedVerificationCode || !hasPassword) {
      const message = 'Enter your Bahai ID, verification code, and password.';
      setAuthError(message);
      return { success: false, error: message };
    }

    setAuthBahaiId(trimmedBahaiId);
    setAuthVerificationCode(trimmedVerificationCode);
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await verifyLiquidSpiritRegistration({
        bahaiId: trimmedBahaiId,
        verificationCode: trimmedVerificationCode,
        password: authPassword,
      });
      const normalizedUser = normalizeUserFromPayload(result, authEmail.trim());
      setUser(normalizedUser);
      setAuthMode('user');
      await savePersistedAuthState({
        mode: 'user',
        ...normalizedUser,
        savedAt: Date.now(),
      });
      setAuthPassword('');
      setAuthVerificationCode('');
      return { success: true, user: normalizedUser, payload: result };
    } catch (error) {
      const message = error?.message ?? 'Unable to verify registration.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    authBahaiId,
    authEmail,
    authPassword,
    authVerificationCode,
    normalizeUserFromPayload,
    setAuthBahaiId,
    setAuthError,
    setAuthMode,
    setAuthPassword,
    setAuthVerificationCode,
    setIsAuthenticating,
    setUser,
  ]);

  const requestPasswordReset = useCallback(async () => {
    const trimmedEmail = authEmail.trim();

    if (!trimmedEmail) {
      const message = 'Enter your email to reset your password.';
      setAuthError(message);
      return { success: false, error: message };
    }

    setAuthEmail(trimmedEmail);
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await requestLiquidSpiritPasswordReset({
        email: trimmedEmail,
      });
      return { success: true, payload: result };
    } catch (error) {
      const message =
        error?.message ?? 'Unable to request a password reset right now.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [authEmail, setAuthEmail, setAuthError, setIsAuthenticating]);

  const validateResetToken = useCallback(async () => {
    const trimmedToken = authResetToken.trim();

    if (!trimmedToken) {
      const message = 'Enter your reset token to continue.';
      setAuthError(message);
      return { success: false, error: message };
    }

    setAuthResetToken(trimmedToken);
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await validateLiquidSpiritResetToken(trimmedToken);
      return { success: true, payload: result };
    } catch (error) {
      const message = error?.message ?? 'Reset token is invalid or expired.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [authResetToken, setAuthError, setAuthResetToken, setIsAuthenticating]);

  const resetPassword = useCallback(async () => {
    const trimmedToken = authResetToken.trim();
    const hasPassword = authPassword.length > 0;

    if (!trimmedToken || !hasPassword) {
      const message = 'Enter your reset token and new password.';
      setAuthError(message);
      return { success: false, error: message };
    }

    setAuthResetToken(trimmedToken);
    setIsAuthenticating(true);
    setAuthError(null);

    try {
      const result = await resetLiquidSpiritPassword({
        token: trimmedToken,
        newPassword: authPassword,
      });
      setAuthPassword('');
      return { success: true, payload: result };
    } catch (error) {
      const message = error?.message ?? 'Unable to reset your password.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [
    authPassword,
    authResetToken,
    setAuthError,
    setAuthPassword,
    setAuthResetToken,
    setIsAuthenticating,
  ]);

  const logout = useCallback(async () => {
    setIsAuthenticating(false);
    setUser(null);
    setAuthPassword('');
    setAuthError(null);
    setAuthMode(null);
    try {
      await clearPersistedAuthState();
    } catch (error) {
      console.warn('[Auth] Unable to clear persisted auth during logout', error);
    }
  }, [setAuthError, setAuthPassword, setAuthMode, setIsAuthenticating, setUser]);

  const value = useMemo(
    () => ({
      user,
      authEmail,
      setAuthEmail,
      authBahaiId,
      setAuthBahaiId,
      authPassword,
      setAuthPassword,
      authVerificationCode,
      setAuthVerificationCode,
      authResetToken,
      setAuthResetToken,
      authError,
      setAuthError,
      isAuthenticating,
      hasHydratedAuth,
      authMode,
      isGuest: authMode === 'guest',
      signIn,
      register,
      verifyRegistration,
      requestPasswordReset,
      validateResetToken,
      resetPassword,
      continueAsGuest,
      logout,
    }),
    [
      authBahaiId,
      authEmail,
      authError,
      authPassword,
      authResetToken,
      authVerificationCode,
      authMode,
      continueAsGuest,
      hasHydratedAuth,
      isAuthenticating,
      logout,
      register,
      requestPasswordReset,
      resetPassword,
      setAuthEmail,
      setAuthBahaiId,
      setAuthError,
      setAuthPassword,
      setAuthResetToken,
      setAuthVerificationCode,
      signIn,
      validateResetToken,
      verifyRegistration,
      user,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
