import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authenticateLiquidSpirit } from './authService';
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

function usePersistedUserState() {
  const [user, setUser] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [hasHydratedAuth, setHasHydratedAuth] = useState(false);

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
        };
        setUser(normalizedUser);
        setAuthEmail(persisted.email ?? '');
      }

      if (persisted?.mode === 'guest') {
        setUser(null);
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
    authPassword,
    setAuthPassword,
    authError,
    setAuthError,
    isAuthenticating,
    setIsAuthenticating,
    hasHydratedAuth,
    setHasHydratedAuth,
  };
}

export function AuthProvider({ children }) {
  const {
    user,
    setUser,
    authEmail,
    setAuthEmail,
    authPassword,
    setAuthPassword,
    authError,
    setAuthError,
    isAuthenticating,
    setIsAuthenticating,
    hasHydratedAuth,
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

      return {
        name: inferredName,
        email: resolvedEmail,
        token,
        tokenExpiresAt: tokenExpiresAt ?? null,
        memberRef: memberRef ?? null,
        userId: memberRef ?? null,
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
      await savePersistedAuthState({
        mode: 'user',
        ...normalizedUser,
        savedAt: Date.now(),
      });
      setAuthPassword('');
      return { success: true, user: normalizedUser };
    } catch (error) {
      const message = error?.message ?? 'Unable to sign in. Please try again.';
      setAuthError(message);
      return { success: false, error: message };
    } finally {
      setIsAuthenticating(false);
    }
  }, [authEmail, authPassword, normalizeUserFromPayload]);

  const continueAsGuest = useCallback(async () => {
    setUser(null);
    setAuthError(null);
    setAuthPassword('');
    await savePersistedAuthState({
      mode: 'guest',
      savedAt: Date.now(),
    });
  }, [setAuthError, setAuthPassword, setUser]);

  const logout = useCallback(async () => {
    setIsAuthenticating(false);
    setUser(null);
    setAuthPassword('');
    setAuthError(null);
    try {
      await clearPersistedAuthState();
    } catch (error) {
      console.warn('[Auth] Unable to clear persisted auth during logout', error);
    }
  }, [setAuthError, setAuthPassword, setIsAuthenticating, setUser]);

  const value = useMemo(
    () => ({
      user,
      authEmail,
      setAuthEmail,
      authPassword,
      setAuthPassword,
      authError,
      setAuthError,
      isAuthenticating,
      hasHydratedAuth,
      signIn,
      continueAsGuest,
      logout,
    }),
    [
      authEmail,
      authError,
      authPassword,
      continueAsGuest,
      hasHydratedAuth,
      isAuthenticating,
      logout,
      setAuthEmail,
      setAuthError,
      setAuthPassword,
      signIn,
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
