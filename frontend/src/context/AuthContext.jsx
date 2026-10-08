import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setUnauthorizedHandler, tokenStore } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(tokenStore.get()));

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!tokenStore.get()) return undefined;
    let ignore = false;

    api.auth
      .me()
      .then(({ user: current }) => {
        if (!ignore) setUser(current);
      })
      .catch(() => tokenStore.clear())
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { token, user: current } = await api.auth.login({ email, password });
    tokenStore.set(token);
    setUser(current);
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { token, user: current } = await api.auth.register({ name, email, password });
    tokenStore.set(token);
    setUser(current);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
};
