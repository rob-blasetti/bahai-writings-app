import { useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

import { UserContext } from '../contexts/UserContext';
import { API_URL } from '../config';

const decodeToken = token => {
  if (!token) {
    return null;
  }

  try {
    return jwtDecode(token);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

const extractUserId = decodedToken => {
  if (!decodedToken) {
    return null;
  }

  return (
    decodedToken.memberRef ||
    decodedToken.userId ||
    decodedToken.id ||
    decodedToken._id ||
    decodedToken.actorId ||
    decodedToken.sub ||
    null
  );
};

const resolveUserIdFromToken = tokenValue => {
  if (!tokenValue) {
    return null;
  }

  const decoded = decodeToken(tokenValue);
  return extractUserId(decoded);
};

export const useAuthService = () => {
  const { token, setToken } = useContext(UserContext);

  useEffect(() => {
    if (!token) {
      console.log('[AuthService] No token set');
      return;
    }

    const decodedUser = decodeToken(token);
    if (decodedUser) {
      console.log('[AuthService] Current user payload:', decodedUser);
    } else {
      console.warn('[AuthService] Unable to decode current token');
    }
  }, [token]);

  const signIn = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-in error: ${error.message}`);
    }
  };

  const signUp = async (email, bahaiId, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, bahaiId, password }),
      });
      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const verify = async (bahaiId, verificationCode, password) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bahaiId, verificationCode, password }),
      });
      const data = await response.json();
      console.log('data: ', data);

      if (response.ok && data.token) {
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const forgotPassword = async email => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
      }

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-up error: ${error.message}`);
    }
  };

  const forgotBahaiId = async email => {
    try {
      const response = await fetch(`${API_URL}/api/auth/forgot-bahai-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Forgot Bahá'í ID error: ${error.message}`);
    }
  };

  const fetchHomeOverview = async communityId => {
    try {
      const response = await fetch(
        `${API_URL}/api/auth/homeOverview/${communityId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      const data = await response.json();

      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Home overview error: ${error.message}`);
    }
  };

  const fetchMe = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Sign-in error: ${error.message}`);
    }
  };

  const updateMe = async updatedUser => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedUser),
      });

      const data = await response.json();
      return { ok: response.ok, data };
    } catch (error) {
      throw new Error(`Update error: ${error.message}`);
    }
  };

  const getCurrentUserId = () => resolveUserIdFromToken(token);

  const checkTokenExpiration = () => {
    if (!token) {
      console.error('No token found');
      return { isValid: false, reason: 'No token found' };
    }

    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Invalid token format');
      return { isValid: false, reason: 'Invalid token format' };
    }

    try {
      const decodedToken = decodeToken(token);

      if (decodedToken.exp * 1000 < Date.now()) {
        console.warn('Token has expired');
        return { isValid: false, reason: 'Token expired' };
      }

      return { isValid: true };
    } catch (error) {
      console.error('Error decoding token', error);
      return { isValid: false, reason: 'Error decoding token' };
    }
  };

  const googleSignIn = async idToken => {
    try {
      const response = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: idToken }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        setToken(data.token);
        return { ok: true, data };
      }

      return { ok: false, data };
    } catch (error) {
      throw new Error(`Google sign-in error: ${error.message}`);
    }
  };

  const fetchGoogleUserInfo = () => {
    if (!token) {
      return null;
    }
    const decoded = decodeToken(token);
    if (!decoded) {
      return null;
    }
    return decoded;
  };

  const deleteAccount = async (userId, authToken = token) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/delete-user/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.status === 204) {
        return { ok: true };
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      return { ok: true };
    } catch (error) {
      console.error('Delete account error:', error);
      return { ok: false, message: error.message };
    }
  };

  return {
    token,
    signIn,
    signUp,
    verify,
    forgotPassword,
    forgotBahaiId,
    fetchMe,
    updateMe,
    getCurrentUserId,
    checkTokenExpiration,
    googleSignIn,
    fetchGoogleUserInfo,
    deleteAccount,
    fetchHomeOverview,
  };
};

export const getCurrentUserId = tokenValue => resolveUserIdFromToken(tokenValue);
