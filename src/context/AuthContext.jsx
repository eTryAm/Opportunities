import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  authApi,
  clearToken,
  getToken,
  isRemembered,
  setToken,
  setUnauthorizedHandler,
} from '../admin/services/adminApi';
import { AuthContext } from './authStore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState(null);

  const logout = useCallback(async () => {
    try {
      if (getToken()) await authApi.logout();
    } catch {
      // ignore logout errors
    } finally {
      clearToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      setSessionMessage(message);
      setUser(null);
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    const init = async () => {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const data = await authApi.me();
        setUser(data.user || data);
      } catch {
        clearToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email, password, remember = false) => {
    const data = await authApi.login(email, password);
    setToken(data.token, remember);
    setUser(data.user || data.admin);
    setSessionMessage(null);
    return data;
  }, []);

  const clearSessionMessage = useCallback(() => setSessionMessage(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isRemembered: isRemembered(),
      sessionMessage,
      login,
      logout,
      clearSessionMessage,
    }),
    [user, loading, sessionMessage, login, logout, clearSessionMessage],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
